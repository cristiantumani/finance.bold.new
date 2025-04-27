import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  DollarSign,
  CircleDollarSign,
  Wallet,
  Receipt,
  Percent,
  Filter,
  AlertCircle,
  ChevronDown,
  Lock,
  Sliders,
  Shuffle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type CategorySpending = {
  category_name: string;
  total_amount: number;
  expense_type: string | null;
};

type MonthlyTotal = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

type BudgetComparison = {
  category_name: string;
  budget_amount: number;
  actual_amount: number;
  difference: number;
  deviation_percentage: number;
};

type CategoryEvolution = {
  category_name: string;
  months: string[];
  budgeted: number[];
  actual: number[];
};

type GlobalBudgetPerformance = {
  category_name: string;
  total_budget: number;
  total_spent: number;
  variance: number;
  variance_percentage: number;
};

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [globalBudgetPerformance, setGlobalBudgetPerformance] = useState<GlobalBudgetPerformance[]>([]);
  const [categoryEvolution, setCategoryEvolution] = useState<CategoryEvolution[]>([]);
  const [expenseTypeDistribution, setExpenseTypeDistribution] = useState<{
    fixed: number;
    variable: number;
    controllable_fixed: number;
  }>({ fixed: 0, variable: 0, controllable_fixed: 0 });

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  }).reverse();

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [user]);

  const fetchMonthlyOverview = async () => {
    if (!user) return;

    try {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) throw error;

      // Group transactions by month
      const monthlyData = transactions.reduce((acc: { [key: string]: MonthlyTotal }, transaction) => {
        const month = transaction.date.substring(0, 7); // YYYY-MM format
        if (!acc[month]) {
          acc[month] = { month, income: 0, expenses: 0, savings: 0 };
        }
        
        if (transaction.type === 'income') {
          acc[month].income += Number(transaction.amount);
        } else {
          acc[month].expenses += Number(transaction.amount);
        }
        
        acc[month].savings = acc[month].income - acc[month].expenses;
        return acc;
      }, {});

      setMonthlyTotals(Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)));
    } catch (error) {
      console.error('Error fetching monthly overview:', error);
    }
  };

  const fetchExpenseDistribution = async () => {
    if (!user) return;

    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories (
            expense_type
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', new Date(selectedYear, 0, 1).toISOString())
        .lte('date', new Date(selectedYear, 11, 31).toISOString());

      if (error) throw error;

      const distribution = transactions.reduce((acc: { [key: string]: number }, transaction) => {
        const expenseType = transaction.categories?.expense_type || 'variable';
        acc[expenseType] = (acc[expenseType] || 0) + Number(transaction.amount);
        return acc;
      }, { fixed: 0, variable: 0, controllable_fixed: 0 });

      setExpenseTypeDistribution(distribution);
    } catch (error) {
      console.error('Error fetching expense distribution:', error);
    }
  };

  const fetchCategoryBreakdown = async () => {
    if (!user) return;

    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories (
            name,
            expense_type
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', new Date(selectedYear, 0, 1).toISOString())
        .lte('date', new Date(selectedYear, 11, 31).toISOString());

      if (error) throw error;

      const categoryTotals = transactions.reduce((acc: CategorySpending[], transaction) => {
        const categoryName = transaction.categories?.name || 'Uncategorized';
        const existingCategory = acc.find(c => c.category_name === categoryName);
        
        if (existingCategory) {
          existingCategory.total_amount += Number(transaction.amount);
        } else {
          acc.push({
            category_name: categoryName,
            total_amount: Number(transaction.amount),
            expense_type: transaction.categories?.expense_type || null
          });
        }
        
        return acc;
      }, []);

      setCategorySpending(categoryTotals.sort((a, b) => b.total_amount - a.total_amount));
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
    }
  };

  const fetchGlobalBudgetPerformance = async () => {
    if (!user) return;

    try {
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select(`
          budget_limit,
          period,
          categories (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (budgetsError) throw budgetsError;

      // Get the earliest transaction date to calculate total months
      const { data: earliestTransaction } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(1)
        .single();

      const startDate = earliestTransaction ? new Date(earliestTransaction.date) : new Date();
      const currentDate = new Date();
      const totalMonths = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
        (currentDate.getMonth() - startDate.getMonth()) + 1;

      const performance = await Promise.all(
        budgets.map(async (budget) => {
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('category_id', budget.categories.id)
            .eq('type', 'expense');

          if (transactionsError) throw transactionsError;

          const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
          // Multiply budget by total months for fair comparison
          const totalBudget = budget.budget_limit * totalMonths;
          const variance = totalBudget - totalSpent;
          const variancePercentage = (variance / totalBudget) * 100;

          return {
            category_name: budget.categories.name,
            total_budget: totalBudget,
            total_spent: totalSpent,
            variance,
            variance_percentage: variancePercentage
          };
        })
      );

      setGlobalBudgetPerformance(performance);
    } catch (error) {
      console.error('Error fetching global budget performance:', error);
    }
  };

  const fetchCategoryEvolution = async () => {
    if (!user || !selectedCategory) return;

    try {
      const evolution: CategoryEvolution[] = [];

      for (const category of categories) {
        if (selectedCategory !== 'all' && category.id !== selectedCategory) continue;

        const months: string[] = [];
        const budgeted: number[] = [];
        const actual: number[] = [];

        const startDate = new Date(2025, 0, 1);
        const currentDate = new Date();
        const monthDiff = (currentDate.getFullYear() - startDate.getFullYear()) * 12 
          + currentDate.getMonth() - startDate.getMonth() + 1;

        for (let i = 0; i < monthDiff; i++) {
          const date = new Date(2025, i, 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          months.push(date.toLocaleString('default', { month: 'short', year: '2-digit' }));

          const { data: budget } = await supabase
            .from('budgets')
            .select('budget_limit')
            .eq('user_id', user.id)
            .eq('category_id', category.id)
            .eq('period', 'monthly')
            .maybeSingle();

          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('category_id', category.id)
            .eq('type', 'expense')
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);

          budgeted.push(budget?.budget_limit || 0);
          actual.push(transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0);
        }

        evolution.push({
          category_name: category.name,
          months,
          budgeted,
          actual
        });
      }

      setCategoryEvolution(evolution);
    } catch (error) {
      console.error('Error fetching category evolution:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        await Promise.all([
          fetchMonthlyOverview(),
          fetchExpenseDistribution(),
          fetchCategoryBreakdown(),
          fetchGlobalBudgetPerformance(),
          fetchCategoryEvolution()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedYear, selectedCategory, selectedMonth]);

  const monthlyOverviewChartData = {
    labels: monthlyTotals.map(m => new Date(m.month).toLocaleString('default', { month: 'short' })),
    datasets: [
      {
        label: 'Income',
        data: monthlyTotals.map(m => m.income),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Expenses',
        data: monthlyTotals.map(m => m.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      },
      {
        label: 'Savings',
        data: monthlyTotals.map(m => m.savings),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }
    ]
  };

  const expenseTypeChartData = {
    labels: ['Fixed', 'Variable', 'Controllable Fixed'],
    datasets: [{
      data: [
        expenseTypeDistribution.fixed,
        expenseTypeDistribution.variable,
        expenseTypeDistribution.controllable_fixed
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.5)',
        'rgba(245, 158, 11, 0.5)',
        'rgba(16, 185, 129, 0.5)'
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(245, 158, 11)',
        'rgb(16, 185, 129)'
      ],
      borderWidth: 1
    }]
  };

  const categoryBreakdownChartData = {
    labels: categorySpending.map(c => c.category_name),
    datasets: [{
      data: categorySpending.map(c => c.total_amount),
      backgroundColor: categorySpending.map(c => {
        switch (c.expense_type) {
          case 'fixed':
            return 'rgba(239, 68, 68, 0.5)';
          case 'variable':
            return 'rgba(245, 158, 11, 0.5)';
          case 'controllable_fixed':
            return 'rgba(16, 185, 129, 0.5)';
          default:
            return 'rgba(99, 102, 241, 0.5)';
        }
      }),
      borderColor: categorySpending.map(c => {
        switch (c.expense_type) {
          case 'fixed':
            return 'rgb(239, 68, 68)';
          case 'variable':
            return 'rgb(245, 158, 11)';
          case 'controllable_fixed':
            return 'rgb(16, 185, 129)';
          default:
            return 'rgb(99, 102, 241)';
        }
      }),
      borderWidth: 1
    }]
  };

  const globalBudgetChartData = {
    labels: globalBudgetPerformance.map(p => p.category_name),
    datasets: [
      {
        label: 'Total Budget',
        data: globalBudgetPerformance.map(p => p.total_budget),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      },
      {
        label: 'Total Spent',
        data: globalBudgetPerformance.map(p => p.total_spent),
        backgroundColor: globalBudgetPerformance.map(p => 
          p.total_spent <= p.total_budget
            ? 'rgba(34, 197, 94, 0.5)'
            : 'rgba(239, 68, 68, 0.5)'
        ),
        borderColor: globalBudgetPerformance.map(p => 
          p.total_spent <= p.total_budget
            ? 'rgb(34, 197, 94)'
            : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1
      }
    ]
  };

  const categoryEvolutionChartData = {
    labels: categoryEvolution[0]?.months || [],
    datasets: categoryEvolution.map(cat => [
      {
        label: `${cat.category_name} (Budget)`,
        data: cat.budgeted,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 2,
        fill: false
      },
      {
        label: `${cat.category_name} (Actual)`,
        data: cat.actual,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 2,
        fill: false
      }
    ]).flat()
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#1e293b'
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      x: {
        grid: {
          color: '#1e293b'
        },
        ticks: {
          color: '#94a3b8'
        }
      }
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
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Financial Reports
          </h1>
        </div>

        {/* Monthly Overview */}
        <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-dark-50">Monthly Overview</h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-dark-900 border border-dark-600 rounded-lg px-3 py-1.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="h-[400px]">
            <Bar data={monthlyOverviewChartData} options={chartOptions} />
          </div>
        </div>

        {/* Expense Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <h2 className="text-lg font-semibold text-dark-50 mb-6">Expense Type Distribution</h2>
            <div className="h-[300px] flex items-center justify-center">
              <Pie data={expenseTypeChartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-2">
                <Lock className="text-red-400" size={20} />
                <div>
                  <p className="text-sm font-medium text-dark-100">Fixed</p>
                  <p className="text-xs text-dark-400">${expenseTypeDistribution.fixed.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shuffle className="text-yellow-400" size={20} />
                <div>
                  <p className="text-sm font-medium text-dark-100">Variable</p>
                  <p className="text-xs text-dark-400">${expenseTypeDistribution.variable.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sliders className="text-emerald-400" size={20} />
                <div>
                  <p className="text-sm font-medium text-dark-100">Controllable</p>
                  <p className="text-xs text-dark-400">${expenseTypeDistribution.controllable_fixed.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <h2 className="text-lg font-semibold text-dark-50 mb-6">Category Breakdown</h2>
            <div className="h-[300px] flex items-center justify-center">
              <Pie data={categoryBreakdownChartData} options={chartOptions} />
            </div>
            <div className="mt-6 space-y-2">
              {categorySpending.slice(0, 5).map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-dark-200">{category.category_name}</span>
                  <span className="text-sm font-medium text-dark-100">
                    ${category.total_amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Budget Performance */}
        <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700 mb-8">
          <h2 className="text-xl font-semibold text-dark-50 mb-6">Global Budget Performance (All-Time)</h2>
          
          <div className="h-[400px] mb-8">
            <Bar data={globalBudgetChartData} options={chartOptions} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Total Budget
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                    Variance %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {globalBudgetPerformance.map((performance, index) => (
                  <tr key={index} className="hover:bg-dark-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                      {performance.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-dark-100">
                      ${performance.total_budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-dark-100">
                      ${performance.total_spent.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                      performance.variance >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${Math.abs(performance.variance).toLocaleString()}
                      {performance.variance >= 0 ? ' under' : ' over'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                      performance.variance >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {Math.abs(performance.variance_percentage).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Evolution */}
        <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-dark-50">Category Evolution Over Time</h2>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-dark-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-dark-900 border border-dark-600 rounded-lg px-3 py-1.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[400px]">
            <Line 
              data={categoryEvolutionChartData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw as number;
                        return `$${value.toLocaleString()}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>

          {categoryEvolution.map(cat => {
            const consistentOverspending = cat.actual.filter((amount, i) => amount > cat.budgeted[i]).length >= 3;
            const consistentUnderspending = cat.actual.filter((amount, i) => amount < cat.budgeted[i]).length >= 3;

            if (consistentOverspending || consistentUnderspending) {
              return (
                <div key={cat.category_name} className="mt-6 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle className={consistentOverspending ? 'text-red-400' : 'text-green-400'} size={20} />
                    <div>
                      <h3 className="font-medium text-dark-50">{cat.category_name}</h3>
                      <p className="text-sm text-dark-300">
                        {consistentOverspending
                          ? 'Consistent overspending detected. Consider adjusting your budget or reviewing expenses.'
                          : 'Consistent underspending detected. You might be able to reallocate some budget to other categories.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}