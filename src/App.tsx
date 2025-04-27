import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import Footer from './components/Footer';
import Feedback from './components/Feedback';
import Dashboard from './components/Dashboard';
import Landing from './pages/Landing';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import ExpenseTypes from './pages/ExpenseTypes';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import TransactionUpload from './pages/TransactionUpload';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import OnboardingSetup from './pages/OnboardingSetup';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailReminder from './pages/VerifyEmailReminder';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark-950">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-email-reminder" element={<VerifyEmailReminder />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/expense-types" element={<ExpenseTypes />} />
            <Route path="/onboarding" element={
              <AuthGuard>
                <OnboardingSetup />
              </AuthGuard>
            } />
            <Route path="/categories" element={
              <AuthGuard>
                <Categories />
              </AuthGuard>
            } />
            <Route path="/budgets" element={
              <AuthGuard>
                <Budgets />
              </AuthGuard>
            } />
            <Route path="/reports" element={
              <AuthGuard>
                <Reports />
              </AuthGuard>
            } />
            <Route path="/upload" element={
              <AuthGuard>
                <TransactionUpload />
              </AuthGuard>
            } />
            <Route path="/dashboard" element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="/transactions" element={
              <AuthGuard>
                <Transactions />
              </AuthGuard>
            } />
            <Route path="/docs" element={<Documentation />} />
          </Routes>
          <Footer />
          <Feedback />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;