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
  ChevronRight,
  CircleDollarSign,
  Wallet,
  Receipt,
  Percent
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
  const [isModalOpen, setIsModalOpen] = useState(false);
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

      setIsModalOpen(false);
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
          'rgba(239, 68, 68, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(16, 185, 129, 0.5)'
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
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8' // text-dark-400
        }
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
              Budget Management
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Add Budget
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl shadow-md">
                <CircleDollarSign className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-300">Total Budget</p>
                <p className="text-2xl font-bold text-dark-50">
                  ${budgetSummary.totalBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-xl shadow-md">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-300">Total Spent</p>
                <p className="text-2xl font-bold text-dark-50">
                  ${budgetSummary.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-3 rounded-xl shadow-md">
                <Receipt className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-300">Remaining</p>
                <p className="text-2xl font-bold text-dark-50">
                  ${(budgetSummary.totalBudget - budgetSummary.totalSpent).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-md">
                <Percent className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-300">Budget Used</p>
                <p className="text-2xl font-bold text-dark-50">
                  {budgetSummary.totalBudget > 0
                    ? `${((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <h2 className="text-lg font-semibold text-dark-50 mb-6">Budget Distribution</h2>
            <div className="h-[400px] flex items-center justify-center">
              <Pie data={budgetPieChartData} options={pieChartOptions} />
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <h2 className="text-lg font-semibold text-dark-50 mb-6">Actual Spending Distribution</h2>
            <div className="h-[400px] flex items-center justify-center">
              <Pie data={spentPieChartData} options={pieChartOptions} />
            </div>
          </div>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-dark-700 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-dark-50 mb-4">Budget Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-800/80">
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Budget Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {budgets.map((budget) => {
                  const percentage = (budget.spent / budget.budget_limit) * 100;
                  return (
                    <tr key={budget.id} className="hover:bg-dark-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-dark-100 font-medium">
                          {budget.categories?.name || 'Uncategorized'}
                        </div>
                        <div className="text-sm text-dark-400">
                          {budget.categories?.expense_type.replace('_', ' ').charAt(0).toUpperCase() +
                            budget.categories?.expense_type.slice(1).replace('_', ' ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-dark-100">
                        ${budget.budget_limit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-dark-100">
                        ${budget.spent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={percentage > 100 ? 'text-red-400' : 'text-emerald-400'}>
                          ${Math.abs(budget.budget_limit - budget.spent).toLocaleString()}
                          {percentage > 100 && ' over'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-dark-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              percentage > 100
                                ? 'bg-red-500'
                                : percentage > 80
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 text-sm text-dark-400">
                          {percentage.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => handleViewTransactions(budget.category_id, budget.categories?.name || 'Unknown')}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => setEditingBudget(budget)}
                          className="text-dark-300 hover:text-dark-100 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {budgets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-dark-400">
                      No budgets found. Click "Add Budget" to create your first budget.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <BudgetForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={editingBudget ? handleUpdateBudget : handleAddBudget}
          initialData={editingBudget || undefined}
          title={editingBudget ? 'Edit Budget' : 'Add Budget'}
        />
      )}
    </div>
  );
}