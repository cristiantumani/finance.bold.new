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
  suggested_category_id?: string;
  suggestion_confidence?: number;
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

export type AISuggestion = {
  id: string;
  type: 'spending_alert' | 'budget_insight' | 'pattern_detected';
  category_id: string;
  message: string;
  priority: 1 | 2 | 3;
  is_read: boolean;
  created_at: string;
  category?: {
    name: string;
  };
};