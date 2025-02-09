import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft,
  Edit2,
  Trash2,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Budget } from '../types/finance';
import BudgetForm from '../components/BudgetForm';

type BudgetWithCategory = Budget & {
  categories: {
    name: string;
  } | null;
};

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('category_id');

      if (error) throw error;

      setBudgets(data as BudgetWithCategory[]);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  const handleAddBudget = async (data: Omit<Budget, 'id' | 'spent'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user.id,
          spent: 0,
          ...data
        }]);

      if (error) throw error;

      setIsAddModalOpen(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const handleUpdateBudget = async (data: Omit<Budget, 'id' | 'spent'>) => {
    if (!user || !editingBudget) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          ...data
        })
        .eq('id', editingBudget.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Add Budget
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.budget_limit) * 100;
            const isOverBudget = percentage > 100;

            return (
              <div 
                key={budget.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {budget.categories?.name || 'Unknown Category'}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingBudget(budget)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent</span>
                    <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                      ${budget.spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-medium text-gray-900">
                      ${budget.budget_limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.max(budget.budget_limit - budget.spent, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {budgets.length === 0 && (
            <div className="lg:col-span-3 text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No budgets set</h3>
              <p className="mt-1 text-gray-500">Get started by adding a new budget.</p>
              <div className="mt-6">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Budget
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BudgetForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddBudget}
        title="Add Budget"
      />

      <BudgetForm
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onSubmit={handleUpdateBudget}
        initialData={editingBudget || undefined}
        title="Edit Budget"
      />
    </div>
  );
}