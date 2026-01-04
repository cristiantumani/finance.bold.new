import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ReportError } from '../types/reports';

export type BudgetStatus = 'under' | 'near' | 'over';

export type CategoryBudgetPerformance = {
  category_id: string;
  category_name: string;
  expense_type: 'fixed' | 'variable' | 'controllable_fixed';
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
};

export type MonthlyBudgetPerformance = {
  month: string; // YYYY-MM
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
};

export function useBudgetPerformance(year: number, month: number) {
  const { user } = useAuth();
  const [monthData, setMonthData] = useState<CategoryBudgetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReportError | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchBudgetPerformance = async () => {
      setLoading(true);
      setError(null);

      try {
        const monthStr = month.toString().padStart(2, '0');
        const monthKey = `${year}-${monthStr}`;
        const startDate = `${year}-${monthStr}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // Fetch budgets with categories for the selected month
        const { data: budgets, error: budgetError } = await supabase
          .from('budgets')
          .select(`
            category_id,
            budget_limit,
            period,
            month,
            categories (
              name,
              expense_type
            )
          `)
          .eq('user_id', user.id);

        if (budgetError) throw budgetError;

        // Fetch transactions for the month
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('category_id, amount')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('date', startDate)
          .lte('date', endDate);

        if (txError) throw txError;

        // Calculate spending per category
        const spendingMap = new Map<string, number>();
        transactions?.forEach(tx => {
          const current = spendingMap.get(tx.category_id) || 0;
          spendingMap.set(tx.category_id, current + tx.amount);
        });

        // Process budgets for this month
        const categoryPerformance: CategoryBudgetPerformance[] = [];

        budgets?.forEach(budget => {
          // Only include monthly budgets that apply to this month
          if (budget.period !== 'monthly') return;
          if (budget.month && budget.month !== monthKey) return;

          const category = budget.categories as any;
          if (!category) return;

          const spent = spendingMap.get(budget.category_id) || 0;
          const remaining = budget.budget_limit - spent;
          const percentage = budget.budget_limit > 0 ? (spent / budget.budget_limit) * 100 : 0;

          let status: BudgetStatus = 'under';
          if (percentage >= 100) {
            status = 'over';
          } else if (percentage >= 85) {
            status = 'near';
          }

          categoryPerformance.push({
            category_id: budget.category_id,
            category_name: category.name,
            expense_type: category.expense_type,
            budget: budget.budget_limit,
            spent,
            remaining,
            percentage,
            status,
          });
        });

        // Sort by percentage (highest first)
        categoryPerformance.sort((a, b) => b.percentage - a.percentage);

        setMonthData(categoryPerformance);
      } catch (err: any) {
        console.error('Error fetching budget performance:', err);
        setError({
          message: err.message || 'Failed to load budget performance',
          code: err.code,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetPerformance();
  }, [user, year, month]);

  return { monthData, loading, error };
}

export function useCategoryBudgetHistory(categoryId: string, monthsBack: number = 6) {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<MonthlyBudgetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReportError | null>(null);

  useEffect(() => {
    if (!user || !categoryId) return;

    const fetchCategoryHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const history: MonthlyBudgetPerformance[] = [];

        // Fetch budget for this category
        const { data: budgets, error: budgetError } = await supabase
          .from('budgets')
          .select('budget_limit, period, month')
          .eq('user_id', user.id)
          .eq('category_id', categoryId);

        if (budgetError) throw budgetError;

        // Process last N months
        for (let i = 0; i < monthsBack; i++) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth() + 1;
          const monthStr = targetMonth.toString().padStart(2, '0');
          const monthKey = `${targetYear}-${monthStr}`;

          // Find applicable budget for this month
          const applicableBudget = budgets?.find(b => {
            if (b.period !== 'monthly') return false;
            if (b.month === monthKey) return true; // Exact match
            if (b.month === null) return true; // Default budget
            return false;
          });

          if (!applicableBudget) {
            continue; // Skip months without budget
          }

          const budget = applicableBudget.budget_limit;

          // Fetch transactions for this month
          const startDate = `${targetYear}-${monthStr}-01`;
          const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

          const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .eq('category_id', categoryId)
            .gte('date', startDate)
            .lte('date', endDate);

          if (txError) throw txError;

          const spent = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
          const remaining = budget - spent;
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;

          let status: BudgetStatus = 'under';
          if (percentage >= 100) {
            status = 'over';
          } else if (percentage >= 85) {
            status = 'near';
          }

          history.push({
            month: monthKey,
            budget,
            spent,
            remaining,
            percentage,
            status,
          });
        }

        // Reverse to show oldest first
        setHistoryData(history.reverse());
      } catch (err: any) {
        console.error('Error fetching category history:', err);
        setError({
          message: err.message || 'Failed to load category history',
          code: err.code,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryHistory();
  }, [user, categoryId, monthsBack]);

  return { historyData, loading, error };
}
