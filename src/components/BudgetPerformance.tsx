import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useBudgetPerformance, useCategoryBudgetHistory, useBudgetSuggestions, type BudgetSuggestion, type TimeRange } from '../hooks/useBudgetPerformance';
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type SuggestionCardProps = {
  suggestion: BudgetSuggestion;
  onAccept: (suggestion: BudgetSuggestion, customAmount?: number) => Promise<void>;
  onDismiss: (categoryId: string) => void;
  isAccepting: boolean;
  isDemoMode: boolean;
};

function SuggestionCard({ suggestion, onAccept, onDismiss, isAccepting, isDemoMode }: SuggestionCardProps) {
  const [showManualAdjust, setShowManualAdjust] = useState(false);
  const [customAmount, setCustomAmount] = useState(suggestion.suggested_budget.toString());

  // Color scheme based on suggestion type
  const colors = {
    increase: { bg: 'bg-red-900/20', border: 'border-red-900/30', text: 'text-red-400', icon: TrendingUp },
    decrease: { bg: 'bg-green-900/20', border: 'border-green-900/30', text: 'text-green-400', icon: TrendingDown },
    seasonal: { bg: 'bg-yellow-900/20', border: 'border-yellow-900/30', text: 'text-yellow-400', icon: AlertCircle }
  }[suggestion.suggestion_type];

  const Icon = colors.icon;

  const priorityStyles = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }[suggestion.priority];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={colors.text} size={24} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${colors.text} text-lg`}>
                {suggestion.category_name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded border ${priorityStyles}`}>
                {suggestion.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-dark-200 text-sm mb-3">{suggestion.reasoning}</p>

            {/* Budget Comparison */}
            <div className="flex items-center gap-6 mb-3">
              <div>
                <p className="text-xs text-dark-400 mb-1">Current Budget</p>
                <p className="text-xl font-bold text-dark-100">
                  ${suggestion.current_budget.toLocaleString()}
                </p>
              </div>
              <div className="text-dark-400">→</div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Suggested Budget</p>
                <p className={`text-xl font-bold ${colors.text}`}>
                  ${suggestion.suggested_budget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Change</p>
                <p className={`text-lg font-semibold ${colors.text}`}>
                  {suggestion.adjustment_percentage > 0 ? '+' : ''}
                  {suggestion.adjustment_percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-xs text-dark-400">
              <span>Avg Spent: ${Math.round(suggestion.average_spent).toLocaleString()}/mo</span>
              <span>•</span>
              <span>Over Budget: {suggestion.months_over_budget}/{suggestion.months_analyzed} months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        {!showManualAdjust ? (
          <>
            <button
              onClick={() => onAccept(suggestion)}
              disabled={isAccepting || isDemoMode}
              className={`px-4 py-2 ${colors.text} bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              title={isDemoMode ? "Disabled in demo mode" : ""}
            >
              {isAccepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Accept Suggestion
                </>
              )}
            </button>
            <button
              onClick={() => setShowManualAdjust(true)}
              disabled={isDemoMode}
              className="px-4 py-2 text-dark-300 hover:text-dark-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDemoMode ? "Disabled in demo mode" : ""}
            >
              Custom Amount
            </button>
            <button
              onClick={() => onDismiss(suggestion.category_id)}
              className="px-4 py-2 text-dark-400 hover:text-dark-200 transition-colors ml-auto"
            >
              Dismiss
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <input
                type="number"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter custom amount"
              />
            </div>
            <button
              onClick={() => onAccept(suggestion, Number(customAmount))}
              disabled={isAccepting || !customAmount || Number(customAmount) <= 0}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setShowManualAdjust(false);
                setCustomAmount(suggestion.suggested_budget.toString());
              }}
              className="px-4 py-2 text-dark-300 hover:text-dark-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  year: number;
  month: number;
};

export default function BudgetPerformance({ year, month }: Props) {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'month' | 'category' | 'suggestions'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(6);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [acceptingBudget, setAcceptingBudget] = useState<string | null>(null);

  const { monthData, loading: monthLoading, error: monthError } = useBudgetPerformance(year, month);
  const { historyData, loading: historyLoading, error: historyError } = useCategoryBudgetHistory(
    selectedCategory || '',
    6
  );
  const { suggestions, loading: suggestionsLoading, error: suggestionsError } = useBudgetSuggestions(timeRange);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under': return 'text-green-400';
      case 'near': return 'text-yellow-400';
      case 'on_budget': return 'text-purple-400';
      case 'over': return 'text-red-400';
      default: return 'text-dark-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'under': return 'bg-green-500';
      case 'near': return 'bg-yellow-500';
      case 'on_budget': return 'bg-purple-500';
      case 'over': return 'bg-red-500';
      default: return 'bg-dark-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under': return <CheckCircle size={16} className="text-green-400" />;
      case 'near': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'on_budget': return <CheckCircle size={16} className="text-purple-400" />;
      case 'over': return <XCircle size={16} className="text-red-400" />;
      default: return null;
    }
  };

  const handleAcceptSuggestion = async (
    suggestion: BudgetSuggestion,
    customAmount?: number
  ) => {
    if (!user) return;

    const newBudget = customAmount || suggestion.suggested_budget;

    try {
      setAcceptingBudget(suggestion.category_id);

      const { error } = await supabase
        .from('budgets')
        .update({ budget_limit: newBudget })
        .eq('user_id', user.id)
        .eq('category_id', suggestion.category_id)
        .eq('period', 'monthly');

      if (error) throw error;

      alert(`✓ Budget for ${suggestion.category_name} updated to $${newBudget.toLocaleString()}`);

      // Refresh page to show updated data
      window.location.reload();
    } catch (err: any) {
      console.error('Error updating budget:', err);
      alert(`✗ Failed to update budget: ${err.message}`);
    } finally {
      setAcceptingBudget(null);
    }
  };

  const handleDismissSuggestion = (categoryId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(categoryId));
  };

  if (monthLoading && activeTab === 'month') {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (monthError && activeTab === 'month') {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="text-red-400">
          <p className="font-semibold">Error loading budget performance</p>
          <p className="text-sm mt-1">{monthError.message}</p>
        </div>
      </div>
    );
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate summary stats
  const summary = {
    total: monthData.length,
    under: monthData.filter(c => c.status === 'under').length,
    near: monthData.filter(c => c.status === 'near').length,
    on_budget: monthData.filter(c => c.status === 'on_budget').length,
    over: monthData.filter(c => c.status === 'over').length,
  };

  // Prepare chart data for category view
  const selectedCategoryData = monthData.find(c => c.category_id === selectedCategory);
  const chartData = historyData.length > 0 ? {
    labels: historyData.map(h => {
      const date = new Date(h.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Budget',
        data: historyData.map(h => h.budget),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Actual Spending',
        data: historyData.map(h => h.spent),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f9fafb',
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(75, 85, 99, 0.3)' },
      },
      y: {
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => `$${value.toLocaleString()}`,
        },
        grid: { color: 'rgba(75, 85, 99, 0.3)' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-dark-50 mb-2">Budget Performance</h3>
        <p className="text-dark-400 text-sm">Track how your spending compares to your budgets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('month')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'month'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-dark-400 hover:text-dark-300'
          }`}
        >
          Month View
        </button>
        <button
          onClick={() => {
            setActiveTab('category');
            if (!selectedCategory && monthData.length > 0) {
              setSelectedCategory(monthData[0].category_id);
            }
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'category'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-dark-400 hover:text-dark-300'
          }`}
        >
          Category Trends
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-dark-400 hover:text-dark-300'
          }`}
        >
          Budget Suggestions
          {suggestions.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
              {suggestions.length}
            </span>
          )}
        </button>
      </div>

      {/* Month View */}
      {activeTab === 'month' && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm mb-1">Total Categories</p>
              <p className="text-2xl font-bold text-dark-50">{summary.total}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={16} className="text-green-400" />
                <p className="text-dark-400 text-sm">On Track</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{summary.under}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} className="text-yellow-400" />
                <p className="text-dark-400 text-sm">Near Limit</p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{summary.near}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={16} className="text-purple-400" />
                <p className="text-dark-400 text-sm">On Budget</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">{summary.on_budget}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle size={16} className="text-red-400" />
                <p className="text-dark-400 text-sm">Over Budget</p>
              </div>
              <p className="text-2xl font-bold text-red-400">{summary.over}</p>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-dark-300">
              Budget Details - {monthName}
            </h4>
            {monthData.length === 0 ? (
              <p className="text-dark-400 text-center py-8">No budgets set for this month</p>
            ) : (
              monthData.map(category => (
                <div key={category.category_id} className="bg-dark-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(category.status)}
                      <div>
                        <p className="text-dark-100 font-medium">{category.category_name}</p>
                        <p className="text-xs text-dark-400 capitalize">
                          {category.expense_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getStatusColor(category.status)}`}>
                        {category.percentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-dark-400">
                        ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusBg(category.status)} transition-all duration-300`}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="mt-2 flex justify-between text-xs">
                    <span className={category.remaining >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {category.remaining >= 0 ? 'Remaining' : 'Over'}: $
                      {Math.abs(category.remaining).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category Trends View */}
      {activeTab === 'category' && (
        <div>
          {/* Category Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Select Category
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-auto bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {monthData.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          {historyLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse text-dark-400">Loading history...</div>
            </div>
          ) : historyError ? (
            <div className="text-red-400">
              <p className="font-semibold">Error loading category history</p>
              <p className="text-sm mt-1">{historyError.message}</p>
            </div>
          ) : historyData.length === 0 ? (
            <p className="text-dark-400 text-center py-12">No history available for this category</p>
          ) : (
            <>
              {/* Trend Summary */}
              {selectedCategoryData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-dark-700 rounded-lg p-4">
                    <p className="text-dark-400 text-sm mb-1">Current Month</p>
                    <p className="text-2xl font-bold text-dark-50">
                      ${selectedCategoryData.spent.toLocaleString()}
                    </p>
                    <p className="text-xs text-dark-400 mt-1">
                      of ${selectedCategoryData.budget.toLocaleString()} budget
                    </p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4">
                    <p className="text-dark-400 text-sm mb-1">6-Month Average</p>
                    <p className="text-2xl font-bold text-dark-50">
                      ${Math.round(historyData.reduce((sum, h) => sum + h.spent, 0) / historyData.length).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4">
                    <p className="text-dark-400 text-sm mb-1">Months Over Budget</p>
                    <p className="text-2xl font-bold text-red-400">
                      {historyData.filter(h => h.status === 'over').length}
                    </p>
                    <p className="text-xs text-dark-400 mt-1">
                      out of {historyData.length} months
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              {chartData && (
                <div className="h-80 mb-6">
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}

              {/* Monthly Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-dark-300 mb-3">Monthly Breakdown</h4>
                {historyData.slice().reverse().map(monthHistory => {
                  const date = new Date(monthHistory.month + '-01');
                  const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                  return (
                    <div key={monthHistory.month} className="bg-dark-700 rounded-lg p-3 flex items-center justify-between group hover:bg-dark-600 transition-colors">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(monthHistory.status)}
                        <span className="text-dark-200">{monthLabel}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-dark-100 font-medium">
                            ${monthHistory.spent.toLocaleString()}
                          </p>
                          <p className="text-xs text-dark-400">
                            of ${monthHistory.budget.toLocaleString()}
                          </p>
                        </div>
                        <div className={`text-right min-w-[60px] ${getStatusColor(monthHistory.status)}`}>
                          <p className="font-semibold">{monthHistory.percentage.toFixed(0)}%</p>
                        </div>
                        <button
                          onClick={() => navigate(`/transactions?category=${selectedCategory}&month=${monthHistory.month}&type=expense`)}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1 text-xs text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-all"
                          title="View transactions for this month"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Budget Suggestions View */}
      {activeTab === 'suggestions' && (
        <div>
          {/* Time Range Toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-dark-300">Analysis Period:</span>
              <div className="flex bg-dark-700 rounded-lg p-1">
                <button
                  onClick={() => setTimeRange(3)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === 3 ? 'bg-indigo-500 text-white' : 'text-dark-300'
                  }`}
                >
                  3 Months
                </button>
                <button
                  onClick={() => setTimeRange(6)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === 6 ? 'bg-indigo-500 text-white' : 'text-dark-300'
                  }`}
                >
                  6 Months
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions List */}
          {suggestionsLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse text-dark-400">Analyzing your spending patterns...</div>
            </div>
          ) : suggestionsError ? (
            <div className="text-red-400">
              <p className="font-semibold">Error loading suggestions</p>
              <p className="text-sm mt-1">{suggestionsError.message}</p>
            </div>
          ) : suggestions.filter(s => !dismissedSuggestions.has(s.category_id)).length === 0 ? (
            <div className="bg-dark-700 rounded-lg p-12 text-center">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-100 mb-2">
                Your budgets look good!
              </h3>
              <p className="text-dark-400">
                No significant adjustments recommended based on your {timeRange}-month spending pattern.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions
                .filter(s => !dismissedSuggestions.has(s.category_id))
                .map(suggestion => (
                  <SuggestionCard
                    key={suggestion.category_id}
                    suggestion={suggestion}
                    onAccept={handleAcceptSuggestion}
                    onDismiss={handleDismissSuggestion}
                    isAccepting={acceptingBudget === suggestion.category_id}
                    isDemoMode={isDemoMode}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
