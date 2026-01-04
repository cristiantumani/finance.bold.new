import { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { useCategoryBreakdown } from '../hooks/useCategoryBreakdown';

type Props = {
  year: number;
  month: number;
};

export default function CategoryBreakdown({ year, month }: Props) {
  const [filters, setFilters] = useState({
    includeFixed: false,
    includeVariable: true,
    includeControllableFixed: true,
  });

  const { data, totalExpenses, loading, error } = useCategoryBreakdown(year, month, filters);

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="text-red-400">
          <p className="font-semibold">Error loading category breakdown</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-dark-50 mb-4">Category Breakdown</h3>
        <p className="text-dark-400 text-center py-12">No expense data for this month</p>
      </div>
    );
  }

  // Generate colors for the pie chart
  const colors = [
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(249, 115, 22, 0.8)',  // Orange
    'rgba(245, 158, 11, 0.8)',  // Amber
    'rgba(234, 179, 8, 0.8)',   // Yellow
    'rgba(132, 204, 22, 0.8)',  // Lime
    'rgba(34, 197, 94, 0.8)',   // Green
    'rgba(20, 184, 166, 0.8)',  // Teal
    'rgba(6, 182, 212, 0.8)',   // Cyan
    'rgba(14, 165, 233, 0.8)',  // Sky
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(99, 102, 241, 0.8)',  // Indigo
    'rgba(139, 92, 246, 0.8)',  // Violet
    'rgba(168, 85, 247, 0.8)',  // Purple
    'rgba(217, 70, 239, 0.8)',  // Fuchsia
    'rgba(236, 72, 153, 0.8)',  // Pink
  ];

  const chartData = {
    labels: data.map(cat => cat.category_name),
    datasets: [
      {
        data: data.map(cat => cat.total),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(c => c.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#f9fafb',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const percentage = data[context.dataIndex].percentage;
            return `${context.label}: $${value.toLocaleString()} (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-dark-50">
          Expense Breakdown - {monthName}
        </h3>
        <div className="text-right">
          <p className="text-sm text-dark-400">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-dark-700 rounded-lg">
        <p className="text-sm font-medium text-dark-300 mb-3">Filter by Expense Type:</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeVariable}
              onChange={(e) => setFilters({ ...filters, includeVariable: e.target.checked })}
              className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-dark-800"
            />
            <span className="text-dark-200">Variable</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeControllableFixed}
              onChange={(e) => setFilters({ ...filters, includeControllableFixed: e.target.checked })}
              className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-dark-800"
            />
            <span className="text-dark-200">Controllable Fixed</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeFixed}
              onChange={(e) => setFilters({ ...filters, includeFixed: e.target.checked })}
              className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-dark-800"
            />
            <span className="text-dark-200">Fixed (Rent, School, etc.)</span>
          </label>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <Pie data={chartData} options={chartOptions} />
      </div>

      {/* Category List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-dark-300 mb-3">Top Categories</h4>
        {data.slice(0, 10).map((cat, index) => (
          <div key={cat.category_id} className="flex items-center justify-between p-3 bg-dark-700 rounded">
            <div className="flex items-center space-x-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index] }}
              ></div>
              <div>
                <p className="text-dark-100 font-medium">{cat.category_name}</p>
                <p className="text-xs text-dark-400 capitalize">{cat.expense_type.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-dark-100 font-semibold">${cat.total.toLocaleString()}</p>
              <p className="text-xs text-dark-400">{cat.percentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
