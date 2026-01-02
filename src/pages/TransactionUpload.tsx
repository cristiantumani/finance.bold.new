import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Category = {
  id: string;
  name: string;
  income_category: boolean;
};

type ParsedTransaction = {
  date: string;
  type: 'income' | 'expense';
  category_id: string;
  amount: number;
  description?: string;
  category_name?: string; // For display purposes
};

type ValidationError = {
  row: number;
  column: string;
  message: string;
};

export default function TransactionUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadStats, setUploadStats] = useState({ total: 0, success: 0, failed: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [user]);

  const findOrCreateCategory = async (name: string, isIncome: boolean): Promise<Category | null> => {
    if (!user) return null;

    try {
      // First, check if the category already exists in the database
      const { data: existingCategory, error: queryError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', name)
        .eq('income_category', isIncome)
        .single();

      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw queryError;
      }

      if (existingCategory) {
        return existingCategory;
      }

      // If category doesn't exist, create it
      const { data: newCategory, error: insertError } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: name,
          income_category: isIncome,
          expense_type: isIncome ? null : 'variable' // Default to variable for expense categories
        }])
        .select()
        .single();

      if (insertError) {
        // If we get a duplicate key error, try fetching the category one more time
        // as it might have been created by another concurrent operation
        if (insertError.code === '23505') {
          const { data: retryCategory, error: retryError } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .eq('name', name)
            .eq('income_category', isIncome)
            .single();

          if (retryError) throw retryError;
          return retryCategory;
        }
        throw insertError;
      }

      // Update local categories state
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Error finding or creating category:', error);
      return null;
    }
  };

  const formatExcelDate = (date: any): string => {
    let dateStr = '';
    
    if (date instanceof Date) {
      // Format Date object to YYYY-MM-DD
      dateStr = date.toISOString().split('T')[0];
    } else if (typeof date === 'number') {
      // Handle Excel serial number dates
      const excelEpoch = new Date(1899, 11, 30);
      const dateObj = new Date(excelEpoch.getTime() + (date * 24 * 60 * 60 * 1000));
      dateStr = dateObj.toISOString().split('T')[0];
    } else {
      // Handle string dates
      dateStr = String(date).trim();
    }

    return dateStr;
  };

  const validateTransactions = async (data: any[]): Promise<[ParsedTransaction[], ValidationError[]]> => {
    const validTransactions: ParsedTransaction[] = [];
    const validationErrors: ValidationError[] = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2; // Add 2 to account for header row and 0-based index
      const errors: ValidationError[] = [];

      // Handle date formatting
      const dateStr = formatExcelDate(row.date);

      // Validate date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateStr || !dateRegex.test(dateStr) || !Date.parse(dateStr)) {
        errors.push({
          row: rowNumber,
          column: 'date',
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Convert type to lowercase string and trim
      const typeStr = String(row.type || '').trim().toLowerCase();

      // Validate type
      if (!typeStr || !['income', 'expense'].includes(typeStr)) {
        errors.push({
          row: rowNumber,
          column: 'type',
          message: 'Type must be either "income" or "expense"'
        });
      }

      // Convert category to string and trim
      const categoryStr = String(row.category || '').trim();

      // Convert amount to number
      const amount = typeof row.amount === 'number' 
        ? row.amount 
        : parseFloat(String(row.amount).replace(/[^0-9.-]+/g, ''));

      // Validate amount
      if (isNaN(amount) || amount <= 0) {
        errors.push({
          row: rowNumber,
          column: 'amount',
          message: 'Amount must be a positive number'
        });
      }

      if (errors.length === 0) {
        const category = await findOrCreateCategory(categoryStr, typeStr === 'income');

        if (category) {
          validTransactions.push({
            date: dateStr,
            type: typeStr as 'income' | 'expense',
            category_id: category.id,
            category_name: category.name,
            amount: amount,
            description: row.description ? String(row.description).trim() : undefined
          });
        } else {
          errors.push({
            row: rowNumber,
            column: 'category',
            message: 'Failed to create or find category'
          });
          validationErrors.push(...errors);
        }
      } else {
        validationErrors.push(...errors);
      }
    }

    return [validTransactions, validationErrors];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParsedData([]);
    setErrors([]);
    setUploadStatus('idle');
    setUploadStats({ total: 0, success: 0, failed: 0 });
    setShowPreview(false);

    // Fetch categories if not already loaded
    if (categories.length === 0) {
      await fetchCategories();
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);

        const [validTransactions, validationErrors] = await validateTransactions(jsonData);
        setParsedData(validTransactions);
        setErrors(validationErrors);

        if (validTransactions.length > 0 && validationErrors.length === 0) {
          setShowPreview(true);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setErrors([{ row: 0, column: 'file', message: 'Error reading file' }]);
    }
  };

  const handleUpload = async () => {
    if (!user || parsedData.length === 0) return;

    setUploading(true);
    setUploadStatus('idle');
    let successCount = 0;
    let failedCount = 0;

    try {
      // Upload transactions in batches of 50
      const batchSize = 50;
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize).map(transaction => ({
          user_id: user.id,
          date: transaction.date,
          type: transaction.type,
          category_id: transaction.category_id,
          amount: transaction.amount,
          description: transaction.description
        }));

        const { error } = await supabase
          .from('transactions')
          .insert(batch);

        if (error) {
          console.error('Error uploading batch:', error);
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }

        setUploadStats({
          total: parsedData.length,
          success: successCount,
          failed: failedCount
        });
      }

      setUploadStatus(failedCount === 0 ? 'success' : 'error');
      
      if (failedCount === 0) {
        // Wait a bit before redirecting
        setTimeout(() => {
          navigate('/transactions');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading transactions:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    const template = [
      {
        date: today,
        type: 'expense',
        category: 'Groceries',
        amount: 150.50,
        description: 'Weekly grocery shopping'
      },
      {
        date: today,
        type: 'income',
        category: 'Salary',
        amount: 5000.00,
        description: 'Monthly salary'
      }
    ];

    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    writeFile(wb, 'transaction_template.xlsx');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/transactions"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Transactions
          </Link>
          <h1 className="text-2xl font-bold text-dark-50 mb-2">Upload Transactions</h1>
          <p className="text-dark-300">
            Import your transactions from a CSV or Excel file.
          </p>
        </div>

        {!showPreview ? (
          <>
            <div className="bg-dark-800 rounded-xl shadow-sm border border-dark-700 p-6 mb-8">
              <h2 className="text-lg font-semibold text-dark-50 mb-4">Instructions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-dark-100 mb-2">1. Prepare Your File</h3>
                  <p className="text-dark-300 mb-2">
                    Your file should have the following columns:
                  </p>
                  <div className="bg-dark-900 p-4 rounded-lg">
                    <code className="text-sm text-dark-200">
                      date, type, category, amount, description (optional)
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-dark-100 mb-2">2. Format Requirements</h3>
                  <ul className="list-disc list-inside text-dark-300 space-y-1">
                    <li>Date: YYYY-MM-DD format (e.g., 2024-02-15)</li>
                    <li>Type: Either "income" or "expense"</li>
                    <li>Category: Any category name (will be created if it doesn't exist)</li>
                    <li>Amount: Positive number (e.g., 150.50)</li>
                    <li>Description: Optional text description</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-dark-100 mb-2">3. Download Template</h3>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 rounded-xl shadow-sm border border-dark-700 p-6">
              <div className="mb-6">
                <label className="block w-full cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                  <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-dark-400" />
                    <p className="mt-2 text-sm text-dark-200">
                      Click to select or drag and drop your file here
                    </p>
                    <p className="text-xs text-dark-400">
                      Supported formats: CSV, XLSX
                    </p>
                  </div>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-dark-300">
                  <FileSpreadsheet size={16} />
                  <span>{selectedFile.name}</span>
                </div>
              )}

              {errors.length > 0 && (
                <div className="mt-6">
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-300 font-medium mb-2">
                      <AlertCircle size={20} />
                      Validation Errors
                    </div>
                    <ul className="space-y-1 text-sm text-red-200">
                      {errors.map((error, index) => (
                        <li key={index}>
                          Row {error.row}, {error.column}: {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-dark-50">Preview Transactions</h2>
                <p className="text-sm text-dark-300">
                  Review the transactions before importing
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedFile(null);
                    setParsedData([]);
                  }}
                  className="text-dark-300 hover:text-dark-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Import Transactions
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-700">
                  <thead className="bg-dark-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-700">
                    {parsedData.map((transaction, index) => (
                      <tr key={index} className="hover:bg-dark-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {transaction.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {transaction.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {uploadStatus !== 'idle' && (
              <div className={`mt-4 p-4 rounded-lg ${
                uploadStatus === 'success'
                  ? 'bg-green-900/20 border border-green-700'
                  : 'bg-red-900/20 border border-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {uploadStatus === 'success' ? (
                    <CheckCircle2 className="text-green-400" size={20} />
                  ) : (
                    <XCircle className="text-red-400" size={20} />
                  )}
                  <div>
                    <p className={`font-medium ${
                      uploadStatus === 'success' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      Upload {uploadStatus === 'success' ? 'Complete' : 'Completed with Errors'}
                    </p>
                    <p className="text-sm text-dark-300">
                      {uploadStats.success} successful, {uploadStats.failed} failed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}