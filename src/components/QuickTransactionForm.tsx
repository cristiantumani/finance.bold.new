import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Transaction, ExpenseType } from '../types/finance';
import { Calendar } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  expense_type: ExpenseType;
  income_category: boolean;
};

type QuickTransactionFormProps = {
  onSuccess?: () => void;
};

export default function QuickTransactionForm({ onSuccess }: QuickTransactionFormProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    type: 'expense' as const,
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

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
    if (!user) return;

    setLoading(true);
    try {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          amount: Number(formData.amount),
          type: formData.type,
          category_id: formData.category_id,
          description: formData.description,
          date: formData.date,
          expense_type: formData.type === 'expense' && selectedCategory 
            ? selectedCategory.expense_type 
            : undefined
        }]);

      if (error) throw error;

      setFormData({
        type: 'expense',
        category_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category => 
    formData.type === 'income' ? category.income_category : !category.income_category
  );

  return (
    <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-dark-700 p-6">
      <h2 className="text-lg font-semibold text-dark-50 mb-6">Quick Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="relative">
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
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-800 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}