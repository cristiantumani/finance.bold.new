import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  PieChart, 
  BarChart, 
  Wallet,
  Shield,
  MessageCircle,
  CheckCircle,
  TrendingUp,
  Clock,
  Tags
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 to-dark-900">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-indigo-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Opsia
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/docs" className="text-dark-200 hover:text-dark-50 transition-colors">
              Documentation
            </Link>
            <Link to="/login" className="text-dark-200 hover:text-dark-50 transition-colors">
              Login
            </Link>
            <Link 
              to="/signup"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Take Control of Your Finances Today
            </h1>
            <p className="text-xl text-dark-300 mb-8">
              Track expenses, set budgets, and achieve your financial goals with our intuitive budgeting app.
            </p>
            <div className="flex gap-4">
              <Link 
                to="/signup"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Start Tracking Now
                <ArrowRight size={20} />
              </Link>
              <Link 
                to="/docs"
                className="bg-dark-800 text-dark-100 px-6 py-3 rounded-xl hover:bg-dark-700 transition-colors border border-dark-700"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-3xl blur-3xl" />
            <img 
              src="https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&q=80"
              alt="App Dashboard"
              className="relative rounded-3xl shadow-2xl border border-dark-800"
            />
          </div>
        </div>
      </section>

      {/* Why Budgeting Matters */}
      <section className="bg-dark-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              Why Budgeting Matters
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Did you know? People who track their expenses save 20% more each year. Take control of your financial future with smart budgeting.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="bg-indigo-500/10 p-3 rounded-xl w-fit mb-4">
                <TrendingUp className="text-indigo-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-2">
                Financial Growth
              </h3>
              <p className="text-dark-300">
                Track your progress and watch your savings grow with detailed insights and analytics.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="bg-purple-500/10 p-3 rounded-xl w-fit mb-4">
                <Clock className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-2">
                Time Saving
              </h3>
              <p className="text-dark-300">
                Automate your expense tracking and spend less time managing your finances.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="bg-emerald-500/10 p-3 rounded-xl w-fit mb-4">
                <Shield className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-2">
                Financial Security
              </h3>
              <p className="text-dark-300">
                Build an emergency fund and secure your financial future with smart planning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              Powerful Features
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Everything you need to manage your finances effectively in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="bg-indigo-500/10 p-3 rounded-xl w-fit mb-4">
                <Wallet className="text-indigo-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-2">
                Budget Tracking
              </h3>
              <p className="text-dark-300">
                Set and monitor budgets for different categories. Get alerts when you're close to limits.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="bg-purple-500/10 p-3 rounded-xl w-fit mb-4">
                <BarChart className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-2">
                Advanced Reports
              </h3>
              <p className="text-dark-300">
                Visualize your spending patterns with detailed charts and insights.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="bg-emerald-500/10 p-3 rounded-xl w-fit mb-4">
                <Tags className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-2">
                Smart Categorization
              </h3>
              <p className="text-dark-300">
                Automatically categorize transactions and track spending patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-dark-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              How It Works
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Get started in minutes with our simple setup process.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
                <div className="bg-indigo-500/10 p-3 rounded-xl w-fit mb-4">
                  <span className="text-2xl font-bold text-indigo-400">1</span>
                </div>
                <h3 className="text-xl font-semibold text-dark-50 mb-2">
                  Create Account
                </h3>
                <p className="text-dark-300">
                  Sign up for free and set up your profile in seconds.
                </p>
              </div>
              <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-dark-700">
                <ArrowRight size={24} />
              </div>
            </div>
            <div className="relative">
              <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
                <div className="bg-purple-500/10 p-3 rounded-xl w-fit mb-4">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <h3 className="text-xl font-semibold text-dark-50 mb-2">
                  Set Budgets
                </h3>
                <p className="text-dark-300">
                  Define your spending limits and financial goals.
                </p>
              </div>
              <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-dark-700">
                <ArrowRight size={24} />
              </div>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="bg-emerald-500/10 p-3 rounded-xl w-fit mb-4">
                <span className="text-2xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-2">
                Track Progress
              </h3>
              <p className="text-dark-300">
                Monitor your spending and watch your savings grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              Beta Program
            </h2>
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 max-w-2xl mx-auto">
              <p className="text-lg text-indigo-400 font-semibold mb-2">
                🎉 Limited Time Beta Offer
              </p>
              <p className="text-dark-300">
                We're offering <span className="text-indigo-400 font-semibold">lifetime free access</span> to our Pro plan for the first 25 users who sign up during our beta period. Don't miss out on this exclusive opportunity!
              </p>
              <div className="mt-4 flex justify-center">
                <div className="bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
                  <span className="text-dark-300">Spots remaining: </span>
                  <span className="text-indigo-400 font-bold">21</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-dark-50 mb-2">Regular Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-dark-50">$9</span>
                  <span className="text-dark-400">/month</span>
                </div>
                <p className="text-dark-400 mt-2">After beta period ends</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400" />
                  Unlimited expense tracking
                </li>
                <li className="flex items-center gap-2 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400" />
                  Unlimited budgets
                </li>
                <li className="flex items-center gap-2 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400" />
                  Collaboration features
                </li>
                <li className="flex items-center gap-2 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400" />
                  Priority support
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-b from-indigo-500 to-purple-500 p-6 rounded-2xl relative">
              <div className="absolute top-0 right-0 bg-indigo-400 text-white px-3 py-1 rounded-bl-lg rounded-tr-xl text-sm font-medium">
                Beta Offer
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">Beta Access</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">Free</span>
                  <span className="text-white/80">forever</span>
                </div>
                <p className="text-white/90 mt-2">First 25 users only</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle size={20} />
                  Everything in Regular Plan
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle size={20} />
                  Lifetime free access
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle size={20} />
                  Early access to new features
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle size={20} />
                  Direct access to founders
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle size={20} />
                  Shape the product's future
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Join Beta Program
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-dark-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Got questions? We've got answers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                Is my data secure?
              </h3>
              <p className="text-dark-300">
                Yes, we use bank-level encryption to protect your data. Your security is our top priority.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                Can I export my data?
              </h3>
              <p className="text-dark-300">
                Yes, you can export your data anytime in various formats including CSV and PDF.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-dark-300">
                Yes, we offer a 30-day money-back guarantee for all paid plans.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                How do I get started?
              </h3>
              <p className="text-dark-300">
                Simply sign up for a free account and follow our quick setup guide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Take Control of Your Finances?
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-8">
              Join thousands of users who are already managing their money smarter.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
            >
              Get Started Now
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-900/50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-8 w-8 text-indigo-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Opsia
                </span>
              </div>
              <p className="text-dark-400">
                Smart budgeting for a better financial future.
              </p>
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/features" className="text-dark-400 hover:text-dark-200">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-dark-400 hover:text-dark-200">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className="text-dark-400 hover:text-dark-200">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-dark-400 hover:text-dark-200">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-dark-400 hover:text-dark-200">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-dark-400 hover:text-dark-200">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-dark-400 hover:text-dark-200">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-dark-400 hover:text-dark-200">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="text-dark-400 hover:text-dark-200">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-800 mt-12 pt-8 text-center">
            <p className="text-dark-400">
              © {new Date().getFullYear()} Opsia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}