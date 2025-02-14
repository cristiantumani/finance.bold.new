import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BlogPost: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Why You Need a Personal Finance Tracker
          </h1>

          <div className="prose prose-indigo max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Managing money wisely is key to financial freedom. Without tracking your expenses 
              and income, it's easy to lose control of your finances.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
              1. Gain Full Control of Your Money
            </h2>
            <p className="text-gray-600 mb-8">
              With a finance tracker, you know exactly where your money goes. It helps you cut 
              unnecessary expenses and focus on financial goals. By maintaining a clear picture 
              of your spending habits, you can make informed decisions about your financial future.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
              2. Budget Smarter
            </h2>
            <p className="text-gray-600 mb-8">
              Setting and tracking budgets prevents overspending and ensures you always have 
              enough for essentials and savings. A good budget is like a roadmap for your money, 
              helping you reach your financial destinations with confidence.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">
              3. Reduce Financial Stress
            </h2>
            <p className="text-gray-600 mb-8">
              By having a clear overview of your finances, you can make informed decisions, 
              avoid debt, and plan better for the future. Financial peace of mind comes from 
              knowing exactly where you stand and where you're headed.
            </p>

            <div className="mt-12 text-center">
              <Link
                to="/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Tracking Your Finances Today
              </Link>
            </div>
          </div>
        </article>

        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Ready to Take Control of Your Finances?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of users who have already transformed their financial lives with Opsia.
          </p>
          <div className="flex gap-4">
            <Link
              to="/signup"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign Up Now
            </Link>
            <Link
              to="/docs"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;