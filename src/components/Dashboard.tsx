import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FolderOpen, 
  Settings, 
  ChevronDown, 
  Upload, 
  Calculator, 
  BarChart, 
  LogOut,
  Menu,
  X,
  CircleDollarSign,
  Wallet,
  Receipt,
  Percent,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MonthSwitcher from './MonthSwitcher';
import TransactionForm from './TransactionForm';
import QuickTransactionForm from './QuickTransactionForm';
import AccountSettings from './AccountSettings';
import SmartFinanceTips from './SmartFinanceTips';
import type { Transaction, Budget } from '../types/finance';

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

function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownState, setDropdownState] = useState({
    isOpen: false,
    position: { top: 0, left: 0 }
  });
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialHealth, setFinancialHealth] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0
  });

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
    fetchData();
  }, [user, selectedDate]);

  const handleMoreOptionsClick = (event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    setDropdownState(prev => ({
      isOpen: !prev.isOpen,
      position: {
        top: rect.bottom + 8,
        left: Math.min(rect.right - 224, window.innerWidth - 240)
      }
    }));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
    <div className="relative min-h-screen pb-24">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700 z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-dark-200 hover:text-dark-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700">
            <div className="p-4 space-y-4">
              <Link 
                to="/categories"
                className="flex items-center gap-2 w-full p-3 bg-dark-800 text-dark-100 rounded-xl hover:bg-dark-700 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FolderOpen size={20} />
                <span>Categories</span>
              </Link>
              <Link 
                to="/budgets"
                className="flex items-center gap-2 w-full p-3 bg-dark-800 text-dark-100 rounded-xl hover:bg-dark-700 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calculator size={20} />
                <span>Budgets</span>
              </Link>
              <Link 
                to="/reports"
                className="flex items-center gap-2 w-full p-3 bg-dark-800 text-dark-100 rounded-xl hover:bg-dark-700 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart size={20} />
                <span>Reports</span>
              </Link>
              <Link 
                to="/upload"
                className="flex items-center gap-2 w-full p-3 bg-dark-800 text-dark-100 rounded-xl hover:bg-dark-700 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Upload size={20} />
                <span>Import</span>
              </Link>
              <button
                onClick={() => {
                  setShowAccountSettings(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full p-3 bg-dark-800 text-dark-100 rounded-xl hover:bg-dark-700 transition-all"
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full p-3 bg-dark-800 text-red-400 rounded-xl hover:bg-dark-700 transition-all"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <div className="mt-2">
            <MonthSwitcher 
              selectedDate={selectedDate} 
              onChange={setSelectedDate} 
            />
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Link 
            to="/categories"
            className="flex items-center gap-2 bg-dark-800 text-dark-100 px-4 py-2.5 rounded-xl hover:bg-dark-700 transition-all duration-200 border border-dark-700 shadow-sm hover:shadow-md"
          >
            <FolderOpen size={20} />
            <span>Add Category</span>
          </Link>
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

      {/* Mobile Month Switcher */}
      <div className="lg:hidden sticky top-16 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700 z-30 p-4">
        <MonthSwitcher 
          selectedDate={selectedDate} 
          onChange={setSelectedDate} 
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-0">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-800/50 backdrop-blur-xl p-4 lg:p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 lg:p-3 rounded-xl shadow-md">
                <CircleDollarSign className="text-white w-4 h-4 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Total Balance</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  ${financialHealth.totalBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-4 lg:p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 lg:p-3 rounded-xl shadow-md">
                <Wallet className="text-white w-4 h-4 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Monthly Income</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  ${financialHealth.monthlyIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-4 lg:p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-rose-500 to-pink-500 p-2 lg:p-3 rounded-xl shadow-md">
                <Receipt className="text-white w-4 h-4 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Monthly Expenses</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  ${financialHealth.monthlyExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-4 lg:p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 lg:p-3 rounded-xl shadow-md">
                <Percent className="text-white w-4 h-4 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Savings Rate</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  {financialHealth.savingsRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Finance Tips */}
        <div className="mb-8">
          <SmartFinanceTips />
        </div>

        {/* Quick Add Transaction Form */}
        <div className="mb-8">
          <QuickTransactionForm onSuccess={fetchData} />
        </div>

        {/* Recent Transactions */}
        <div className="bg-dark-800/50 backdrop-blur-xl p-4 lg:p-6 rounded-2xl shadow-lg border border-dark-700 mb-8">
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
              transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-dark-700/50 rounded-xl transition-all duration-200 group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 lg:p-3 rounded-xl transition-all duration-200 ${
                      transaction.type === 'expense' 
                        ? 'bg-red-900/50 group-hover:bg-red-900/70' 
                        : 'bg-emerald-900/50 group-hover:bg-emerald-900/70'
                    }`}>
                      <DollarSign className={
                        transaction.type === 'expense' ? 'text-red-400' : 'text-emerald-400'
                      } size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-dark-100">{transaction.categories?.name || 'Uncategorized'}</p>
                      {transaction.description && (
                        <p className="text-sm text-dark-400">{transaction.description}</p>
                      )}
                      <p className="text-xs text-dark-400">
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
      </div>

      {/* Mobile Add Transaction Button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <TransactionForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
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
          }}
          title="Add Transaction"
        />
      )}

      {showAccountSettings && (
        <AccountSettings
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;