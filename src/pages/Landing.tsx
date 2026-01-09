import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  PieChart,
  BarChart3,
  Wallet,
  Shield,
  MessageCircle,
  CheckCircle,
  TrendingUp,
  Upload,
  Sparkles,
  Brain,
  Calendar,
  FileSpreadsheet,
  Eye,
  Zap,
  Target,
  DollarSign
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
            <Link to="/demo" className="text-dark-200 hover:text-indigo-400 transition-colors font-medium">
              Try Demo
            </Link>
            <Link to="/login" className="text-dark-200 hover:text-dark-50 transition-colors">
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="text-indigo-400" size={16} />
            <span className="text-indigo-400 text-sm font-medium">Track expenses via WhatsApp • Upload Excel • AI-Powered Insights</span>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 leading-tight">
            Master Your Money,<br />Effortlessly
          </h1>
          <p className="text-xl text-dark-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            The smartest way to track expenses, set budgets, and achieve your financial goals.
            Upload via WhatsApp, Excel, or manual entry. Get AI-powered insights instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/demo"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 text-lg font-medium"
            >
              <Eye size={20} />
              Try Live Demo
            </Link>
            <Link
              to="/signup"
              className="bg-dark-800 text-dark-100 px-8 py-4 rounded-xl hover:bg-dark-700 transition-colors border border-dark-700 flex items-center gap-2 text-lg font-medium"
            >
              Start Free
              <ArrowRight size={20} />
            </Link>
          </div>
          <p className="text-dark-400 text-sm mt-4">
            No credit card required • Free forever for beta users
          </p>
        </div>

        {/* Hero Visual - Dashboard Preview */}
        <div className="relative mt-16">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-3xl blur-3xl" />
          <div className="relative bg-dark-800 rounded-2xl border border-dark-700 p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-900 rounded-xl p-6 border border-dark-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-dark-400 text-sm">Total Balance</span>
                  <TrendingUp className="text-green-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-dark-50">$12,450</p>
                <p className="text-green-400 text-sm mt-2">+12.5% this month</p>
              </div>
              <div className="bg-dark-900 rounded-xl p-6 border border-dark-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-dark-400 text-sm">Monthly Expenses</span>
                  <DollarSign className="text-red-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-dark-50">$3,280</p>
                <p className="text-dark-400 text-sm mt-2">73% of budget</p>
              </div>
              <div className="bg-dark-900 rounded-xl p-6 border border-dark-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-dark-400 text-sm">Savings Goal</span>
                  <Target className="text-blue-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-dark-50">$8,500</p>
                <p className="text-blue-400 text-sm mt-2">85% completed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Value Proposition - WhatsApp Feature */}
      <section className="py-20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-y border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
                <Zap className="text-green-400" size={16} />
                <span className="text-green-400 text-sm font-medium">Unique Feature</span>
              </div>
              <h2 className="text-4xl font-bold text-dark-50 mb-6">
                Upload Expenses via <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">WhatsApp</span>
              </h2>
              <p className="text-xl text-dark-300 mb-8">
                Simply send your receipt or transaction details to our WhatsApp bot.
                We'll automatically extract and categorize the data in seconds.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-dark-100 font-semibold mb-1">Instant Upload</h3>
                    <p className="text-dark-400">Take a photo of your receipt and send it via WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-dark-100 font-semibold mb-1">AI-Powered Extraction</h3>
                    <p className="text-dark-400">Automatically reads amount, date, and merchant</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-dark-100 font-semibold mb-1">Smart Categorization</h3>
                    <p className="text-dark-400">AI categorizes your expense into the right budget</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-700">
                  <MessageCircle className="text-green-400" size={24} />
                  <div>
                    <p className="text-dark-100 font-semibold">Opsia Bot</p>
                    <p className="text-dark-400 text-sm">Online</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="bg-dark-700 rounded-2xl rounded-bl-none p-4 max-w-[80%]">
                      <p className="text-dark-200 text-sm mb-2">📸 Receipt uploaded</p>
                      <div className="bg-dark-900 p-3 rounded-lg">
                        <p className="text-dark-300 text-xs">Coffee Shop Receipt</p>
                        <p className="text-dark-100 font-semibold">$4.50</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-indigo-500 rounded-2xl rounded-br-none p-4 max-w-[80%]">
                      <p className="text-white text-sm">✅ Expense added!</p>
                      <p className="text-white/80 text-xs mt-1">Category: Dining Out</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multiple Upload Methods */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              Upload Your Way
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Choose the method that works best for you. All your data syncs seamlessly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-800/50 p-8 rounded-2xl border border-dark-700 hover:border-indigo-500/50 transition-all group">
              <div className="bg-green-500/10 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="text-green-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-3">
                WhatsApp Upload
              </h3>
              <p className="text-dark-300 mb-4">
                Send receipts directly from your phone. AI extracts all the details automatically.
              </p>
              <div className="text-indigo-400 text-sm font-medium">
                Most Popular →
              </div>
            </div>
            <div className="bg-dark-800/50 p-8 rounded-2xl border border-dark-700 hover:border-indigo-500/50 transition-all group">
              <div className="bg-emerald-500/10 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-3">
                Excel/CSV Import
              </h3>
              <p className="text-dark-300 mb-4">
                Import your existing expense data from spreadsheets in seconds.
              </p>
              <div className="text-indigo-400 text-sm font-medium">
                Bulk Upload →
              </div>
            </div>
            <div className="bg-dark-800/50 p-8 rounded-2xl border border-dark-700 hover:border-indigo-500/50 transition-all group">
              <div className="bg-blue-500/10 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Upload className="text-blue-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-dark-50 mb-3">
                Manual Entry
              </h3>
              <p className="text-dark-300 mb-4">
                Quick form to add transactions on the go with smart autocomplete.
              </p>
              <div className="text-indigo-400 text-sm font-medium">
                Traditional →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Reports & Analytics */}
      <section className="py-20 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 shadow-2xl">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-dark-400 text-sm">Monthly Overview</span>
                    <Calendar className="text-indigo-400" size={16} />
                  </div>
                  <div className="h-48 bg-dark-900 rounded-xl flex items-end gap-2 p-4">
                    {[65, 78, 85, 70, 90, 75, 82, 88, 73, 95, 80, 85].map((height, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-dark-900 p-3 rounded-lg">
                    <p className="text-dark-400 text-xs">Income</p>
                    <p className="text-green-400 font-bold">$6,500</p>
                  </div>
                  <div className="bg-dark-900 p-3 rounded-lg">
                    <p className="text-dark-400 text-xs">Expenses</p>
                    <p className="text-red-400 font-bold">$3,280</p>
                  </div>
                  <div className="bg-dark-900 p-3 rounded-lg">
                    <p className="text-dark-400 text-xs">Savings</p>
                    <p className="text-blue-400 font-bold">$3,220</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
                <BarChart3 className="text-purple-400" size={16} />
                <span className="text-purple-400 text-sm font-medium">Advanced Analytics</span>
              </div>
              <h2 className="text-4xl font-bold text-dark-50 mb-6">
                Powerful Reports & Insights
              </h2>
              <p className="text-xl text-dark-300 mb-8">
                Understand your spending patterns with beautiful, actionable reports that help you make better financial decisions.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <PieChart className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-dark-100 font-semibold mb-1">Category Breakdown</h3>
                    <p className="text-dark-400">See exactly where your money goes with interactive pie charts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <TrendingUp className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-dark-100 font-semibold mb-1">Spending Pace Analysis</h3>
                    <p className="text-dark-400">Track daily spending and predict month-end totals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <Target className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-dark-100 font-semibold mb-1">Budget Performance</h3>
                    <p className="text-dark-400">Monitor budget usage with real-time alerts and trends</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-2 mb-6">
              <Brain className="text-pink-400" size={16} />
              <span className="text-pink-400 text-sm font-medium">AI-Powered</span>
            </div>
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              Smart Budget Suggestions
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              Our AI analyzes your spending patterns and suggests optimal budget adjustments to help you save more.
            </p>
          </div>
          <div className="max-w-3xl mx-auto bg-dark-800 rounded-2xl border border-dark-700 p-8">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-500/10 p-2 rounded-lg">
                    <TrendingUp className="text-red-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-semibold mb-2">Dining Out Budget Suggestion</h3>
                    <p className="text-dark-300 text-sm mb-4">
                      You've exceeded your dining budget in 4/6 months. Consider increasing from $300 to $380/month.
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-dark-400 text-xs">Current</p>
                        <p className="text-dark-100 font-bold">$300</p>
                      </div>
                      <ArrowRight className="text-dark-500" size={16} />
                      <div>
                        <p className="text-dark-400 text-xs">Suggested</p>
                        <p className="text-red-400 font-bold">$380</p>
                      </div>
                      <div className="ml-auto">
                        <button className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors">
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <TrendingUp className="text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-green-400 font-semibold mb-2">Entertainment Budget Optimization</h3>
                    <p className="text-dark-300 text-sm mb-4">
                      You're consistently under budget. Reduce from $200 to $150/month to allocate more to savings.
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-dark-400 text-xs">Current</p>
                        <p className="text-dark-100 font-bold">$200</p>
                      </div>
                      <ArrowRight className="text-dark-500" size={16} />
                      <div>
                        <p className="text-dark-400 text-xs">Suggested</p>
                        <p className="text-green-400 font-bold">$150</p>
                      </div>
                      <div className="ml-auto">
                        <button className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors">
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try Demo Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-y border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Eye className="mx-auto text-indigo-400 mb-6" size={48} />
          <h2 className="text-4xl font-bold text-dark-50 mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-dark-300 mb-10 max-w-2xl mx-auto">
            Experience Opsia with real data. Explore 12 months of transactions, budgets, and reports - no signup required.
          </p>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-10 py-5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-medium"
          >
            <Eye size={24} />
            Try Live Demo Now
            <ArrowRight size={20} />
          </Link>
          <p className="text-dark-400 text-sm mt-4">
            Full access • No registration • No credit card
          </p>
        </div>
      </section>

      {/* Beta Program */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-50 mb-4">
              Limited Beta Offer
            </h2>
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 max-w-2xl mx-auto border border-indigo-500/30">
              <p className="text-lg text-indigo-400 font-semibold mb-2">
                🎉 Lifetime Free Access for Early Adopters
              </p>
              <p className="text-dark-300">
                Join the first 25 beta users and get <span className="text-indigo-400 font-semibold">free lifetime access</span> to all Pro features.
                Help shape the future of Opsia.
              </p>
              <div className="mt-4 flex justify-center">
                <div className="bg-dark-800 px-6 py-3 rounded-lg border border-dark-700">
                  <span className="text-dark-300">Spots remaining: </span>
                  <span className="text-indigo-400 font-bold text-xl">21</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-dark-800/50 p-8 rounded-2xl border border-dark-700">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-dark-50 mb-2">Regular Plan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-dark-50">$9</span>
                  <span className="text-dark-400">/month</span>
                </div>
                <p className="text-dark-400 mt-2">After beta period ends</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  Unlimited transactions & budgets
                </li>
                <li className="flex items-center gap-3 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  WhatsApp & Excel upload
                </li>
                <li className="flex items-center gap-3 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  Advanced analytics & reports
                </li>
                <li className="flex items-center gap-3 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  AI budget suggestions
                </li>
                <li className="flex items-center gap-3 text-dark-200">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  Priority support
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-b from-indigo-500 to-purple-500 p-8 rounded-2xl relative shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-dark-950 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ BEST VALUE
              </div>
              <div className="mb-8 mt-4">
                <h3 className="text-xl font-semibold text-white mb-2">Beta Access</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">Free</span>
                  <span className="text-white/80">forever</span>
                </div>
                <p className="text-white/90 mt-2">First 25 users only</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  All Pro features included
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  Lifetime free access (worth $108/year)
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  Early access to new features
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  Direct founder support
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  Influence product roadmap
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center bg-white text-indigo-600 px-6 py-4 rounded-xl hover:bg-gray-50 transition-colors font-bold text-lg shadow-lg"
              >
                Claim Your Spot Now
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
              Everything you need to know about Opsia
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                How does WhatsApp upload work?
              </h3>
              <p className="text-dark-300">
                Simply send a photo of your receipt or transaction details to our WhatsApp bot. Our AI reads and categorizes it automatically in seconds.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                Is my financial data secure?
              </h3>
              <p className="text-dark-300">
                Yes! We use bank-level encryption (AES-256) and never store your banking credentials. Your data is completely private and secure.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                Can I import existing data?
              </h3>
              <p className="text-dark-300">
                Absolutely! Upload your existing expense data via Excel or CSV files. We support all standard formats.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                What makes Opsia different?
              </h3>
              <p className="text-dark-300">
                WhatsApp upload (unique!), AI-powered insights, advanced reporting, and multiple upload methods - all in one beautiful app.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                Can I try before committing?
              </h3>
              <p className="text-dark-300">
                Yes! Try our live demo with real data - no signup required. Experience all features before deciding.
              </p>
            </div>
            <div className="bg-dark-800/50 p-6 rounded-2xl border border-dark-700">
              <h3 className="text-lg font-semibold text-dark-50 mb-2">
                What happens after the beta?
              </h3>
              <p className="text-dark-300">
                Beta users keep lifetime free access. New users will pay $9/month, but you're locked in at $0 forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Master Your Money?
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
                Join 21 spots left for lifetime free access. Start tracking smarter today.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-bold shadow-xl"
                >
                  Start Free Forever
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white border-2 border-white/20 px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg font-bold"
                >
                  <Eye size={20} />
                  Try Demo
                </Link>
              </div>
              <p className="text-white/80 text-sm mt-6">
                No credit card • No commitment • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-900/50 py-12 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-8 w-8 text-indigo-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Opsia
                </span>
              </div>
              <p className="text-dark-400">
                Smart budgeting made effortless.
              </p>
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/demo" className="text-dark-400 hover:text-indigo-400 transition-colors">
                    Try Demo
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-dark-400 hover:text-indigo-400 transition-colors">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-dark-400 hover:text-indigo-400 transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                <li className="text-dark-400">WhatsApp Upload</li>
                <li className="text-dark-400">AI Insights</li>
                <li className="text-dark-400">Advanced Reports</li>
                <li className="text-dark-400">Budget Tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-dark-400 hover:text-indigo-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-dark-400 hover:text-indigo-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="text-dark-400 hover:text-indigo-400 transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-800 pt-8 text-center">
            <p className="text-dark-400">
              © {new Date().getFullYear()} Opsia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
