import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import { read, utils } from 'xlsx';
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
};

type ValidationError = {
  row: number;
  column: string;
  message: string;
};

export default function TransactionUpload() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadStats, setUploadStats] = useState({ total: 0, success: 0, failed: 0 });

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

  const validateTransactions = (data: any[]): [ParsedTransaction[], ValidationError[]] => {
    const validTransactions: ParsedTransaction[] = [];
    const validationErrors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Add 2 to account for header row and 0-based index
      const errors: ValidationError[] = [];

      // Validate date
      if (!row.date || !Date.parse(row.date)) {
        errors.push({
          row: rowNumber,
          column: 'date',
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Validate type
      if (!row.type || !['income', 'expense'].includes(row.type.toLowerCase())) {
        errors.push({
          row: rowNumber,
          column: 'type',
          message: 'Type must be either "income" or "expense"'
        });
      }

      // Validate category
      const category = categories.find(c => 
        c.name.toLowerCase() === row.category?.toLowerCase() &&
        c.income_category === (row.type?.toLowerCase() === 'income')
      );
      
      if (!category) {
        errors.push({
          row: rowNumber,
          column: 'category',
          message: `Category "${row.category}" not found for type ${row.type}`
        });
      }

      // Validate amount
      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push({
          row: rowNumber,
          column: 'amount',
          message: 'Amount must be a positive number'
        });
      }

      if (errors.length === 0) {
        validTransactions.push({
          date: new Date(row.date).toISOString().split('T')[0],
          type: row.type.toLowerCase(),
          category_id: category!.id,
          amount: amount,
          description: row.description || undefined
        });
      } else {
        validationErrors.push(...errors);
      }
    });

    return [validTransactions, validationErrors];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setParsedData([]);
    setErrors([]);
    setUploadStatus('idle');
    setUploadStats({ total: 0, success: 0, failed: 0 });

    // Fetch categories if not already loaded
    if (categories.length === 0) {
      await fetchCategories();
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);

        const [validTransactions, validationErrors] = validateTransactions(jsonData);
        setParsedData(validTransactions);
        setErrors(validationErrors);
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
          ...transaction,
          user_id: user.id
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
    } catch (error) {
      console.error('Error uploading transactions:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        date: '2024-02-15',
        type: 'expense',
        category: 'Groceries',
        amount: '150.50',
        description: 'Weekly grocery shopping'
      },
      {
        date: '2024-02-15',
        type: 'income',
        category: 'Salary',
        amount: '5000.00',
        description: 'Monthly salary'
      }
    ];

    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    
    // Generate and download file
    const fileName = 'transaction_upload_template.xlsx';
    utils.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            to="/transactions" 
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Transactions
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Transactions</h1>
          <p className="text-gray-600">
            Import your transactions from a spreadsheet file (CSV or XLSX).
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Instructions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">1. Prepare Your File</h3>
              <p className="text-gray-600 mb-2">
                Your spreadsheet should have the following columns:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <code className="text-sm">
                  date, type, category, amount, description (optional)
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">2. Format Requirements</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Date: YYYY-MM-DD format (e.g., 2024-02-15)</li>
                <li>Type: Either "income" or "expense"</li>
                <li>Category: Must match one of your existing categories</li>
                <li>Amount: Positive number (e.g., 150.50)</li>
                <li>Description: Optional text description</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">3. Download Template</h3>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
              >
                <Download size={16} />
                Download Example Template
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <label 
              className="block w-full cursor-pointer"
            >
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to select or drag and drop your file here
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: CSV, XLSX
                </p>
              </div>
            </label>
          </div>

          {errors.length > 0 && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  <AlertCircle size={20} />
                  Validation Errors
                </div>
                <ul className="space-y-1 text-sm text-red-700">
                  {errors.map((error, index) => (
                    <li key={index}>
                      Row {error.row}, {error.column}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {parsedData.length > 0 && errors.length === 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 size={20} />
                  <span>
                    {parsedData.length} valid transaction{parsedData.length !== 1 ? 's' : ''} ready to upload
                  </span>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Transactions
                  </>
                )}
              </button>

              {uploadStatus !== 'idle' && (
                <div className={`mt-4 p-4 rounded-lg ${
                  uploadStatus === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {uploadStatus === 'success' ? (
                      <CheckCircle2 className="text-green-600" size={20} />
                    ) : (
                      <XCircle className="text-red-600" size={20} />
                    )}
                    <div>
                      <p className={`font-medium ${
                        uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        Upload {uploadStatus === 'success' ? 'Complete' : 'Completed with Errors'}
                      </p>
                      <p className="text-sm text-gray-600">
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
    </div>
  );
}