import React, { useState } from 'react';
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

type ParsedCategory = {
  name: string;
  expense_type: 'fixed' | 'variable' | 'controllable_fixed' | null;
  income_category: boolean;
};

type ValidationError = {
  row: number;
  column: string;
  message: string;
};

export default function CategoryUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parsedData, setParsedData] = useState<ParsedCategory[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadStats, setUploadStats] = useState({ total: 0, success: 0, failed: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const validateCategories = (data: any[]): [ParsedCategory[], ValidationError[]] => {
    const validCategories: ParsedCategory[] = [];
    const validationErrors: ValidationError[] = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2; // Add 2 to account for header row and 0-based index
      const errors: ValidationError[] = [];

      // Convert name to string and trim
      const name = String(row.name || '').trim();

      // Validate name
      if (!name) {
        errors.push({
          row: rowNumber,
          column: 'name',
          message: 'Category name is required'
        });
      }

      // Parse income_category (convert various formats to boolean)
      const incomeCategoryStr = String(row.income_category || 'false').trim().toLowerCase();
      const incomeCategory = ['true', 'yes', '1', 'income'].includes(incomeCategoryStr);

      // Parse expense_type (only for expense categories)
      let expenseType: 'fixed' | 'variable' | 'controllable_fixed' | null = null;
      if (!incomeCategory) {
        const expenseTypeStr = String(row.expense_type || 'variable').trim().toLowerCase();

        if (!['fixed', 'variable', 'controllable_fixed'].includes(expenseTypeStr)) {
          errors.push({
            row: rowNumber,
            column: 'expense_type',
            message: 'expense_type must be "fixed", "variable", or "controllable_fixed"'
          });
        } else {
          expenseType = expenseTypeStr as 'fixed' | 'variable' | 'controllable_fixed';
        }
      }

      if (errors.length === 0) {
        validCategories.push({
          name,
          expense_type: expenseType,
          income_category: incomeCategory
        });
      } else {
        validationErrors.push(...errors);
      }
    }

    return [validCategories, validationErrors];
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

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);

        const [validCategories, validationErrors] = validateCategories(jsonData);
        setParsedData(validCategories);
        setErrors(validationErrors);

        if (validCategories.length > 0 && validationErrors.length === 0) {
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
      // Upload categories one by one (to handle duplicates gracefully)
      for (const category of parsedData) {
        try {
          // Check if category already exists
          const { data: existing, error: queryError } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', category.name)
            .maybeSingle();

          if (queryError && queryError.code !== 'PGRST116') {
            throw queryError;
          }

          if (existing) {
            // Category exists, skip
            failedCount++;
            continue;
          }

          // Insert new category
          const { error: insertError } = await supabase
            .from('categories')
            .insert({
              user_id: user.id,
              name: category.name,
              expense_type: category.expense_type,
              income_category: category.income_category
            });

          if (insertError) {
            if (insertError.code === '23505') {
              // Duplicate key, skip
              failedCount++;
            } else {
              throw insertError;
            }
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error uploading category:', error);
          failedCount++;
        }

        setUploadStats({
          total: parsedData.length,
          success: successCount,
          failed: failedCount
        });
      }

      setUploadStatus(failedCount === 0 ? 'success' : 'error');

      if (successCount > 0) {
        // Wait a bit before redirecting
        setTimeout(() => {
          navigate('/categories');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading categories:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Groceries',
        expense_type: 'variable',
        income_category: 'false'
      },
      {
        name: 'Rent',
        expense_type: 'fixed',
        income_category: 'false'
      },
      {
        name: 'Salary',
        expense_type: '',
        income_category: 'true'
      },
      {
        name: 'Utilities',
        expense_type: 'controllable_fixed',
        income_category: 'false'
      }
    ];

    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    writeFile(wb, 'category_template.xlsx');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/categories"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Categories
          </Link>
          <h1 className="text-2xl font-bold text-dark-50 mb-2">Upload Categories</h1>
          <p className="text-dark-300">
            Import your categories from a CSV or Excel file.
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
                      name, expense_type, income_category
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-dark-100 mb-2">2. Format Requirements</h3>
                  <ul className="list-disc list-inside text-dark-300 space-y-1">
                    <li>Name: Category name (required)</li>
                    <li>expense_type: "fixed", "variable", or "controllable_fixed" (only for expense categories)</li>
                    <li>income_category: "true" for income categories, "false" for expense categories</li>
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
                <h2 className="text-lg font-semibold text-dark-50">Preview Categories</h2>
                <p className="text-sm text-dark-300">
                  Review the categories before importing
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
                      Import Categories
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
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Expense Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-700">
                    {parsedData.map((category, index) => (
                      <tr key={index} className="hover:bg-dark-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.income_category
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}>
                            {category.income_category ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {category.expense_type || '-'}
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
                  : 'bg-yellow-900/20 border border-yellow-700'
              }`}>
                <div className="flex items-center gap-2">
                  {uploadStatus === 'success' ? (
                    <CheckCircle2 className="text-green-400" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-400" size={20} />
                  )}
                  <div>
                    <p className={`font-medium ${
                      uploadStatus === 'success' ? 'text-green-300' : 'text-yellow-300'
                    }`}>
                      Upload {uploadStatus === 'success' ? 'Complete' : 'Completed with Skipped Items'}
                    </p>
                    <p className="text-sm text-dark-300">
                      {uploadStats.success} imported, {uploadStats.failed} skipped (duplicates)
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
