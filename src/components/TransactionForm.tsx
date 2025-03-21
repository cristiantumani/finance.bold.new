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

const defaultFormData = {
  type: 'expense' as const,
  category_id: '',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0]
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
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultFormData);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || defaultFormData.type,
        category_id: initialData.category_id || defaultFormData.category_id,
        amount: initialData.amount?.toString() || defaultFormData.amount,
        description: initialData.description || defaultFormData.description,
        date: initialData.date || defaultFormData.date
      });
    }
  }, [initialData]);

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
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCategory = categories.find(c => c.id === formData.category_id);
    
    await onSubmit({
      amount: Number(formData.amount),
      type: formData.type,
      category_id: formData.category_id,
      description: formData.description,
      date: formData.date,
      expense_type: formData.type === 'expense' && selectedCategory 
        ? selectedCategory.expense_type 
        : undefined
    });
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(category => 
    formData.type === 'income' ? category.income_category : !category.income_category
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">{title}</h2>
          <button 
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
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
                    category_id: ''
                  })}
                  className="mr-2 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-dark-800"
                />
                <span className="text-dark-100">Expense</span>
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
                    category_id: ''
                  })}
                  className="mr-2 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-dark-800"
                />
                <span className="text-dark-100">Income</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-200">
                Category
              </label>
              {formData.type === 'expense' && (
                <Link 
                  to="/categories"
                  className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
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
              className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
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
            <label className="block text-sm font-medium text-dark-200 mb-2">
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
              className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({
                ...formData,
                description: e.target.value
              })}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
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
              className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-dark-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800 focus:ring-indigo-500 transition-all duration-200"
            >
              {initialData ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}