import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import MonthlyOverview from '../components/MonthlyOverview';
import CategoryBreakdown from '../components/CategoryBreakdown';
import SpendingPace from '../components/SpendingPace';
import BudgetPerformance from '../components/BudgetPerformance';

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-dark-50 mb-2">
                Financial Reports
              </h1>
              <p className="text-dark-400">
                Visualize your financial data and track your progress
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="text-dark-400" size={20} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reports Sections */}
        <div className="space-y-8">
          {/* Annual Overview */}
          <section>
            <h2 className="text-xl font-semibold text-dark-50 mb-4">Annual Overview</h2>
            <MonthlyOverview year={selectedYear} />
          </section>

          {/* Category Breakdown */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-dark-50">Category Breakdown</h2>
              <div className="flex items-center gap-2">
                <Calendar className="text-dark-400" size={20} />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <CategoryBreakdown year={selectedYear} month={selectedMonth} />
          </section>

          {/* Spending Pace */}
          <section>
            <SpendingPace year={selectedYear} month={selectedMonth} />
          </section>

          {/* Budget Performance */}
          <section>
            <BudgetPerformance year={selectedYear} month={selectedMonth} />
          </section>
        </div>
      </div>
    </div>
  );
}
