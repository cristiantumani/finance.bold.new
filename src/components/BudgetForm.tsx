import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  onSubmit: (data: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
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
  const [formData, setFormData] = React.useState({
    category_id: initialData?.category_id || '',
    budget_limit: initialData?.budget_limit?.toString() || '',
    period: initialData?.period || 'monthly'
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
    await onSubmit({
      category_id: formData.category_id,
      budget_limit: Number(formData.budget_limit),
      period: formData.period as 'monthly' | 'weekly' | 'yearly'
    });
  };

  if (!isOpen) return null;

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
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              required
              value={formData.period}
              onChange={(e) => setFormData({
                ...formData,
                period: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
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
              {initialData ? 'Update' : 'Add'} Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}