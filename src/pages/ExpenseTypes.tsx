import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Lock, 
  Shuffle, 
  Sliders,
  ArrowLeft,
  LightbulbOff,
  ShoppingCart,
  Home,
  Smartphone,
  Car,
  Utensils,
  Dumbbell,
  Shield,
  Film,
  ShoppingBag
} from 'lucide-react';

export default function ExpenseTypes() {
  const expenseTypes = [
    {
      type: 'Fixed',
      icon: <Lock className="text-red-600" size={24} />,
      description: 'Expenses that occur regularly and are difficult to change',
      characteristics: [
        'Same amount each month',
        'Essential for daily life',
        'Usually bound by contracts',
        'Require significant life changes to modify'
      ],
      examples: [
        { name: 'Rent/Mortgage', icon: <Home size={16} /> },
        { name: 'Loan Payments', icon: <Lock size={16} /> },
        { name: 'Insurance', icon: <Shield size={16} /> }
      ],
      tips: [
        'Shop around before committing to contracts',
        'Consider downsizing if costs are too high',
        'Look for better rates when contracts expire',
        'Bundle services when possible for discounts'
      ]
    },
    {
      type: 'Variable',
      icon: <Shuffle className="text-yellow-600" size={24} />,
      description: 'Expenses that change month to month and can be controlled',
      characteristics: [
        'Amount varies each month',
        'Can be adjusted based on needs',
        'Often discretionary',
        'Easier to reduce quickly'
      ],
      examples: [
        { name: 'Groceries', icon: <ShoppingCart size={16} /> },
        { name: 'Entertainment', icon: <Film size={16} /> },
        { name: 'Dining Out', icon: <Utensils size={16} /> },
        { name: 'Shopping', icon: <ShoppingBag size={16} /> }
      ],
      tips: [
        'Create and stick to a budget',
        'Look for deals and discounts',
        'Plan meals to reduce food waste',
        'Find free entertainment options'
      ]
    },
    {
      type: 'Controllable Fixed',
      icon: <Sliders className="text-green-600" size={24} />,
      description: 'Regular expenses that can be optimized through conscious choices',
      characteristics: [
        'Regular monthly occurrence',
        'Amount can be influenced',
        'Requires lifestyle adjustments',
        'Savings compound over time'
      ],
      examples: [
        { name: 'Utilities', icon: <LightbulbOff size={16} /> },
        { name: 'Phone Plan', icon: <Smartphone size={16} /> },
        { name: 'Transportation', icon: <Car size={16} /> },
        { name: 'Gym Membership', icon: <Dumbbell size={16} /> }
      ],
      tips: [
        'Monitor usage patterns',
        'Invest in energy-efficient solutions',
        'Compare service providers regularly',
        'Look for ways to reduce consumption'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Understanding Expense Types</h1>
          <p className="text-lg text-gray-600">
            Learn how to categorize and manage different types of expenses to better control your finances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {expenseTypes.map((type) => (
            <div key={type.type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {type.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{type.type}</h2>
              </div>
              
              <p className="text-gray-600 mb-6">{type.description}</p>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Characteristics</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {type.characteristics.map((char, index) => (
                      <li key={index}>{char}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Common Examples</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {type.examples.map((example, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600"
                      >
                        {example.icon}
                        {example.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Management Tips</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {type.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-indigo-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tips for Expense Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Track Everything</h3>
              <p className="text-gray-600">
                Regularly monitor all expenses to understand your spending patterns and identify areas for improvement.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Set Clear Goals</h3>
              <p className="text-gray-600">
                Define specific savings targets and create budgets for each expense category.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Review Regularly</h3>
              <p className="text-gray-600">
                Monthly reviews of your expenses can help identify unnecessary costs and opportunities for savings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}