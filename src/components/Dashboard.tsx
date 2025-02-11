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
  LogOut
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    isOpen: false,
    position: { top: 0, left: 0 }
  });

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
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
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
        .eq('user_id', user.id);

      if (budgetsError) throw budgetsError;

      // Calculate financial health
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
        <div className="flex gap-4">
          <Link 
            to="/upload"
            className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-indigo-600"
          >
            <Upload size={20} />
            Import Transactions
          </Link>
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
                <button
                  onClick={() => {
                    setShowAccountSettings(true);
                    setDropdownState(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={18} />
                  <span>Account Settings</span>
                </button>
                <div className="border-t border-gray-100 my-2" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
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

      <div className="mb-8">
        <QuickTransactionForm onSuccess={fetchData} />
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

      {showAccountSettings && (
        <AccountSettings
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
        />
      )}
    </div>
  );
}