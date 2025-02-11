import React, { useState } from 'react';
import { MessageSquarePlus, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type FeedbackType = 'bug' | 'feature' | 'general';

export default function Feedback() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [satisfaction, setSatisfaction] = useState<'satisfied' | 'dissatisfied' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert([{
          user_id: user.id,
          type,
          message: message.trim(),
          satisfaction,
          url: window.location.pathname,
          user_agent: navigator.userAgent
        }]);

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        // Reset form after closing
        setTimeout(() => {
          setSubmitted(false);
          setMessage('');
          setType('general');
          setSatisfaction(null);
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        title="Send Feedback"
      >
        <MessageSquarePlus size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Send Feedback</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                  <ThumbsUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Thank You!</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Your feedback helps us improve the app.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('general')}
                      className={`px-4 py-2 text-sm rounded-md ${
                        type === 'general'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-gray-700 border border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('bug')}
                      className={`px-4 py-2 text-sm rounded-md ${
                        type === 'bug'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'text-gray-700 border border-gray-200 hover:border-red-200'
                      }`}
                    >
                      Bug
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('feature')}
                      className={`px-4 py-2 text-sm rounded-md ${
                        type === 'feature'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'text-gray-700 border border-gray-200 hover:border-green-200'
                      }`}
                    >
                      Feature
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How satisfied are you with this feature?
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setSatisfaction('satisfied')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                        satisfaction === 'satisfied'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'text-gray-700 border border-gray-200 hover:border-green-200'
                      }`}
                    >
                      <ThumbsUp size={16} />
                      Satisfied
                    </button>
                    <button
                      type="button"
                      onClick={() => setSatisfaction('dissatisfied')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                        satisfaction === 'dissatisfied'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'text-gray-700 border border-gray-200 hover:border-red-200'
                      }`}
                    >
                      <ThumbsDown size={16} />
                      Dissatisfied
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Tell us what you think..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}