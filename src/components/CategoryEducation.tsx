import React from 'react';
import { Lock, Sliders, Shuffle, HelpCircle } from 'lucide-react';

type ExpenseTypeInfo = {
  title: string;
  description: string;
  examples: string[];
  icon: React.ReactNode;
  color: string;
};

const expenseTypes: Record<string, ExpenseTypeInfo> = {
  fixed: {
    title: 'Fixed',
    description: 'Regular expenses that stay relatively constant and are typically essential.',
    examples: ['Rent/Mortgage', 'Insurance', 'Loan Payments'],
    icon: <Lock size={20} />,
    color: 'text-red-400'
  },
  controllable_fixed: {
    title: 'Controllable Fixed',
    description: 'Regular expenses that you can influence through your behavior.',
    examples: ['Utilities', 'Phone Plan', 'Internet'],
    icon: <Sliders size={20} />,
    color: 'text-emerald-400'
  },
  variable: {
    title: 'Variable',
    description: 'Flexible expenses that can change significantly month to month.',
    examples: ['Groceries', 'Entertainment', 'Shopping'],
    icon: <Shuffle size={20} />,
    color: 'text-yellow-400'
  }
};

export default function CategoryEducation() {
  return (
    <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl border border-dark-700 mb-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-xl">
          <HelpCircle className="text-indigo-400" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-dark-50 mb-2">
            Understanding Categories
          </h2>
          <p className="text-dark-300">
            Organizing your finances into categories helps you gain clarity and control over your spending.
            This is the foundation for accurate tracking, smarter budgeting, and meaningful insights.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(expenseTypes).map(([key, info]) => (
          <div 
            key={key}
            className="bg-dark-900/50 rounded-xl p-4 border border-dark-700"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 bg-dark-800 rounded-lg ${info.color}`}>
                {info.icon}
              </div>
              <h3 className="font-medium text-dark-100">
                {info.title} Expenses
              </h3>
            </div>
            <p className="text-sm text-dark-300 mb-4">
              {info.description}
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-dark-200 uppercase">
                Examples
              </p>
              <ul className="text-sm space-y-1">
                {info.examples.map((example, index) => (
                  <li 
                    key={index}
                    className="text-dark-300"
                  >
                    • {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}