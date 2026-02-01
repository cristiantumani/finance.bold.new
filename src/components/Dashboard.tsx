import React, { useState, useEffect } from 'react';
import {
  Plus,
  CircleDollarSign,
  Wallet,
  Receipt,
  Percent,
  DollarSign,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';
import MonthSwitcher from './MonthSwitcher';
import TransactionForm from './TransactionForm';
import SpendingPace from './SpendingPace';
import type { Transaction, Budget } from '../types/finance';
import { Link } from 'react-router-dom';

// Demo user ID for demo mode
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

type TransactionWithCategory = Transaction & {
  categories: {
    name: string;
    expense_type: string;
  } | null;
};

type BudgetWithCategory = Budget & {
  categories: {
    name: string;
  } | null;
};

type CategorySpending = {
  name: string;
  amount: number;
  percentage: number;
  color: string;
};

type MonthlyTrend = {
  month: string;
  income: number;
  expenses: number;
};

function ImprovedDashboard() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [financialHealth, setFinancialHealth] = useState({
    netSavings: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    budgetsOnTrack: 0,
    totalBudgets: 0,
    topCategory: { name: '', amount: 0 }
  });

  // Use demo user ID when in demo mode, otherwise use authenticated user
  const effectiveUserId = isDemoMode ? DEMO_USER_ID : user?.id;

  const categoryColors = [
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
    '#f97316', // orange
  ];

  const fetchData = async () => {
    if (!effectiveUserId) return;

    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();

      // Format dates correctly without timezone issues
      const monthStr = (month + 1).toString().padStart(2, '0');
      const startDate = `${year}-${monthStr}-01`;
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${monthStr}-${lastDayOfMonth.toString().padStart(2, '0')}`;

      // Fetch current month transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name,
            expense_type
          )
        `)
        .eq('user_id', effectiveUserId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch budgets
      const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', effectiveUserId)
        .eq('period', 'monthly')
        .or(`month.eq.${monthKey},month.is.null`);

      if (budgetsError) throw budgetsError;

      // Calculate metrics
      const monthlyIncome = transactionsData
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      const monthlyExpenses = transactionsData
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      const netSavings = monthlyIncome - monthlyExpenses;
      const savingsRate = monthlyIncome > 0
        ? (netSavings / monthlyIncome) * 100
        : 0;

      // Calculate spending by category
      const categoryMap = new Map<string, number>();
      transactionsData
        ?.filter(t => t.type === 'expense')
        .forEach(t => {
          const category = t.categories?.name || 'Uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + Number(t.amount));
        });

      const totalExpenses = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
      const categorySpendingData: CategorySpending[] = Array.from(categoryMap.entries())
        .map(([name, amount], index) => ({
          name,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: categoryColors[index % categoryColors.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      // Calculate budget status
      let budgetsOnTrack = 0;
      const processedBudgets = budgetsData?.map(budget => {
        const categoryTransactions = transactionsData?.filter(
          t => t.type === 'expense' && t.category_id === budget.category_id
        ) || [];

        const spent = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

        // Debug logging for October 2025
        const categoryName = (budget.categories as any)?.name;
        if (categoryName === 'Arriendo' && selectedDate.getFullYear() === 2025 && selectedDate.getMonth() === 9) {
          console.log('=== DEBUG: Arriendo October 2025 (FIXED) ===');
          console.log('Date range:', startDate, 'to', endDate);
          console.log('Budget category_id:', budget.category_id);
          console.log('Matching transactions:', categoryTransactions);
          console.log('Calculated spent:', spent);
          console.log('Budget limit:', budget.budget_limit);
        }

        const percentage = budget.budget_limit > 0 ? (spent / budget.budget_limit) * 100 : 0;
        if (percentage <= 100) budgetsOnTrack++;

        return {
          ...budget,
          spent,
          percentage
        };
      }) || [];

      // OPTIMIZATION: Fetch last 6 months data in ONE query
      const trendsData: MonthlyTrend[] = [];
      const oldestTrendMonth = new Date(year, month - 5, 1);
      const oldestTrendStr = `${oldestTrendMonth.getFullYear()}-${(oldestTrendMonth.getMonth() + 1).toString().padStart(2, '0')}-01`;

      const { data: allTrendTxs } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', effectiveUserId)
        .gte('date', oldestTrendStr)
        .lte('date', endDate);

      // Process each month from cached transactions
      for (let i = 5; i >= 0; i--) {
        const trendMonth = new Date(year, month - i, 1);
        const trendYear = trendMonth.getFullYear();
        const trendMonthNum = trendMonth.getMonth();
        const trendMonthKey = `${trendYear}-${(trendMonthNum + 1).toString().padStart(2, '0')}`;

        const monthTxs = allTrendTxs?.filter(t => t.date.startsWith(trendMonthKey)) || [];
        const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

        trendsData.push({
          month: trendMonth.toLocaleDateString('en-US', { month: 'short' }),
          income,
          expenses
        });
      }

      setTransactions(transactionsData || []);
      setBudgets(processedBudgets);
      setCategorySpending(categorySpendingData);
      setMonthlyTrends(trendsData);
      setFinancialHealth({
        netSavings,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        budgetsOnTrack,
        totalBudgets: budgetsData?.length || 0,
        topCategory: categorySpendingData[0] || { name: 'None', amount: 0 }
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

  const handleAddTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (!effectiveUserId || isDemoMode) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{ user_id: effectiveUserId, ...data }]);

      if (error) throw error;

      await fetchData();
      setIsModalOpen(false);
      setShowQuickAdd(false);
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

  const budgetHealthPercentage = financialHealth.totalBudgets > 0
    ? (financialHealth.budgetsOnTrack / financialHealth.totalBudgets) * 100
    : 0;

  // Generate insights
  const insights = [];
  if (financialHealth.savingsRate < 0) {
    insights.push({
      type: 'warning',
      message: `You spent $${Math.abs(financialHealth.netSavings).toLocaleString()} more than you earned this month.`
    });
  } else if (financialHealth.savingsRate >= 20) {
    insights.push({
      type: 'success',
      message: `Great job! You're saving ${financialHealth.savingsRate.toFixed(0)}% of your income.`
    });
  }

  if (financialHealth.totalBudgets > 0 && budgetHealthPercentage < 50) {
    insights.push({
      type: 'warning',
      message: `${financialHealth.totalBudgets - financialHealth.budgetsOnTrack} of ${financialHealth.totalBudgets} budgets are over limit.`
    });
  }

  if (categorySpending.length > 0 && categorySpending[0].percentage > 40) {
    insights.push({
      type: 'info',
      message: `${categorySpending[0].name} accounts for ${categorySpending[0].percentage.toFixed(0)}% of your spending.`
    });
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Financial Overview
              </h1>
              <p className="text-dark-400 mt-1">Your complete financial snapshot</p>
            </div>
            <MonthSwitcher
              selectedDate={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
        </div>

        {/* Key Metrics - 6 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {/* Net Savings */}
          <div className="lg:col-span-2 bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-3 rounded-lg ${
                financialHealth.netSavings >= 0
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-br from-red-500 to-orange-500'
              }`}>
                {financialHealth.netSavings >= 0 ? (
                  <TrendingUp className="text-white w-6 h-6" />
                ) : (
                  <TrendingDown className="text-white w-6 h-6" />
                )}
              </div>
              {financialHealth.netSavings >= 0 ? (
                <span className="text-xs text-emerald-400 font-medium">Positive</span>
              ) : (
                <span className="text-xs text-red-400 font-medium">Negative</span>
              )}
            </div>
            <p className="text-sm font-medium text-dark-300 mb-1">Net Savings</p>
            <p className={`text-2xl font-bold ${
              financialHealth.netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {financialHealth.netSavings >= 0 ? '+' : ''}${financialHealth.netSavings.toLocaleString()}
            </p>
            <p className="text-xs text-dark-400 mt-1">This month</p>
          </div>

          {/* Monthly Income */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-lg mb-2 w-fit">
              <Wallet className="text-white w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-dark-300 mb-1">Income</p>
            <p className="text-xl font-bold text-dark-50">
              ${financialHealth.monthlyIncome.toLocaleString()}
            </p>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-lg mb-2 w-fit">
              <Receipt className="text-white w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-dark-300 mb-1">Expenses</p>
            <p className="text-xl font-bold text-dark-50">
              ${financialHealth.monthlyExpenses.toLocaleString()}
            </p>
          </div>

          {/* Savings Rate */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-lg mb-2 w-fit">
              <Percent className="text-white w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-dark-300 mb-1">Savings Rate</p>
            <p className="text-xl font-bold text-dark-50">
              {financialHealth.savingsRate.toFixed(1)}%
            </p>
          </div>

          {/* Budget Health */}
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-lg mb-2 w-fit">
              <Target className="text-white w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-dark-300 mb-1">Budgets OK</p>
            <p className="text-xl font-bold text-dark-50">
              {financialHealth.budgetsOnTrack}/{financialHealth.totalBudgets}
            </p>
          </div>
        </div>

        {/* Insights & Alerts */}
        {insights.length > 0 && (
          <div className="mb-8 space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  insight.type === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : insight.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                {insight.type === 'warning' ? (
                  <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                ) : insight.type === 'success' ? (
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
                ) : (
                  <Lightbulb className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                )}
                <p className={`text-sm font-medium ${
                  insight.type === 'warning'
                    ? 'text-yellow-200'
                    : insight.type === 'success'
                      ? 'text-emerald-200'
                      : 'text-blue-200'
                }`}>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Spending Pace Analysis */}
        <div className="mb-8">
          <SpendingPace
            year={selectedDate.getFullYear()}
            month={selectedDate.getMonth() + 1}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spending by Category */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <PieChartIcon className="text-indigo-400" size={20} />
                <h2 className="text-xl font-semibold text-dark-50">Spending by Category</h2>
              </div>
              <Link
                to="/reports"
                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
              >
                Details
                <ArrowRight size={14} />
              </Link>
            </div>

            {categorySpending.length === 0 ? (
              <p className="text-dark-400 text-center py-12">No expenses this month</p>
            ) : (
              <div className="space-y-4">
                {categorySpending.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <p className="text-dark-200 font-medium text-sm">{category.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-dark-400">{category.percentage.toFixed(1)}%</p>
                        <p className="text-sm font-semibold text-dark-100">
                          ${category.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6-Month Trend */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-indigo-400" size={20} />
                <h2 className="text-xl font-semibold text-dark-50">6-Month Trend</h2>
              </div>
              <Link
                to="/reports"
                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
              >
                Reports
                <ArrowRight size={14} />
              </Link>
            </div>

            {monthlyTrends.length === 0 ? (
              <p className="text-dark-400 text-center py-12">No data available</p>
            ) : (
              <div className="space-y-4">
                {/* Chart */}
                <div className="h-48 flex items-end justify-between gap-2">
                  {monthlyTrends.map((trend, index) => {
                    const maxValue = Math.max(
                      ...monthlyTrends.map(t => Math.max(t.income, t.expenses))
                    );
                    const incomeHeight = maxValue > 0 ? (trend.income / maxValue) * 100 : 0;
                    const expensesHeight = maxValue > 0 ? (trend.expenses / maxValue) * 100 : 0;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center gap-1 h-40">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all hover:opacity-80"
                            style={{ height: `${incomeHeight}%` }}
                            title={`Income: $${trend.income.toLocaleString()}`}
                          />
                          <div
                            className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t transition-all hover:opacity-80"
                            style={{ height: `${expensesHeight}%` }}
                            title={`Expenses: $${trend.expenses.toLocaleString()}`}
                          />
                        </div>
                        <p className="text-xs text-dark-400">{trend.month}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-dark-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded" />
                    <p className="text-xs text-dark-300">Income</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <p className="text-xs text-dark-300">Expenses</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income'
                          ? 'bg-emerald-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        <DollarSign size={14} className={
                          transaction.type === 'income'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        } />
                      </div>
                      <div className="min-w-0">
                        <p className="text-dark-100 font-medium text-sm truncate">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-dark-400">
                          {transaction.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${
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

          {/* Budget Performance */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-50">Budget Performance</h2>
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
                  className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Create your first budget
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 5).map((budget: any) => {
                  const percentage = budget.percentage || 0;

                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-dark-200 font-medium text-sm">
                            {budget.categories?.name || 'Unknown'}
                          </p>
                          {percentage > 100 && (
                            <AlertTriangle className="text-red-400" size={14} />
                          )}
                        </div>
                        <p className="text-xs text-dark-400">
                          ${budget.spent.toLocaleString()} / ${budget.budget_limit.toLocaleString()}
                        </p>
                      </div>
                      <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentage > 100
                              ? 'bg-red-500'
                              : percentage === 100
                                ? 'bg-purple-500'
                                : percentage >= 90
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

        {/* Quick Add Transaction - Collapsible */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          <button
            onClick={() => !isDemoMode && setShowQuickAdd(!showQuickAdd)}
            disabled={isDemoMode}
            className={`w-full flex items-center justify-between p-4 transition-colors ${
              isDemoMode
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-dark-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2 rounded-lg">
                <Plus className="text-indigo-400" size={20} />
              </div>
              <div className="text-left">
                <p className="text-dark-100 font-medium">Quick Add Transaction</p>
                <p className="text-xs text-dark-400">
                  {isDemoMode ? 'Not available in demo mode' : 'Click to add income or expense'}
                </p>
              </div>
            </div>
            {!isDemoMode && (
              showQuickAdd ? <ChevronUp className="text-dark-400" size={20} /> : <ChevronDown className="text-dark-400" size={20} />
            )}
          </button>

          {showQuickAdd && !isDemoMode && (
            <div className="p-4 border-t border-dark-700">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium"
              >
                Open Transaction Form
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddTransaction}
          title="Add Transaction"
        />
      )}
    </div>
  );
}

export default ImprovedDashboard;
