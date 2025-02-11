import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';

const APP_GOALS = [
  'Track daily expenses',
  'Create and stick to a budget',
  'Save money',
  'Understand spending habits',
  'Plan for future expenses',
  'Manage business finances',
  'Track multiple income sources',
  'Other'
];

type Step = 'personal' | 'additional';

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    location: '',
    app_goals: [] as string[]
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 'personal' && isStepValid()) {
      setCurrentStep('additional');
    }
  };

  const handleBack = () => {
    if (currentStep === 'additional') {
      setCurrentStep('personal');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          location: formData.location || null,
          app_goals: formData.app_goals
        }]);

      if (error) throw error;

      // Redirect to dashboard after successful profile creation
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      app_goals: prev.app_goals.includes(goal)
        ? prev.app_goals.filter(g => g !== goal)
        : [...prev.app_goals, goal]
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'personal':
        return formData.first_name.trim() && formData.last_name.trim();
      case 'additional':
        return true; // Always valid since additional info is optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <UserPlus className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Help us personalize your experience
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-8">
            <div className="relative">
              <div className="absolute top-2 flex w-full justify-between">
                {['personal', 'additional'].map((step, index) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      ['personal', 'additional'].indexOf(currentStep) >= index
                        ? 'bg-indigo-600'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute top-3 left-0 w-full">
                <div
                  className="h-1 bg-indigo-600 transition-all duration-300"
                  style={{
                    width: `${
                      ((['personal', 'additional'].indexOf(currentStep) + 1) / 2) * 100
                    }%`
                  }}
                />
              </div>
              <div className="h-1 w-full bg-gray-200" />
            </div>
          </div>

          {currentStep === 'personal' ? (
            <form onSubmit={handleNext} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isStepValid()}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Where are you located? (Optional)
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What do you want to achieve with this app? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {APP_GOALS.map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`p-2 text-sm rounded-lg border ${
                          formData.app_goals.includes(goal)
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'border-gray-300 text-gray-700 hover:border-indigo-500'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Get Started'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}