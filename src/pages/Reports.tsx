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
  Percent
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
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

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [expenseTypeDistribution, setExpenseTypeDistribution] = useState<{
    fixed: number;
    variable: number;
    controllable_fixed: number;
  }>({ fixed: 0, variable: 0, controllable_fixed: 0 });

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch category spending
        const { data: categoryData, error: categoryError } = await supabase
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
          .gte('date', `${selectedYear}-01-01`)
          .lte('date', `${selectedYear}-12-31`);

        if (categoryError) throw categoryError;

        // Process category spending
        const categoryTotals = categoryData.reduce((acc: { [key: string]: CategorySpending }, transaction) => {
          const categoryName = transaction.categories?.name || 'Uncategorized';
          if (!acc[categoryName]) {
            acc[categoryName] = {
              category_name: categoryName,
              total_amount: 0,
              expense_type: transaction.categories?.expense_type || null
            };
          }
          acc[categoryName].total_amount += Number(transaction.amount);
          return acc;
        }, {});

        // Sort categories by total amount spent (descending)
        const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.total_amount - a.total_amount);
        setCategorySpending(sortedCategories);

        // Calculate expense type distribution
        const distribution = categoryData.reduce(
          (acc: { [key: string]: number }, transaction) => {
            const expenseType = transaction.categories?.expense_type;
            if (expenseType) {
              acc[expenseType] = (acc[expenseType] || 0) + Number(transaction.amount);
            }
            return acc;
          },
          { fixed: 0, variable: 0, controllable_fixed: 0 }
        );

        setExpenseTypeDistribution(distribution);

        // Fetch monthly totals
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('transactions')
          .select('amount, type, date')
          .eq('user_id', user.id)
          .gte('date', `${selectedYear}-01-01`)
          .lte('date', `${selectedYear}-12-31`);

        if (monthlyError) throw monthlyError;

        // Process monthly totals
        const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
          const month = new Date(selectedYear, i).toLocaleString('default', { month: 'long' });
          return {
            month,
            income: 0,
            expenses: 0,
            savings: 0
          };
        });

        monthlyData.forEach(transaction => {
          const monthIndex = new Date(transaction.date).getMonth();
          const amount = Number(transaction.amount);
          
          if (transaction.type === 'income') {
            monthlyTotals[monthIndex].income += amount;
          } else {
            monthlyTotals[monthIndex].expenses += amount;
          }
          
          monthlyTotals[monthIndex].savings = 
            monthlyTotals[monthIndex].income - monthlyTotals[monthIndex].expenses;
        });

        setMonthlyTotals(monthlyTotals);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedYear]);

  const monthlyChartData = {
    labels: monthlyTotals.map(m => m.month),
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
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
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

  const categoryChartData = {
    labels: categorySpending.map(c => c.category_name),
    datasets: [{
      data: categorySpending.map(c => c.total_amount),
      backgroundColor: categorySpending.map(() => `hsla(${Math.random() * 360}, 70%, 50%, 0.5)`),
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8' // text-dark-400
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#1e293b' // dark-800
        },
        ticks: {
          color: '#94a3b8' // text-dark-400
        }
      },
      x: {
        grid: {
          color: '#1e293b' // dark-800
        },
        ticks: {
          color: '#94a3b8' // text-dark-400
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

  const totalIncome = monthlyTotals.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyTotals.reduce((sum, m) => sum + m.expenses, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Financial Reports
            </h1>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-dark-800 border border-dark-700 text-dark-100 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl shadow-md">
                <CircleDollarSign className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-300">Total Income</p>
                <p className="text-2xl font-bold text-dark-50">
                  ${totalIncome.toLocaleString()}
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
                <p className="text-sm font-medium text-dark-300">Total Expenses</p>
                <p className="text-2xl font-bold text-dark-50">
                  ${totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-xl shadow-md">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-300">Total Savings</p>
                <p className="text-2xl font-bold text-dark-50">
                  ${totalSavings.toLocaleString()}
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
                  {savingsRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <h2 className="text-lg font-semibold text-dark-50 mb-6">Monthly Overview</h2>
            <div className="h-[400px]">
              <Bar
                data={monthlyChartData}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
            <h2 className="text-lg font-semibold text-dark-50 mb-6">Expense Type Distribution</h2>
            <div className="h-[400px] flex items-center justify-center">
              <Pie
                data={expenseTypeChartData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: (context: any) => {
                          const value = context.raw;
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `$${value.toLocaleString()} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-dark-700">
          <h2 className="text-lg font-semibold text-dark-50 mb-6">Category Breakdown</h2>
          <div className="h-[400px]">
            <Bar
              data={categoryChartData}
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false
                  },
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
        </div>
      </div>
    </div>
  );
}