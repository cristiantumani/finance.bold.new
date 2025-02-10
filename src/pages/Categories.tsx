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
    fixed: <Lock className="text-red-600" size={20} />,
    variable: <Shuffle className="text-yellow-600" size={20} />,
    controllable_fixed: <Sliders className="text-green-600" size={20} />
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link 
              to="/dashboard" 
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          </div>
          <button 
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', expense_type: 'fixed', income_category: false });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {category.income_category ? (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="text-green-600" size={20} />
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {expenseTypeIcons[category.expense_type]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category.income_category ? 'Income' : expenseTypeLabels[category.expense_type]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="lg:col-span-3 text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No categories</h3>
              <p className="mt-1 text-gray-500">Get started by adding a new category.</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setFormData({ name: '', expense_type: 'fixed', income_category: false });
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                  setFormData({ name: '', expense_type: 'fixed', income_category: false });
                  setIncludeBudget(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Income Category</span>
                  </label>
                </div>
              </div>

              {!formData.income_category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Type
                  </label>
                  <div className="space-y-2">
                    {Object.entries(expenseTypeLabels).map(([value, label]) => (
                      <label 
                        key={value}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
                          className="mr-3"
                        />
                        <div className="flex items-center gap-2">
                          {expenseTypeIcons[value as ExpenseType]}
                          <span className="font-medium text-gray-900">{label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!editingCategory && !formData.income_category && (
                <div className="border-t pt-4 mt-4">
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
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Set a budget for this category
                    </span>
                  </label>

                  {includeBudget && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                    setFormData({ name: '', expense_type: 'fixed', income_category: false });
                    setIncludeBudget(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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