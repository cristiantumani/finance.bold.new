import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Budget } from '../types/finance';

type Category = {
  id: string;
  name: string;
  expense_type: string;
};

type BudgetFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Budget, 'id' | 'spent'> & { id?: string }) => Promise<void>;
  initialData?: Partial<Budget>;
  title: string;
  selectedMonth?: Date; // The currently selected month in the Budgets page
};

export default function BudgetForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  selectedMonth
}: BudgetFormProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingBudget, setExistingBudget] = useState<Budget | null>(null);
  const [existingGlobalBudget, setExistingGlobalBudget] = useState<Budget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMonthSpecific, setIsMonthSpecific] = useState(initialData?.month ? true : false);
  const [formData, setFormData] = useState({
    category_id: initialData?.category_id || '',
    budget_limit: initialData?.budget_limit?.toString() || '',
    period: initialData?.period || 'monthly',
    month: initialData?.month || (selectedMonth ? `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}` : '')
  });

  // Format month for display
  const formatMonthDisplay = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Get current month string
  const getCurrentMonthString = () => {
    const date = selectedMonth || new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Reset form state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setExistingBudget(null);
      setExistingGlobalBudget(null);
      setIsEditing(false);
      setIsMonthSpecific(initialData?.month ? true : false);
      setFormData({
        category_id: initialData?.category_id || '',
        budget_limit: initialData?.budget_limit?.toString() || '',
        period: initialData?.period || 'monthly',
        month: initialData?.month || getCurrentMonthString()
      });
    }
  }, [isOpen, initialData, selectedMonth]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;
        setCategories(data);

        // If we have initialData, find the matching category
        if (initialData?.category_id) {
          const category = data.find(c => c.id === initialData.category_id);
          if (category) {
            setFormData(prev => ({
              ...prev,
              category_id: category.id
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [user, initialData, isOpen]);

  // Check for existing budget when category changes
  useEffect(() => {
    const checkExistingBudget = async () => {
      if (!user || !formData.category_id || initialData?.id || !isOpen) {
        setExistingBudget(null);
        setExistingGlobalBudget(null);
        return;
      }

      try {
        // Check for month-specific budget
        const monthKey = getCurrentMonthString();
        const { data: monthSpecific, error: monthError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('category_id', formData.category_id)
          .eq('month', monthKey)
          .maybeSingle();

        if (monthError) {
          console.error('Error checking month-specific budget:', monthError);
        }

        // Check for global budget (no month set)
        const { data: globalBudget, error: globalError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('category_id', formData.category_id)
          .is('month', null)
          .maybeSingle();

        if (globalError) {
          console.error('Error checking global budget:', globalError);
        }

        setExistingBudget(monthSpecific || null);
        setExistingGlobalBudget(globalBudget || null);

        // If editing and we have existing data, pre-fill the form
        if (isEditing) {
          const budgetToEdit = isMonthSpecific ? monthSpecific : globalBudget;
          if (budgetToEdit) {
            setFormData({
              category_id: budgetToEdit.category_id,
              budget_limit: budgetToEdit.budget_limit.toString(),
              period: budgetToEdit.period,
              month: budgetToEdit.month || monthKey
            });
          }
        }
      } catch (error) {
        console.error('Error checking existing budget:', error);
      }
    };

    checkExistingBudget();
  }, [user, formData.category_id, initialData, isEditing, isOpen, isMonthSpecific]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine if we're creating a new month-specific budget or editing existing
    const relevantExisting = isMonthSpecific ? existingBudget : existingGlobalBudget;

    // If there's an existing budget and we're not in edit mode, don't submit
    if (relevantExisting && !isEditing && !initialData) {
      return;
    }

    // Determine which budget ID to use for editing
    let budgetId: string | undefined;
    if (isEditing && relevantExisting) {
      budgetId = relevantExisting.id;
    } else if (initialData?.id) {
      budgetId = initialData.id;
    }

    await onSubmit({
      ...(budgetId && { id: budgetId }),
      category_id: formData.category_id,
      budget_limit: Number(formData.budget_limit),
      period: formData.period as 'monthly' | 'weekly' | 'yearly',
      month: isMonthSpecific ? formData.month : null
    });

    // Reset form state after successful submission
    setExistingBudget(null);
    setExistingGlobalBudget(null);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">{title}</h2>
          <button 
            onClick={() => {
              setIsEditing(false);
              onClose();
            }}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Show info about existing budgets */}
        {formData.category_id && !initialData && !isEditing && (existingBudget || existingGlobalBudget) && (
          <div className="mb-6 bg-blue-900/20 border border-blue-900/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-blue-400 font-medium mb-2">
                  Existing Budgets for this Category
                </h3>
                <div className="space-y-2 text-sm">
                  {existingGlobalBudget && (
                    <div className="flex items-center justify-between p-2 bg-dark-800/50 rounded-lg">
                      <span className="text-dark-200">
                        Default (all months): ${existingGlobalBudget.budget_limit.toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setIsMonthSpecific(false);
                          setFormData({
                            category_id: existingGlobalBudget.category_id,
                            budget_limit: existingGlobalBudget.budget_limit.toString(),
                            period: existingGlobalBudget.period,
                            month: ''
                          });
                        }}
                        className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  {existingBudget && (
                    <div className="flex items-center justify-between p-2 bg-dark-800/50 rounded-lg">
                      <span className="text-dark-200">
                        {formatMonthDisplay(existingBudget.month || '')}: ${existingBudget.budget_limit.toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setIsMonthSpecific(true);
                          setFormData({
                            category_id: existingBudget.category_id,
                            budget_limit: existingBudget.budget_limit.toString(),
                            period: existingBudget.period,
                            month: existingBudget.month || ''
                          });
                        }}
                        className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                {!existingBudget && existingGlobalBudget && (
                  <p className="text-dark-400 text-xs mt-2">
                    You can create a month-specific budget to override the default for {formatMonthDisplay(getCurrentMonthString())}.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Category
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({
                ...formData,
                category_id: e.target.value
              })}
              disabled={isEditing || initialData !== undefined}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100 disabled:opacity-50"
            >
              <option value="" className="text-dark-400">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id} className="text-dark-100">
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Budget Limit
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.budget_limit}
              onChange={(e) => setFormData({
                ...formData,
                budget_limit: e.target.value
              })}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100 placeholder-dark-400"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Period
            </label>
            <select
              required
              value={formData.period}
              onChange={(e) => setFormData({
                ...formData,
                period: e.target.value
              })}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
            >
              <option value="monthly" className="text-dark-100">Monthly</option>
              <option value="weekly" className="text-dark-100">Weekly</option>
              <option value="yearly" className="text-dark-100">Yearly</option>
            </select>
          </div>

          {/* Month-specific toggle */}
          <div className="border border-dark-600 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-dark-400" />
                <label className="text-sm font-medium text-dark-200">
                  Month-specific budget
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMonthSpecific(!isMonthSpecific);
                  if (!isMonthSpecific) {
                    setFormData({ ...formData, month: getCurrentMonthString() });
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isMonthSpecific ? 'bg-indigo-500' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isMonthSpecific ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isMonthSpecific && (
              <>
                <p className="text-xs text-dark-400">
                  This budget will only apply to the selected month. Other months will use the default budget.
                </p>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                  />
                </div>
              </>
            )}

            {!isMonthSpecific && (
              <p className="text-xs text-dark-400">
                This budget will apply to all months unless overridden by a month-specific budget.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-dark-100 transition-colors"
            >
              Cancel
            </button>
            {/* Show submit button based on context */}
            {(() => {
              const relevantExisting = isMonthSpecific ? existingBudget : existingGlobalBudget;
              const canSubmit = !relevantExisting || isEditing || initialData;

              if (!canSubmit) return null;

              return (
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800 focus:ring-indigo-500 transition-all duration-200"
                >
                  {isEditing || initialData ? 'Update' : 'Add'} Budget
                  {isMonthSpecific && !isEditing && !initialData && ' for ' + formatMonthDisplay(formData.month)}
                </button>
              );
            })()}
          </div>
        </form>
      </div>
    </div>
  );
}