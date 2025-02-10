import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft,
  Edit2,
  Trash2,
  DollarSign,
  PieChart,
  TrendingUp,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Budget } from '../types/finance';
import BudgetForm from '../components/BudgetForm';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type BudgetWithCategory = Budget & {
  categories: {
    name: string;
    expense_type: 'fixed' | 'variable' | 'controllable_fixed';
  } | null;
};

type BudgetSummary = {
  totalBudget: number;
  totalSpent: number;
  expenseTypeBreakdown: {
    fixed: number;
    variable: number;
    controllable_fixed: number;
  };
  spentTypeBreakdown: {
    fixed: number;
    variable: number;
    controllable_fixed: number;
  };
};

export default function Budgets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>({
    totalBudget: 0,
    totalSpent: 0,
    expenseTypeBreakdown: {
      fixed: 0,
      variable: 0,
      controllable_fixed: 0
    },
    spentTypeBreakdown: {
      fixed: 0,
      variable: 0,
      controllable_fixed: 0
    }
  });

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      // Format date for query
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      // Fetch budgets with their categories
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            name,
            expense_type
          )
        `)
        .eq('user_id', user.id)
        .eq('period', 'monthly')
        .order('categories(name)', { ascending: true });

      if (error) throw error;

      // For each budget, fetch the spent amount for the selected month
      const budgetsWithSpent = await Promise.all((data as BudgetWithCategory[]).map(async (budget) => {
        const { data: spentData, error: spentError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('category_id', budget.category_id)
          .eq('type', 'expense')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        if (spentError) throw spentError;

        const spent = spentData?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) ?? 0;

        return {
          ...budget,
          spent
        };
      }));

      setBudgets(budgetsWithSpent);

      // Calculate budget summary
      const summary: BudgetSummary = {
        totalBudget: 0,
        totalSpent: 0,
        expenseTypeBreakdown: {
          fixed: 0,
          variable: 0,
          controllable_fixed: 0
        },
        spentTypeBreakdown: {
          fixed: 0,
          variable: 0,
          controllable_fixed: 0
        }
      };

      budgetsWithSpent.forEach(budget => {
        summary.totalBudget += budget.budget_limit;
        summary.totalSpent += budget.spent;
        
        if (budget.categories?.expense_type) {
          summary.expenseTypeBreakdown[budget.categories.expense_type] += budget.budget_limit;
          summary.spentTypeBreakdown[budget.categories.expense_type] += budget.spent;
        }
      });

      setBudgetSummary(summary);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user, selectedDate]);

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

  const handleViewTransactions = (categoryId: string, categoryName: string) => {
    navigate(`/transactions?category=${categoryId}&name=${encodeURIComponent(categoryName)}`);
  };

  const handlePreviousMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const budgetPieChartData = {
    labels: ['Fixed Expenses', 'Variable Expenses', 'Controllable Fixed Expenses'],
    datasets: [
      {
        data: [
          budgetSummary.expenseTypeBreakdown.fixed,
          budgetSummary.expenseTypeBreakdown.variable,
          budgetSummary.expenseTypeBreakdown.controllable_fixed
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',  // Red for fixed
          'rgba(245, 158, 11, 0.5)',  // Yellow for variable
          'rgba(16, 185, 129, 0.5)'   // Green for controllable
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(16, 185, 129)'
        ],
        borderWidth: 1
      }
    ]
  };

  const spentPieChartData = {
    labels: ['Fixed Expenses', 'Variable Expenses', 'Controllable Fixed Expenses'],
    datasets: [
      {
        data: [
          budgetSummary.spentTypeBreakdown.fixed,
          budgetSummary.spentTypeBreakdown.variable,
          budgetSummary.spentTypeBreakdown.controllable_fixed
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',  // Red for fixed
          'rgba(245, 158, 11, 0.5)',  // Yellow for variable
          'rgba(16, 185, 129, 0.5)'   // Green for controllable
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(16, 185, 129)'
        ],
        borderWidth: 1
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `$${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
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

        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 min-w-[200px] text-center">
            {formatMonthYear(selectedDate)}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={selectedDate >= new Date()}
          >
            <ChevronRight size={20} className={selectedDate >= new Date() ? 'text-gray-300' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <DollarSign className="text-indigo-600" size={20} />
                  <span className="text-sm text-gray-600">Total Budget</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${budgetSummary.totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <TrendingUp className="text-green-600" size={20} />
                  <span className="text-sm text-gray-600">Total Spent</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${budgetSummary.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <AlertTriangle className="text-yellow-600" size={20} />
                  <span className="text-sm text-gray-600">Remaining</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${(budgetSummary.totalBudget - budgetSummary.totalSpent).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-700">Actual Spending Distribution</h3>
              <div className="h-[300px] flex items-center justify-center">
                <Pie data={spentPieChartData} options={pieChartOptions} />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Distribution of actual expenses by expense type for {formatMonthYear(selectedDate)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Flexibility</h2>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-700">Budget Allocation</h3>
                <div className="h-[200px] flex items-center justify-center">
                  <Pie data={budgetPieChartData} options={pieChartOptions} />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  How your budget is allocated across different expense types
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Fixed Expenses</span>
                    <span className="font-medium text-red-600">
                      ${budgetSummary.expenseTypeBreakdown.fixed.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ 
                        width: `${(budgetSummary.expenseTypeBreakdown.fixed / budgetSummary.totalBudget) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Essential expenses that are difficult to change
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Variable Expenses</span>
                    <span className="font-medium text-yellow-600">
                      ${budgetSummary.expenseTypeBreakdown.variable.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ 
                        width: `${(budgetSummary.expenseTypeBreakdown.variable / budgetSummary.totalBudget) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Expenses that vary month to month
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Controllable Fixed</span>
                    <span className="font-medium text-green-600">
                      ${budgetSummary.expenseTypeBreakdown.controllable_fixed.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ 
                        width: `${(budgetSummary.expenseTypeBreakdown.controllable_fixed / budgetSummary.totalBudget) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Fixed expenses you can optimize
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                      onClick={() => handleViewTransactions(budget.category_id, budget.categories?.name || 'Unknown')}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="View transactions"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditingBudget(budget)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit budget"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete budget"
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