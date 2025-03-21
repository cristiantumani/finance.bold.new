import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Upload,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart,
  CircleDollarSign,
  Banknote,
  Receipt,
  Percent
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import TransactionForm from './TransactionForm';
import QuickTransactionForm from './QuickTransactionForm';
import AccountSettings from './AccountSettings';
import type { Transaction, Budget, FinancialHealth } from '../types/finance';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    isOpen: false,
    position: { top: 0, left: 0 }
  });
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0
  });

  const getBudgetStatusColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return 'bg-red-500';
    if (percentage === 100) return 'bg-indigo-500';
    return 'bg-emerald-500';
  };

  const getBudgetTextColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return 'text-red-500';
    if (percentage === 100) return 'text-indigo-500';
    return 'text-emerald-500';
  };

  const handleMoreOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setDropdownState({
      isOpen: !dropdownState.isOpen,
      position: {
        top: rect.bottom + 5,
        left: rect.right - 224
      }
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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

  const fetchData = async () => {
    if (!user) return;

    try {
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user.id);

      if (budgetsError) throw budgetsError;

      const monthlyIncome = transactionsData
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      const monthlyExpenses = transactionsData
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

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
  }, [user, selectedDate]);

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Financial Dashboard
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Add Transaction
          </button>
          <div className="relative">
            <button 
              onClick={handleMoreOptionsClick}
              className="more-options-button flex items-center gap-2 bg-dark-800 text-dark-100 px-4 py-2.5 rounded-xl hover:bg-dark-700 transition-all duration-200 border border-dark-700 shadow-sm hover:shadow-md"
            >
              <Settings size={20} />
              <span>More Options</span>
              <ChevronDown size={16} className={`transform transition-transform ${dropdownState.isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownState.isOpen && (
              <div 
                className="more-options-dropdown fixed w-56 bg-dark-800 rounded-xl shadow-xl border border-dark-700 py-2 z-50 overflow-hidden"
                style={{
                  top: `${dropdownState.position.top}px`,
                  left: `${dropdownState.position.left}px`
                }}
              >
                <Link 
                  to="/upload"
                  className="flex items-center gap-3 px-4 py-2.5 text-dark-100 hover:bg-dark-700 transition-colors"
                  onClick={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
                >
                  <Upload size={18} />
                  <span>Import Transactions</span>
                </Link>
                <Link 
                  to="/categories"
                  className="flex items-center gap-3 px-4 py-2.5 text-dark-100 hover:bg-dark-700 transition-colors"
                  onClick={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
                >
                  <FolderOpen size={18} />
                  <span>Manage Categories</span>
                </Link>
                <Link 
                  to="/budgets"
                  className="flex items-center gap-3 px-4 py-2.5 text-dark-100 hover:bg-dark-700 transition-colors"
                  onClick={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
                >
                  <Calculator size={18} />
                  <span>Manage Budgets</span>
                </Link>
                <Link 
                  to="/reports"
                  className="flex items-center gap-3 px-4 py-2.5 text-dark-100 hover:bg-dark-700 transition-colors"
                  onClick={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
                >
                  <BarChart size={18} />
                  <span>View Reports</span>
                </Link>
                <button
                  onClick={() => {
                    setShowAccountSettings(true);
                    setDropdownState(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-dark-100 hover:bg-dark-700 transition-colors"
                >
                  <Settings size={18} />
                  <span>Account Settings</span>
                </button>
                <div className="border-t border-dark-700 my-2" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-dark-700 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl shadow-md">
              <CircleDollarSign className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-300">Total Balance</p>
              <p className="text-2xl font-bold text-dark-50">
                ${financialHealth.totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-xl shadow-md">
              <Banknote className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-300">Monthly Income</p>
              <p className="text-2xl font-bold text-dark-50">
                ${financialHealth.monthlyIncome.toLocaleString()}
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
              <p className="text-sm font-medium text-dark-300">Monthly Expenses</p>
              <p className="text-2xl font-bold text-dark-50">
                ${financialHealth.monthlyExpenses.toLocaleString()}
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
              <p className="text-sm font-medium text-dark-300">Savings Rate</p>
              <p className="text-2xl font-bold text-dark-50">
                {financialHealth.savingsRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <QuickTransactionForm onSuccess={fetchData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-dark-800/50 p-6 rounded-2xl shadow-lg border border-dark-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-dark-100">Recent Transactions</h2>
            <Link 
              to="/transactions" 
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm font-medium"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-dark-400 text-center py-4">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-dark-700/50 rounded-xl transition-all duration-200 group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-200 ${
                      transaction.type === 'expense' 
                        ? 'bg-red-900/50 group-hover:bg-red-900/70' 
                        : 'bg-emerald-900/50 group-hover:bg-emerald-900/70'
                    }`}>
                      <DollarSign className={
                        transaction.type === 'expense' ? 'text-red-400' : 'text-emerald-400'
                      } size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-dark-100">{transaction.categories?.name || 'Uncategorized'}</p>
                      {transaction.description && (
                        <p className="text-sm text-dark-400">{transaction.description}</p>
                      )}
                      <p className="text-sm text-dark-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'expense' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}${Number(transaction.amount).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-dark-800/50 p-6 rounded-2xl shadow-lg border border-dark-700">
          <h2 className="text-lg font-semibold text-dark-100 mb-6">Budget Overview</h2>
          <div className="space-y-6">
            {budgets.length === 0 ? (
              <p className="text-dark-400 text-center py-4">No budgets set</p>
            ) : (
              budgets.map((budget) => {
                const percentage = (budget.spent / budget.budget_limit) * 100;
                return (
                  <div key={budget.id} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-dark-200">{budget.categories?.name}</span>
                      <span className={`font-medium ${getBudgetTextColor(budget.spent, budget.budget_limit)}`}>
                        ${Number(budget.spent).toLocaleString()} / ${Number(budget.budget_limit).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getBudgetStatusColor(budget.spent, budget.budget_limit)} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Remaining</span>
                      <span className={`font-medium ${getBudgetTextColor(budget.spent, budget.budget_limit)}`}>
                        ${Math.max(budget.budget_limit - budget.spent, 0).toLocaleString()}
                        {percentage > 100 && (
                          <span className="text-red-400 ml-1">
                            (Over by ${(budget.spent - budget.budget_limit).toLocaleString()})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
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

      {showAccountSettings && (
        <AccountSettings
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
        />
      )}
    </div>
  );
}