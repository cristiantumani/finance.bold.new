import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useMonthlyOverview } from '../hooks/useMonthlyOverview';
import { CHART_COLORS, CHART_OPTIONS } from '../lib/constants/chartConfig';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  year: number;
};

export default function MonthlyOverview({ year }: Props) {
  const { data, loading, error } = useMonthlyOverview(year);

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-sm border border-dark-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-sm border border-dark-700 p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle size={24} />
          <div>
            <p className="font-medium">Failed to load monthly overview</p>
            <p className="text-sm text-dark-400">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totals = data.reduce(
    (acc, month) => ({
      income: acc.income + month.income,
      expense: acc.expense + month.expense,
      savings: acc.savings + month.savings,
      budget: acc.budget + month.budget,
    }),
    { income: 0, expense: 0, savings: 0, budget: 0 }
  );

  const budgetUtilization = totals.budget > 0
    ? ((totals.expense / totals.budget) * 100).toFixed(1)
    : '0';

  // Prepare chart data
  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.month + '-01');
      return date.toLocaleDateString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Income',
        data: data.map(d => d.income),
        backgroundColor: CHART_COLORS.income.background,
        borderColor: CHART_COLORS.income.border,
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: data.map(d => d.expense),
        backgroundColor: CHART_COLORS.expense.background,
        borderColor: CHART_COLORS.expense.border,
        borderWidth: 2,
      },
      {
        label: 'Budget',
        data: data.map(d => d.budget),
        backgroundColor: CHART_COLORS.budget.background,
        borderColor: CHART_COLORS.budget.border,
        borderWidth: 2,
      },
      {
        label: 'Savings',
        data: data.map(d => d.savings),
        backgroundColor: CHART_COLORS.savings.background,
        borderColor: CHART_COLORS.savings.border,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="bg-dark-800 rounded-xl shadow-sm border border-dark-700 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dark-50 mb-2">
          Monthly Overview - {year}
        </h2>
        <p className="text-sm text-dark-400">
          Track your income, expenses, budget, and savings throughout the year
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Income */}
        <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-400">Total Income</span>
            <TrendingUp className="text-green-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-400">
            ${totals.income.toLocaleString()}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-400">Total Expenses</span>
            <TrendingDown className="text-red-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-red-400">
            ${totals.expense.toLocaleString()}
          </p>
        </div>

        {/* Total Budget */}
        <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-400">Total Budget</span>
            <DollarSign className="text-amber-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            ${totals.budget.toLocaleString()}
          </p>
          <p className="text-xs text-dark-500 mt-1">
            {budgetUtilization}% utilized
          </p>
        </div>

        {/* Total Savings */}
        <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-400">Total Savings</span>
            <TrendingUp className={totals.savings >= 0 ? 'text-blue-400' : 'text-red-400'} size={20} />
          </div>
          <p className={`text-2xl font-bold ${totals.savings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ${Math.abs(totals.savings).toLocaleString()}
          </p>
          {totals.savings < 0 && (
            <p className="text-xs text-red-400 mt-1">Deficit</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <Bar data={chartData} options={CHART_OPTIONS} />
      </div>
    </div>
  );
}
