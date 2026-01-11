import React, { useState, useEffect } from 'react';
import {
  Plus,
  CircleDollarSign,
  Wallet,
  Receipt,
  Percent,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';
import MonthSwitcher from './MonthSwitcher';
import TransactionForm from './TransactionForm';
import QuickTransactionForm from './QuickTransactionForm';
import type { Transaction, Budget } from '../types/finance';
import { Link } from 'react-router-dom';

// Demo user ID for demo mode
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

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
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialHealth, setFinancialHealth] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0
  });

  // Use demo user ID when in demo mode, otherwise use authenticated user
  const effectiveUserId = isDemoMode ? DEMO_USER_ID : user?.id;

  const fetchData = async () => {
    if (!effectiveUserId) return;

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
        .eq('user_id', effectiveUserId)
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
        .eq('user_id', effectiveUserId);

      if (budgetsError) throw budgetsError;

      const monthlyIncome = transactionsData
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      const monthlyExpenses = transactionsData
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      const savingsRate = monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
        : 0;

      setTransactions(transactionsData || []);
      setBudgets(budgetsData || []);
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
  }, [effectiveUserId, selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Month Switcher */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-dark-400 mt-1">Overview of your finances</p>
            </div>
            <div className="flex items-center gap-4">
              <MonthSwitcher
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
              <button
                onClick={() => !isDemoMode && setIsModalOpen(true)}
                disabled={isDemoMode}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all shadow-lg ${
                  isDemoMode
                    ? 'bg-dark-900 text-dark-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                }`}
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Transaction</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-dark-800 p-4 lg:p-6 rounded-xl border border-dark-700">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 lg:p-3 rounded-lg">
                <CircleDollarSign className="text-white w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Total Balance</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  ${financialHealth.totalBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 p-4 lg:p-6 rounded-xl border border-dark-700">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 lg:p-3 rounded-lg">
                <Wallet className="text-white w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Monthly Income</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  ${financialHealth.monthlyIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 p-4 lg:p-6 rounded-xl border border-dark-700">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 lg:p-3 rounded-lg">
                <Receipt className="text-white w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Monthly Expenses</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  ${financialHealth.monthlyExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 p-4 lg:p-6 rounded-xl border border-dark-700">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 lg:p-3 rounded-lg">
                <Percent className="text-white w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-dark-300">Savings Rate</p>
                <p className="text-lg lg:text-2xl font-bold text-dark-50">
                  {financialHealth.savingsRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Transaction Form */}
        <div className="mb-8">
          <QuickTransactionForm onSuccess={fetchData} />
        </div>

        {/* Recent Transactions & Budget Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-50">Recent Transactions</h2>
              <Link
                to="/transactions"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm"
              >
                View All
                <ArrowRight size={16} />
              </Link>
            </div>

            {transactions.length === 0 ? (
              <p className="text-dark-400 text-center py-8">No transactions this month</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income'
                          ? 'bg-emerald-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        <DollarSign size={16} className={
                          transaction.type === 'income'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        } />
                      </div>
                      <div>
                        <p className="text-dark-100 font-medium">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-dark-400">
                          {transaction.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${
                      transaction.type === 'income'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget Overview */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-50">Budget Overview</h2>
              <Link
                to="/budgets"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm"
              >
                Manage
                <ArrowRight size={16} />
              </Link>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400 mb-4">No budgets set</p>
                <Link
                  to="/budgets"
                  className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
                >
                  Create your first budget
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 5).map((budget) => {
                  const percentage = budget.budget_limit > 0
                    ? (budget.spent / budget.budget_limit) * 100
                    : 0;

                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-dark-200 font-medium">
                          {budget.categories?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-dark-400">
                          ${budget.spent.toLocaleString()} / ${budget.budget_limit.toLocaleString()}
                        </p>
                      </div>
                      <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentage >= 100
                              ? 'bg-red-500'
                              : percentage >= 80
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchData();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
