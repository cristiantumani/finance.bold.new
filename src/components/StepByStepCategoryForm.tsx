import React, { useState } from 'react';
import { X, DollarSign, Tag, Lock, Shuffle, Sliders, ArrowRight, ArrowLeft } from 'lucide-react';
import type { ExpenseType } from '../types/finance';

type Step = 'type' | 'name' | 'expense-type' | 'budget';

type CategoryFormData = {
  name: string;
  expense_type: ExpenseType | null;
  income_category: boolean;
  budget?: {
    limit: string;
    period: 'monthly' | 'weekly' | 'yearly';
  };
};

type Category = {
  id: string;
  name: string;
  expense_type: string;
  income_category: boolean;
};

type StepByStepCategoryFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  editingCategory?: Category | null;
};

const expenseTypeInfo = {
  fixed: {
    title: 'Fixed',
    description: 'Regular expenses that stay relatively constant',
    icon: <Lock size={20} className="text-red-400" />,
    examples: ['Rent', 'Insurance']
  },
  variable: {
    title: 'Variable',
    description: 'Expenses that change month to month',
    icon: <Shuffle size={20} className="text-yellow-400" />,
    examples: ['Groceries', 'Entertainment']
  },
  controllable_fixed: {
    title: 'Controllable Fixed',
    description: 'Regular expenses you can influence',
    icon: <Sliders size={20} className="text-emerald-400" />,
    examples: ['Utilities', 'Phone Plan']
  }
};

export default function StepByStepCategoryForm({ isOpen, onClose, onSubmit, editingCategory }: StepByStepCategoryFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    expense_type: null,
    income_category: false,
    budget: undefined
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        expense_type: editingCategory.expense_type as ExpenseType,
        income_category: editingCategory.income_category,
        budget: undefined
      });
      setCurrentStep('name');
    } else {
      setFormData({
        name: '',
        expense_type: null,
        income_category: false,
        budget: undefined
      });
      setCurrentStep('type');
    }
  }, [isOpen, editingCategory]);

  const handleNext = () => {
    if (editingCategory) {
      handleSubmit();
      return;
    }
    switch (currentStep) {
      case 'type':
        setCurrentStep('name');
        break;
      case 'name':
        if (formData.income_category) {
          setCurrentStep('budget');
        } else {
          setCurrentStep('expense-type');
        }
        break;
      case 'expense-type':
        setCurrentStep('budget');
        break;
    }
  };

  const handleBack = () => {
    if (editingCategory) {
      onClose();
      return;
    }
    switch (currentStep) {
      case 'name':
        setCurrentStep('type');
        break;
      case 'expense-type':
        setCurrentStep('name');
        break;
      case 'budget':
        setCurrentStep(formData.income_category ? 'name' : 'expense-type');
        break;
    }
  };

  const handleSkip = () => {
    switch (currentStep) {
      case 'expense-type':
        setCurrentStep('budget');
        break;
      case 'budget':
        handleSubmit();
        break;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        expense_type: formData.expense_type || 'variable' // Default to variable if not set
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'type':
        return true;
      case 'name':
        return formData.name.trim().length > 0;
      case 'expense-type':
        return true; // Always valid since it's optional
      case 'budget':
        return true; // Always valid since it's optional
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-50">
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!editingCategory && (
          <div className="relative mb-8">
            <div className="absolute top-2 flex w-full justify-between">
              <div className={`w-3 h-3 rounded-full ${
                ['type', 'name', 'expense-type', 'budget'].indexOf(currentStep) >= 0
                  ? 'bg-indigo-600'
                  : 'bg-dark-700'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                ['name', 'expense-type', 'budget'].indexOf(currentStep) >= 0
                  ? 'bg-indigo-600'
                  : 'bg-dark-700'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                ['expense-type', 'budget'].indexOf(currentStep) >= 0
                  ? 'bg-indigo-600'
                  : 'bg-dark-700'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                ['budget'].indexOf(currentStep) >= 0
                  ? 'bg-indigo-600'
                  : 'bg-dark-700'
              }`} />
            </div>
            <div className="absolute top-3 left-0 w-full">
              <div
                className="h-1 bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${
                    ((['type', 'name', 'expense-type', 'budget'].indexOf(currentStep) + 1) / 4) * 100
                  }%`
                }}
              />
            </div>
            <div className="h-1 w-full bg-dark-700" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!editingCategory && currentStep === 'type' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50">What type of category is this?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, income_category: false }));
                    handleNext();
                  }}
                  className={`p-4 rounded-xl border ${
                    !formData.income_category
                      ? 'bg-dark-700 border-indigo-500'
                      : 'border-dark-600 hover:border-dark-500'
                  } transition-colors`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Tag className="w-8 h-8 text-red-400" />
                    <span className="font-medium text-dark-100">Expense</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, income_category: true }));
                    handleNext();
                  }}
                  className={`p-4 rounded-xl border ${
                    formData.income_category
                      ? 'bg-dark-700 border-indigo-500'
                      : 'border-dark-600 hover:border-dark-500'
                  } transition-colors`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                    <span className="font-medium text-dark-100">Income</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'name' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50">
                What would you like to name this category?
              </h3>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={formData.income_category ? "e.g., Salary, Freelance" : "e.g., Rent, Groceries"}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                autoFocus
              />
            </div>
          )}

          {!editingCategory && currentStep === 'expense-type' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-dark-50">
                  What type of expense is this? (Optional)
                </h3>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-dark-400 hover:text-dark-200 text-sm"
                >
                  Skip
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(expenseTypeInfo).map(([type, info]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, expense_type: type as ExpenseType }));
                      handleNext();
                    }}
                    className={`w-full p-4 rounded-xl border ${
                      formData.expense_type === type
                        ? 'bg-dark-700 border-indigo-500'
                        : 'border-dark-600 hover:border-dark-500'
                    } transition-colors text-left`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-dark-800 rounded-lg">
                        {info.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-dark-100">{info.title}</h4>
                        <p className="text-sm text-dark-400 mb-2">{info.description}</p>
                        <p className="text-xs text-dark-300">
                          Examples: {info.examples.join(', ')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!editingCategory && currentStep === 'budget' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-dark-50 mb-2">
                    Would you like to set a budget? (Optional)
                  </h3>
                  <p className="text-sm text-dark-300">
                    You can always set or update this later
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-dark-400 hover:text-dark-200 text-sm"
                >
                  Skip
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Budget Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget?.limit || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      budget: {
                        ...prev.budget,
                        limit: e.target.value,
                        period: prev.budget?.period || 'monthly'
                      }
                    }))}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                    placeholder="0.00"
                  />
                </div>

                {formData.budget?.limit && (
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Budget Period
                    </label>
                    <select
                      value={formData.budget?.period || 'monthly'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        budget: {
                          ...prev.budget!,
                          period: e.target.value as 'monthly' | 'weekly' | 'yearly'
                        }
                      }))}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-dark-100"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {editingCategory ? (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 text-dark-200 hover:text-dark-100 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                {currentStep !== 'type' ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 text-dark-200 hover:text-dark-100 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep === 'budget' ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Category'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}