import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderPlus, 
  Calculator,
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Step = 'category' | 'budget' | 'complete';

type OnboardingData = {
  category?: {
    name: string;
    type: 'income' | 'expense';
    expense_type?: 'fixed' | 'variable' | 'controllable_fixed';
  };
  budget?: {
    limit: string;
    period: 'monthly' | 'weekly' | 'yearly';
  };
};

export default function OnboardingSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<OnboardingData>({
    budget: { limit: '', period: 'monthly' }
  });
  const [createdCategoryId, setCreatedCategoryId] = useState<string>('');

  const handleCreateCategory = async () => {
    if (!user || !data.category) return;
    setLoading(true);
    setError('');

    try {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: data.category.name,
          expense_type: data.category.type === 'expense' ? data.category.expense_type : null,
          income_category: data.category.type === 'income'
        }])
        .select()
        .single();

      if (categoryError) throw categoryError;
      setCreatedCategoryId(category.id);
      setCurrentStep('budget');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    if (!user || !createdCategoryId) return;
    setLoading(true);
    setError('');

    try {
      // Only create budget if amount is provided
      if (data.budget?.limit) {
        const { error: budgetError } = await supabase
          .from('budgets')
          .insert([{
            user_id: user.id,
            category_id: createdCategoryId,
            budget_limit: Number(data.budget.limit),
            period: data.budget.period || 'monthly',
            spent: 0
          }]);

        if (budgetError) throw budgetError;
      }
      
      setCurrentStep('complete');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipBudget = () => {
    setCurrentStep('complete');
  };

  const handleFinish = (destination: 'dashboard' | 'categories' | 'budgets') => {
    navigate(`/${destination}`);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute top-2 flex w-full justify-between">
              {['category', 'budget', 'complete'].map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    ['category', 'budget', 'complete'].indexOf(currentStep) >= index
                      ? 'bg-indigo-600'
                      : 'bg-dark-700'
                  }`}
                />
              ))}
            </div>
            <div className="absolute top-3 left-0 w-full">
              <div
                className="h-1 bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${
                    ((['category', 'budget', 'complete'].indexOf(currentStep) + 1) / 3) * 100
                  }%`
                }}
              />
            </div>
            <div className="h-1 w-full bg-dark-700" />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-dark-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {currentStep === 'category' && (
            <div className="space-y-6">
              <div className="text-center">
                <FolderPlus className="mx-auto h-12 w-12 text-indigo-400" />
                <h2 className="mt-2 text-2xl font-bold text-dark-50">Create Your First Category</h2>
                <p className="mt-1 text-sm text-dark-300">
                  Categories help you organize your finances. Let's create your first one.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Category Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setData({
                        ...data,
                        category: { ...data.category, type: 'income', name: data.category?.name || '' }
                      })}
                      className={`p-3 text-sm rounded-lg border ${
                        data.category?.type === 'income'
                          ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                          : 'border-dark-600 text-dark-300 hover:border-emerald-500/50'
                      }`}
                    >
                      Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setData({
                        ...data,
                        category: { ...data.category, type: 'expense', name: data.category?.name || '' }
                      })}
                      className={`p-3 text-sm rounded-lg border ${
                        data.category?.type === 'expense'
                          ? 'bg-red-900/30 border-red-500 text-red-400'
                          : 'border-dark-600 text-dark-300 hover:border-red-500/50'
                      }`}
                    >
                      Expense
                    </button>
                  </div>
                </div>

                {data.category?.type === 'expense' && (
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Expense Type
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => setData({
                          ...data,
                          category: { ...data.category, expense_type: 'fixed' }
                        })}
                        className={`p-3 text-sm rounded-lg border ${
                          data.category?.expense_type === 'fixed'
                            ? 'bg-dark-700 border-indigo-500 text-indigo-400'
                            : 'border-dark-600 text-dark-300 hover:border-indigo-500/50'
                        }`}
                      >
                        Fixed (e.g., Rent, Insurance)
                      </button>
                      <button
                        type="button"
                        onClick={() => setData({
                          ...data,
                          category: { ...data.category, expense_type: 'variable' }
                        })}
                        className={`p-3 text-sm rounded-lg border ${
                          data.category?.expense_type === 'variable'
                            ? 'bg-dark-700 border-indigo-500 text-indigo-400'
                            : 'border-dark-600 text-dark-300 hover:border-indigo-500/50'
                        }`}
                      >
                        Variable (e.g., Groceries, Entertainment)
                      </button>
                      <button
                        type="button"
                        onClick={() => setData({
                          ...data,
                          category: { ...data.category, expense_type: 'controllable_fixed' }
                        })}
                        className={`p-3 text-sm rounded-lg border ${
                          data.category?.expense_type === 'controllable_fixed'
                            ? 'bg-dark-700 border-indigo-500 text-indigo-400'
                            : 'border-dark-600 text-dark-300 hover:border-indigo-500/50'
                        }`}
                      >
                        Controllable Fixed (e.g., Utilities, Phone)
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={data.category?.name || ''}
                    onChange={(e) => setData({
                      ...data,
                      category: { ...data.category, name: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                    placeholder="Enter category name"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreateCategory}
                  disabled={loading || !data.category?.name || !data.category?.type || (data.category.type === 'expense' && !data.category.expense_type)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'budget' && (
            <div className="space-y-6">
              <div className="text-center">
                <Calculator className="mx-auto h-12 w-12 text-indigo-400" />
                <h2 className="mt-2 text-2xl font-bold text-dark-50">Set a Budget (Optional)</h2>
                <p className="mt-1 text-sm text-dark-300">
                  Define a budget for your {data.category?.name} category. You can skip this step if you want to set it up later.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Budget Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.budget?.limit || ''}
                    onChange={(e) => setData({
                      ...data,
                      budget: { ...data.budget, limit: e.target.value, period: data.budget?.period || 'monthly' }
                    })}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Budget Period
                  </label>
                  <select
                    value={data.budget?.period || 'monthly'}
                    onChange={(e) => setData({
                      ...data,
                      budget: { ...data.budget, period: e.target.value as 'monthly' | 'weekly' | 'yearly' }
                    })}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('category')}
                  className="flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-dark-100"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipBudget}
                    className="px-4 py-2 text-dark-300 hover:text-dark-100"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleCreateBudget}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h2 className="mt-2 text-2xl font-bold text-dark-50">You're All Set!</h2>
                <p className="mt-1 text-sm text-dark-300">
                  You've successfully set up your first financial category. What would you like to do next?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleFinish('dashboard')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Go to Dashboard
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => handleFinish('categories')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 text-dark-100 rounded-lg hover:bg-dark-600"
                >
                  Create Another Category
                  <FolderPlus size={16} />
                </button>
                <button
                  onClick={() => handleFinish('budgets')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 text-dark-100 rounded-lg hover:bg-dark-600"
                >
                  Manage Budgets
                  <Calculator size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}