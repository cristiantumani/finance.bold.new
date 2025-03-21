import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft,
  Edit2,
  Trash2,
  Tag,
  Lock,
  Shuffle,
  Sliders,
  X,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { ExpenseType } from '../types/finance';

type Category = {
  id: string;
  name: string;
  expense_type: ExpenseType;
  income_category: boolean;
};

type CategoryFormData = {
  name: string;
  expense_type: ExpenseType;
  income_category: boolean;
  budget?: {
    limit: string;
    period: 'monthly' | 'weekly' | 'yearly';
  };
};

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    expense_type: 'fixed',
    income_category: false,
    budget: undefined
  });
  const [includeBudget, setIncludeBudget] = useState(false);

  const expenseTypeIcons = {
    fixed: <Lock className="text-red-400" size={20} />,
    variable: <Shuffle className="text-yellow-400" size={20} />,
    controllable_fixed: <Sliders className="text-emerald-400" size={20} />
  };

  const expenseTypeLabels = {
    fixed: 'Fixed',
    variable: 'Variable',
    controllable_fixed: 'Controllable Fixed'
  };

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
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            expense_type: formData.expense_type,
            income_category: formData.income_category || false
          })
          .eq('id', editingCategory.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // First create the category
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .insert([{
            user_id: user.id,
            name: formData.name,
            expense_type: formData.expense_type,
            income_category: formData.income_category || false
          }])
          .select()
          .single();

        if (categoryError) throw categoryError;

        // If budget is included, create it
        if (includeBudget && formData.budget && category) {
          const { error: budgetError } = await supabase
            .from('budgets')
            .insert([{
              user_id: user.id,
              category_id: category.id,
              budget_limit: Number(formData.budget.limit),
              period: formData.budget.period,
              spent: 0
            }]);

          if (budgetError) throw budgetError;
        }
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', expense_type: 'fixed', income_category: false });
      setIncludeBudget(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      expense_type: category.expense_type,
      income_category: category.income_category
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link 
              to="/dashboard" 
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Categories
            </h1>
          </div>
          <button 
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', expense_type: 'fixed', income_category: false });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {category.income_category ? (
                    <div className="p-2 bg-emerald-900/50 rounded-xl">
                      <DollarSign className="text-emerald-400" size={20} />
                    </div>
                  ) : (
                    <div className="p-2 bg-dark-700/50 rounded-xl">
                      {expenseTypeIcons[category.expense_type]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-dark-50">{category.name}</h3>
                    <p className="text-sm text-dark-400">
                      {category.income_category ? 'Income' : expenseTypeLabels[category.expense_type]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-dark-400 hover:text-dark-200 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="lg:col-span-3 text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-dark-400" />
              <h3 className="mt-2 text-lg font-medium text-dark-50">No categories</h3>
              <p className="mt-1 text-dark-400">Get started by adding a new category.</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setFormData({ name: '', expense_type: 'fixed', income_category: false });
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-dark-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-dark-50">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                  setFormData({ name: '', expense_type: 'fixed', income_category: false });
                  setIncludeBudget(false);
                }}
                className="text-dark-400 hover:text-dark-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Category Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.income_category}
                      onChange={(e) => setFormData({
                        ...formData,
                        income_category: e.target.checked
                      })}
                      className="mr-2 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-dark-800"
                    />
                    <span className="text-dark-100">Income Category</span>
                  </label>
                </div>
              </div>

              {!formData.income_category && (
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Expense Type
                  </label>
                  <div className="space-y-2">
                    {Object.entries(expenseTypeLabels).map(([value, label]) => (
                      <label 
                        key={value}
                        className="flex items-center p-3 border border-dark-600 rounded-xl hover:bg-dark-700/50 transition-colors cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="expense_type"
                          value={value}
                          checked={formData.expense_type === value}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            expense_type: e.target.value as ExpenseType 
                          })}
                          className="mr-3 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-dark-800"
                        />
                        <div className="flex items-center gap-2">
                          {expenseTypeIcons[value as ExpenseType]}
                          <span className="font-medium text-dark-100">{label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!editingCategory && !formData.income_category && (
                <div className="border-t border-dark-600 pt-6">
                  <label className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={includeBudget}
                      onChange={(e) => {
                        setIncludeBudget(e.target.checked);
                        if (!e.target.checked) {
                          setFormData({ ...formData, budget: undefined });
                        } else {
                          setFormData({
                            ...formData,
                            budget: { limit: '', period: 'monthly' }
                          });
                        }
                      }}
                      className="mr-2 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-dark-800"
                    />
                    <span className="text-sm font-medium text-dark-200">
                      Set a budget for this category
                    </span>
                  </label>

                  {includeBudget && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-200 mb-2">
                          Budget Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.budget?.limit || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            budget: {
                              ...formData.budget!,
                              limit: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-200 mb-2">
                          Budget Period
                        </label>
                        <select
                          required
                          value={formData.budget?.period || 'monthly'}
                          onChange={(e) => setFormData({
                            ...formData,
                            budget: {
                              ...formData.budget!,
                              period: e.target.value as 'monthly' | 'weekly' | 'yearly'
                            }
                          })}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                    setFormData({ name: '', expense_type: 'fixed', income_category: false });
                    setIncludeBudget(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-dark-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800 focus:ring-indigo-500 transition-all duration-200"
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}