import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Transaction, ExpenseType } from '../types/finance';

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

      // Reset form
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

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => 
    formData.type === 'income' ? category.income_category : !category.income_category
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
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
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}