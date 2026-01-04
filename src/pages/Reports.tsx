import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import MonthlyOverview from '../components/MonthlyOverview';

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

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

        {/* Monthly Overview */}
        <div className="space-y-6">
          <MonthlyOverview year={selectedYear} />

          {/* Placeholder for future dashboards */}
          <div className="bg-dark-800 rounded-xl shadow-sm border border-dark-700 p-8 text-center">
            <p className="text-dark-400 text-sm">
              More insights and dashboards coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
