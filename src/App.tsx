import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import Dashboard from './components/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import ExpenseTypes from './pages/ExpenseTypes';
import Budgets from './pages/Budgets';
import TransactionUpload from './pages/TransactionUpload';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
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
          <Route path="/upload" element={
            <AuthGuard>
              <TransactionUpload />
            </AuthGuard>
          } />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/transactions"
            element={
              <AuthGuard>
                <Transactions />
              </AuthGuard>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;