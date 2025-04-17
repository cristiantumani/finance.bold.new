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
  DollarSign,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CategoryEducation from '../components/CategoryEducation';
import StepByStepCategoryForm from '../components/StepByStepCategoryForm';
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

  const handleSubmit = async (formData: CategoryFormData) => {
    if (!user) return;

    try {
      // First create the category
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: formData.name,
          expense_type: formData.expense_type,
          income_category: formData.income_category
        }])
        .select()
        .single();

      if (categoryError) throw categoryError;

      // If budget is included, create it
      if (formData.budget?.limit && category) {
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

      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        <CategoryEducation />

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
                  onClick={() => setIsModalOpen(true)}
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

      <StepByStepCategoryForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}