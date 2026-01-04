import { Line } from 'react-chartjs-2';
import { useSpendingPace } from '../hooks/useSpendingPace';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';

type Props = {
  year: number;
  month: number;
};

export default function SpendingPace({ year, month }: Props) {
  const { data, currentDayOfMonth, loading, error } = useSpendingPace(year, month, 3);

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/3 mb-6"></div>
          <div className="h-80 bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="text-red-400">
          <p className="font-semibold">Error loading spending pace</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-dark-50 mb-4">Spending Pace</h3>
        <p className="text-dark-400 text-center py-12">No spending data available</p>
      </div>
    );
  }

  const currentMonth = data[0];
  const previousMonths = data.slice(1);

  // Calculate predictions based on previous months' averages
  const calculatePrediction = () => {
    if (!currentMonth.isCurrent || currentDayOfMonth >= 31) return null;

    // Calculate average spending in remaining days from previous months
    const remainingDays = new Date(year, month, 0).getDate() - currentDayOfMonth;
    let avgRemainingSpending = 0;

    previousMonths.forEach(m => {
      const spendingAfterCurrentDay = m.days
        .filter(d => d.day > currentDayOfMonth)
        .reduce((sum, d) => sum + d.amount, 0);
      avgRemainingSpending += spendingAfterCurrentDay;
    });

    avgRemainingSpending = previousMonths.length > 0 ? avgRemainingSpending / previousMonths.length : 0;

    const currentSpending = currentMonth.days
      .filter(d => d.day <= currentDayOfMonth)
      .reduce((sum, d) => sum + d.amount, 0);

    const projectedTotal = currentSpending + avgRemainingSpending;

    return {
      currentSpending,
      avgRemainingSpending,
      projectedTotal,
      remainingDays,
    };
  };

  const prediction = calculatePrediction();

  // Prepare chart data
  const labels = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const datasets = data.map((monthData, index) => {
    const isCurrentMonth = monthData.isCurrent;
    const color = isCurrentMonth
      ? 'rgba(59, 130, 246, 1)' // Blue for current month
      : index === 1
        ? 'rgba(168, 85, 247, 0.7)' // Purple for last month
        : 'rgba(156, 163, 175, 0.5)'; // Gray for older months

    return {
      label: monthData.monthLabel,
      data: monthData.days.map(d => d.cumulative),
      borderColor: color,
      backgroundColor: color.replace('1)', '0.1)'),
      borderWidth: isCurrentMonth ? 3 : 2,
      tension: 0.3,
      pointRadius: isCurrentMonth ? 0 : 0,
      pointHoverRadius: 6,
    };
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f9fafb',
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          },
        },
      },
      annotation: currentMonth.isCurrent ? {
        annotations: {
          currentDay: {
            type: 'line' as const,
            xMin: currentDayOfMonth - 1,
            xMax: currentDayOfMonth - 1,
            borderColor: 'rgba(34, 197, 94, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'Today',
              position: 'start' as const,
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              color: '#fff',
              font: {
                size: 11,
              },
            },
          },
        },
      } : {},
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day of Month',
          color: '#9ca3af',
        },
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Cumulative Spending ($)',
          color: '#9ca3af',
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => `$${value.toLocaleString()}`,
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-dark-50 mb-2">Spending Pace Analysis</h3>
        <p className="text-dark-400 text-sm">
          Track how quickly you spend throughout the month compared to previous months
        </p>
      </div>

      {/* Summary Cards */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-400" size={20} />
              <p className="text-dark-400 text-sm">Spent So Far (Day {currentDayOfMonth})</p>
            </div>
            <p className="text-2xl font-bold text-dark-50">
              ${prediction.currentSpending.toLocaleString()}
            </p>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-purple-400" size={20} />
              <p className="text-dark-400 text-sm">Avg. Next {prediction.remainingDays} Days</p>
            </div>
            <p className="text-2xl font-bold text-dark-50">
              ${prediction.avgRemainingSpending.toLocaleString()}
            </p>
            <p className="text-xs text-dark-400 mt-1">
              Based on previous months
            </p>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-amber-400" size={20} />
              <p className="text-dark-400 text-sm">Projected Total</p>
            </div>
            <p className="text-2xl font-bold text-dark-50">
              ${prediction.projectedTotal.toLocaleString()}
            </p>
            <p className="text-xs text-dark-400 mt-1">
              Expected by month end
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-96">
        <Line data={{ labels, datasets }} options={chartOptions} />
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-dark-700 rounded-lg">
        <h4 className="text-sm font-semibold text-dark-300 mb-2">💡 Insights</h4>
        <ul className="space-y-2 text-sm text-dark-400">
          {currentMonth.isCurrent && prediction && (
            <>
              <li>
                • You're on day {currentDayOfMonth} and have spent ${prediction.currentSpending.toLocaleString()} so far
              </li>
              <li>
                • Based on previous months, you typically spend ~${Math.round(prediction.avgRemainingSpending).toLocaleString()}
                in the remaining {prediction.remainingDays} days
              </li>
              <li>
                • If the pattern continues, you'll spend approximately ${prediction.projectedTotal.toLocaleString()} this month
              </li>
            </>
          )}
          <li>
            • Compare the lines to see if you're spending faster or slower than usual
          </li>
          <li>
            • Steeper slopes indicate days with higher spending
          </li>
        </ul>
      </div>
    </div>
  );
}
