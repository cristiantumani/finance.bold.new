import React, { useState, useCallback, useEffect } from 'react';
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
};

type ParsedBudget = {
  category_name: string;
  category_id?: string;
  budget_limit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  month: string | null;
};

type ValidationError = {
  row: number;
  column: string;
  message: string;
};

export default function BudgetUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [parsedData, setParsedData] = useState<ParsedBudget[]>([]);
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
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const validateBudgets = (data: any[]): [ParsedBudget[], ValidationError[]] => {
    const validBudgets: ParsedBudget[] = [];
    const validationErrors: ValidationError[] = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2; // Add 2 to account for header row and 0-based index
      const errors: ValidationError[] = [];

      // Convert category_name to string and trim
      const categoryName = String(row.category_name || '').trim();

      // Validate category name
      if (!categoryName) {
        errors.push({
          row: rowNumber,
          column: 'category_name',
          message: 'Category name is required'
        });
      }

      // Find category ID
      const category = categories.find(c => c.name === categoryName);
      if (categoryName && !category) {
        errors.push({
          row: rowNumber,
          column: 'category_name',
          message: `Category "${categoryName}" not found. Please create it first.`
        });
      }

      // Convert budget_limit to number
      const budgetLimit = typeof row.budget_limit === 'number'
        ? row.budget_limit
        : parseFloat(String(row.budget_limit || '0').replace(/[^0-9.-]+/g, ''));

      // Validate budget_limit
      if (isNaN(budgetLimit) || budgetLimit <= 0) {
        errors.push({
          row: rowNumber,
          column: 'budget_limit',
          message: 'Budget limit must be a positive number'
        });
      }

      // Parse period
      const periodStr = String(row.period || 'monthly').trim().toLowerCase();

      // Validate period
      if (!['monthly', 'weekly', 'yearly'].includes(periodStr)) {
        errors.push({
          row: rowNumber,
          column: 'period',
          message: 'Period must be "monthly", "weekly", or "yearly"'
        });
      }

      // Parse month (optional, YYYY-MM format)
      let month: string | null = null;
      const monthStr = String(row.month || '').trim();
      if (monthStr) {
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(monthStr)) {
          errors.push({
            row: rowNumber,
            column: 'month',
            message: 'Month must be in YYYY-MM format (e.g., 2026-01) or empty for default'
          });
        } else {
          month = monthStr;
        }
      }

      if (errors.length === 0 && category) {
        validBudgets.push({
          category_name: categoryName,
          category_id: category.id,
          budget_limit: budgetLimit,
          period: periodStr as 'monthly' | 'weekly' | 'yearly',
          month
        });
      } else {
        validationErrors.push(...errors);
      }
    }

    return [validBudgets, validationErrors];
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
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);

        const [validBudgets, validationErrors] = validateBudgets(jsonData);
        setParsedData(validBudgets);
        setErrors(validationErrors);

        if (validBudgets.length > 0 && validationErrors.length === 0) {
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
      // Upload budgets one by one (to handle duplicates gracefully)
      for (const budget of parsedData) {
        try {
          // Check if budget already exists for this category/period/month
          const { data: existing, error: queryError } = await supabase
            .from('budgets')
            .select('id')
            .eq('user_id', user.id)
            .eq('category_id', budget.category_id!)
            .eq('period', budget.period)
            .eq('month', budget.month)
            .maybeSingle();

          if (queryError && queryError.code !== 'PGRST116') {
            throw queryError;
          }

          if (existing) {
            // Budget exists, update it
            const { error: updateError } = await supabase
              .from('budgets')
              .update({
                budget_limit: budget.budget_limit
              })
              .eq('id', existing.id);

            if (updateError) {
              throw updateError;
            }
            successCount++;
          } else {
            // Insert new budget
            const { error: insertError } = await supabase
              .from('budgets')
              .insert({
                user_id: user.id,
                category_id: budget.category_id!,
                budget_limit: budget.budget_limit,
                spent: 0,
                period: budget.period,
                month: budget.month
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
          }
        } catch (error) {
          console.error('Error uploading budget:', error);
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
          navigate('/budgets');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading budgets:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        category_name: 'Groceries',
        budget_limit: 500,
        period: 'monthly',
        month: ''
      },
      {
        category_name: 'Rent',
        budget_limit: 1500,
        period: 'monthly',
        month: '2026-01'
      },
      {
        category_name: 'Entertainment',
        budget_limit: 200,
        period: 'monthly',
        month: ''
      }
    ];

    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    writeFile(wb, 'budget_template.xlsx');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/budgets"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Budgets
          </Link>
          <h1 className="text-2xl font-bold text-dark-50 mb-2">Upload Budgets</h1>
          <p className="text-dark-300">
            Import your budgets from a CSV or Excel file.
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
                      category_name, budget_limit, period, month (optional)
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-dark-100 mb-2">2. Format Requirements</h3>
                  <ul className="list-disc list-inside text-dark-300 space-y-1">
                    <li>category_name: Must match an existing category name</li>
                    <li>budget_limit: Positive number (e.g., 500.00)</li>
                    <li>period: "monthly", "weekly", or "yearly"</li>
                    <li>month: YYYY-MM format (e.g., 2026-01) or leave empty for default budget</li>
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

                {categories.length === 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-300 font-medium">
                      <AlertCircle size={20} />
                      No categories found
                    </div>
                    <p className="text-sm text-yellow-200 mt-1">
                      You need to create categories first before uploading budgets.
                    </p>
                    <Link
                      to="/categories"
                      className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
                    >
                      Go to Categories →
                    </Link>
                  </div>
                )}
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
                    disabled={categories.length === 0}
                  />
                  <div className={`border-2 border-dashed border-dark-600 rounded-lg p-8 text-center transition-colors ${
                    categories.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-indigo-500 cursor-pointer'
                  }`}>
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-dark-400" />
                    <p className="mt-2 text-sm text-dark-200">
                      {categories.length === 0
                        ? 'Create categories first'
                        : 'Click to select or drag and drop your file here'}
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
                <h2 className="text-lg font-semibold text-dark-50">Preview Budgets</h2>
                <p className="text-sm text-dark-300">
                  Review the budgets before importing
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
                      Import Budgets
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
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Budget Limit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Month
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-700">
                    {parsedData.map((budget, index) => (
                      <tr key={index} className="hover:bg-dark-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {budget.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-400">
                          ${budget.budget_limit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                            {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {budget.month || 'Default'}
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
                      Upload {uploadStatus === 'success' ? 'Complete' : 'Completed with Issues'}
                    </p>
                    <p className="text-sm text-dark-300">
                      {uploadStats.success} imported/updated, {uploadStats.failed} failed
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
