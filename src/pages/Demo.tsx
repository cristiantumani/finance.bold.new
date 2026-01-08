import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../contexts/DemoContext';
import { Info, ArrowRight, Lock, TrendingUp, PieChart, Calendar, DollarSign } from 'lucide-react';

export default function Demo() {
  const { enterDemoMode } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    // Enter demo mode when component mounts
    enterDemoMode();
  }, [enterDemoMode]);

  const handleEnterDemo = () => {
    navigate('/transactions');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-500/20 p-4 rounded-full">
              <Info size={48} className="text-indigo-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-dark-50 mb-4 text-center">
            Welcome to Demo Mode
          </h1>

          {/* Description */}
          <p className="text-dark-300 mb-6 text-center">
            You're about to explore a fully-featured finance dashboard with 12 months of sample data.
            All data is read-only and resets periodically.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-700 rounded-lg p-4 flex items-start gap-3">
              <TrendingUp size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-dark-200 mb-1">Transaction History</h3>
                <p className="text-xs text-dark-400">12 months of realistic spending data</p>
              </div>
            </div>

            <div className="bg-dark-700 rounded-lg p-4 flex items-start gap-3">
              <PieChart size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-dark-200 mb-1">Budget Tracking</h3>
                <p className="text-xs text-dark-400">Pre-configured budgets & insights</p>
              </div>
            </div>

            <div className="bg-dark-700 rounded-lg p-4 flex items-start gap-3">
              <Calendar size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-dark-200 mb-1">Analytics</h3>
                <p className="text-xs text-dark-400">Spending trends and patterns</p>
              </div>
            </div>

            <div className="bg-dark-700 rounded-lg p-4 flex items-start gap-3">
              <DollarSign size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-dark-200 mb-1">Smart Suggestions</h3>
                <p className="text-xs text-dark-400">Budget recommendations</p>
              </div>
            </div>
          </div>

          {/* Demo Info Box */}
          <div className="bg-dark-900 rounded-lg p-4 mb-6 border border-dark-600">
            <div className="flex items-start gap-2">
              <Lock size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-dark-300">
                <span className="font-semibold text-dark-200">Read-Only Mode:</span>
                {' '}All forms and buttons are disabled in demo mode. Sign up to manage your own finances!
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleEnterDemo}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Explore Demo</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
