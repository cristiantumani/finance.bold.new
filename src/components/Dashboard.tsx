import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  Plus,
  DollarSign,
  ArrowRight,
  Settings,
  ChevronDown,
  FolderOpen,
  Calculator,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import TransactionForm from './TransactionForm';
import type { Transaction, Budget, FinancialHealth } from '../types/finance';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

type TransactionWithCategory = Transaction & {
  categories: {
    name: string;
  } | null;
};

type BudgetWithCategory = Budget & {
  categories: {
    name: string;
  } | null;
};

type DropdownState = {
  isOpen: boolean;
  position: {
    top: number;
    left: number;
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<{
    categoryNames: string[];
    expenses: number[];
    budgets: number[];
  }>({
    categoryNames: [],
    expenses: [],
    budgets: []
  });
  const [trendData, setTrendData] = useState<{
    labels: string[];
    income: number[];
    expenses: number[];
  }>({
    labels: [],
    income: [],
    expenses: []
  });
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    isOpen: false,
    position: { top: 0, left: 0 }
  });

  const handleMoreOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setDropdownState({
      isOpen: !dropdownState.isOpen,
      position: {
        top: rect.bottom + 5, // Add small gap
        left: rect.right - 224 // 224px is width of dropdown (w-56)
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownState.isOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.more-options-button') && !target.closest('.more-options-dropdown')) {
          setDropdownState(prev => ({ ...prev, isOpen: false }));
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownState.isOpen]);

  const fetchMonthlyStats = async () => {
    if (!user) return;

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    try {
      // Fetch current month's expenses by category
      const { data: expenseData, error: expenseError } = await supabase
        .from('transactions')
        .select(`
          amount,
          category_id,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());

      if (expenseError) throw expenseError;

      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          category_id,
          budget_limit,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('period', 'monthly');

      if (budgetError) throw budgetError;

      // Group expenses by category
      const expensesByCategory = expenseData.reduce((acc: { [key: string]: { amount: number; name: string } }, transaction) => {
        const categoryId = transaction.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = {
            amount: 0,
            name: transaction.categories?.name || 'Unknown'
          };
        }
        acc[categoryId].amount += Number(transaction.amount);
        return acc;
      }, {});

      // Convert to array and sort by amount
      const sortedCategories = Object.entries(expensesByCategory)
        .map(([categoryId, data]) => ({
          categoryId,
          name: data.name,
          amount: data.amount,
          budget: budgetData.find(b => b.category_id === categoryId)?.budget_limit || 0
        }))
        .sort((a, b) => b.amount - a.amount);

      // Take top 7 categories
      const top7 = sortedCategories.slice(0, 7);
      const others = sortedCategories.slice(7);

      // Calculate totals for "Others" category
      const othersTotal = others.reduce((sum, cat) => sum + cat.amount, 0);
      const othersBudget = others.reduce((sum, cat) => sum + cat.budget, 0);

      // Prepare final data arrays
      const categoryNames = [
        ...top7.map(cat => cat.name),
        ...(others.length > 0 ? ['Others'] : [])
      ];

      const expenses = [
        ...top7.map(cat => cat.amount),
        ...(others.length > 0 ? [othersTotal] : [])
      ];

      const budgets = [
        ...top7.map(cat => cat.budget),
        ...(others.length > 0 ? [othersBudget] : [])
      ];

      setMonthlyStats({
        categoryNames,
        expenses,
        budgets
      });
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const fetchTrendData = async () => {
    if (!user) return;

    try {
      // Get last 6 months of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 5);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      // Process data by month
      const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
      
      data.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        if (transaction.type === 'income') {
          monthlyData[monthKey].income += Number(transaction.amount);
        } else {
          monthlyData[monthKey].expenses += Number(transaction.amount);
        }
      });

      const months = Object.keys(monthlyData).sort();
      const monthLabels = months.map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('default', { month: 'short', year: '2-digit' });
      });

      setTrendData({
        labels: monthLabels,
        income: months.map(month => monthlyData[month].income),
        expenses: months.map(month => monthlyData[month].expenses)
      });
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user?.id)
        .eq('period', 'monthly');

      if (budgetsError) throw budgetsError;

      // Calculate financial health
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

      if (monthlyError) throw monthlyError;

      const monthlyIncome = monthlyData
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      const monthlyExpenses = monthlyData
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      const savingsRate = monthlyIncome > 0 
        ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
        : 0;

      setTransactions(transactionsData as TransactionWithCategory[]);
      setBudgets(budgetsData as BudgetWithCategory[]);
      setFinancialHealth({
        totalBalance: monthlyIncome - monthlyExpenses,
        monthlyIncome,
        monthlyExpenses,
        savingsRate
      });

      // Fetch chart data
      await Promise.all([
        fetchMonthlyStats(),
        fetchTrendData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Set up real-time subscriptions
    const transactionsSubscription = supabase
      .channel('transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    const budgetsSubscription = supabase
      .channel('budgets')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      transactionsSubscription.unsubscribe();
      budgetsSubscription.unsubscribe();
    };
  }, [user]);

  const handleAddTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          ...data
        }]);

      if (error) throw error;

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const categoryChartData = {
    labels: monthlyStats.categoryNames,
    datasets: [
      {
        label: 'Expenses',
        data: monthlyStats.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      },
      {
        label: 'Budget',
        data: monthlyStats.budgets,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const categoryChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Expenses vs Budget by Category'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return `${context.dataset.label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          callback: (value) => `$${(value as number).toLocaleString()}`
        }
      }
    }
  };

  const trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Income vs Expenses Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      }
    }
  };

  const trendChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Income',
        data: trendData.income,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.3
      },
      {
        label: 'Expenses',
        data: trendData.expenses,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3
      }
    ]
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Add Transaction
          </button>
          <div className="relative">
            <button 
              onClick={handleMoreOptionsClick}
              className="more-options-button flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Settings size={20} />
              <span>More Options</span>
              <ChevronDown size={16} className={`transform transition-transform ${dropdownState.isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownState.isOpen && (
              <div 
                className="more-options-dropdown fixed w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
                style={{
                  top: `${dropdownState.position.top}px`,
                  left: `${dropdownState.position.left}px`
                }}
              >
                <Link 
                  to="/categories"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
                >
                  <FolderOpen size={18} />
                  <span>Manage Categories</span>
                </Link>
                <Link 
                  to="/budgets"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
                >
                  <Calculator size={18} />
                  <span>Manage Budgets</span>
                </Link>
                <Link 
                  to="/expense-types"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
                >
                  <PieChart size={18} />
                  <span>Understand Expense Types</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Wallet className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-800">
                ${financialHealth.totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-gray-800">
                ${financialHealth.monthlyIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-gray-800">
                ${financialHealth.monthlyExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <PieChart className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Savings Rate</p>
              <p className="text-2xl font-bold text-gray-800">
                {financialHealth.savingsRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <Bar options={categoryChartOptions} data={categoryChartData} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <Line options={trendChartOptions} data={trendChartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            <Link 
              to="/transactions" 
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${transaction.type === 'expense' ? 'bg-red-100' : 'bg-green-100'}`}>
                      <DollarSign className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'} size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{transaction.categories?.name || 'Uncategorized'}</p>
                      {transaction.description && (
                        <p className="text-sm text-gray-500">{transaction.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}${Number(transaction.amount).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Overview</h2>
          <div className="space-y-4">
            {budgets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No budgets set</p>
            ) : (
              budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{budget.categories?.name}</span>
                    <span className="text-gray-800 font-medium">
                      ${Number(budget.spent).toLocaleString()} / ${Number(budget.budget_limit).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.min((budget.spent / budget.budget_limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <TransactionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
        title="Add Transaction"
      />
    </div>
  );
}