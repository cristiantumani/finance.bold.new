import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import Footer from './components/Footer';
import Feedback from './components/Feedback';
import Dashboard from './components/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import ExpenseTypes from './pages/ExpenseTypes';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import TransactionUpload from './pages/TransactionUpload';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import VerifyEmail from './pages/VerifyEmail';
import ProfileSetup from './pages/ProfileSetup';
import BlogPost from './pages/BlogPost';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen pb-20">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/profile-setup" element={
              <AuthGuard>
                <ProfileSetup />
              </AuthGuard>
            } />
            <Route path="/expense-types" element={<ExpenseTypes />} />
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
            <Route path="/blogpost" element={<BlogPost />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Footer />
          <Feedback />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App