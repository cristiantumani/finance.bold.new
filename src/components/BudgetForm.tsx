import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
};

export default function BudgetForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title
}: BudgetFormProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingBudget, setExistingBudget] = useState<Budget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    category_id: initialData?.category_id || '',
    budget_limit: initialData?.budget_limit?.toString() || '',
    period: initialData?.period || 'monthly'
  });

  // Reset form state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setExistingBudget(null);
      setIsEditing(false);
      setFormData({
        category_id: initialData?.category_id || '',
        budget_limit: initialData?.budget_limit?.toString() || '',
        period: initialData?.period || 'monthly'
      });
    }
  }, [isOpen, initialData]);

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
        return;
      }

      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('category_id', formData.category_id)
          .maybeSingle();

        if (error) {
          console.error('Error checking existing budget:', error);
          return;
        }

        if (data) {
          setExistingBudget(data);
          // If we're editing, pre-fill the form with existing data
          if (isEditing) {
            setFormData({
              category_id: data.category_id,
              budget_limit: data.budget_limit.toString(),
              period: data.period
            });
          }
        } else {
          setExistingBudget(null);
        }
      } catch (error) {
        console.error('Error checking existing budget:', error);
      }
    };

    checkExistingBudget();
  }, [user, formData.category_id, initialData, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there's an existing budget and we're not in edit mode, don't submit
    if (existingBudget && !isEditing && !initialData) {
      return;
    }

    await onSubmit({
      ...(existingBudget && isEditing && { id: existingBudget.id }),
      category_id: formData.category_id,
      budget_limit: Number(formData.budget_limit),
      period: formData.period as 'monthly' | 'weekly' | 'yearly'
    });

    // Reset form state after successful submission
    setExistingBudget(null);
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

        {existingBudget && !initialData && !isEditing && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-900/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-yellow-500 font-medium mb-1">
                  Budget Already Exists
                </h3>
                <p className="text-dark-200 text-sm mb-3">
                  A budget for this category already exists with a limit of ${existingBudget.budget_limit} ({existingBudget.period}).
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setFormData({
                        category_id: existingBudget.category_id,
                        budget_limit: existingBudget.budget_limit.toString(),
                        period: existingBudget.period
                      });
                    }}
                    className="text-sm px-3 py-1.5 bg-yellow-500/20 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-colors"
                  >
                    Edit Existing Budget
                  </button>
                  <button
                    onClick={onClose}
                    className="text-sm px-3 py-1.5 text-dark-300 hover:text-dark-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
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
            {(!existingBudget || isEditing || initialData) && (
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800 focus:ring-indigo-500 transition-all duration-200"
              >
                {isEditing || initialData ? 'Update' : 'Add'} Budget
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}