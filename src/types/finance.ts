export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type ExpenseType = 'fixed' | 'variable' | 'controllable_fixed';

export type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  description: string;
  date: string;
  tags: string[];
  expense_type?: ExpenseType;
};

export type Budget = {
  id: string;
  category_id: string;
  budget_limit: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
};

export type FinancialHealth = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
};