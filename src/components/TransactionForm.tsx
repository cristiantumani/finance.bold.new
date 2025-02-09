import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Transaction, ExpenseType } from '../types/finance';

type Category = {
  id: string;
  name: string;
  expense_type: ExpenseType;
  income_category: boolean;
};

type TransactionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id'>) => Promise<void>;
  initialData?: Partial<Transaction>;
  title: string;
};

export default function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title
}: TransactionFormProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    type: initialData?.type || 'expense',
    category_id: initialData?.category_id || '',
    amount: initialData?.amount?.toString() || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0]
  });

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

    fetchCategories();
  }, [user, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the selected category to get its expense_type
    const selectedCategory = categories.find(c => c.id === formData.category_id);
    
    await onSubmit({
      amount: Number(formData.amount),
      type: formData.type as 'income' | 'expense',
      category_id: formData.category_id,
      description: formData.description,
      date: formData.date,
      // Only include expense_type for expenses and when we have a category
      expense_type: formData.type === 'expense' && selectedCategory 
        ? selectedCategory.expense_type 
        : undefined
    });
  };

  if (!isOpen) return null;

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => 
    formData.type === 'income' ? category.income_category : !category.income_category
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as 'expense' | 'income',
                    category_id: '' // Reset category when switching types
                  })}
                  className="mr-2"
                />
                Expense
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as 'expense' | 'income',
                    category_id: '' // Reset category when switching types
                  })}
                  className="mr-2"
                />
                Income
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              {formData.type === 'expense' && (
                <Link 
                  to="/categories"
                  className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                >
                  Manage Categories
                  <HelpCircle size={14} />
                </Link>
              )}
            </div>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({
                ...formData,
                category_id: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select a category</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({
                ...formData,
                amount: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>

          {formData.type === 'expense' && formData.category_id && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Expense Type</span>
                <span className="text-sm text-gray-600 capitalize">
                  {categories.find(c => c.id === formData.category_id)?.expense_type.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({
                ...formData,
                description: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({
                ...formData,
                date: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {initialData ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}