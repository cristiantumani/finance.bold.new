import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ReportError } from '../types/reports';

export type ExpenseType = 'fixed' | 'variable' | 'controllable_fixed';

export type CategoryExpense = {
  category_id: string;
  category_name: string;
  expense_type: ExpenseType;
  total: number;
  percentage: number;
};

type FilterOptions = {
  includeFixed: boolean;
  includeVariable: boolean;
  includeControllableFixed: boolean;
};

export function useCategoryBreakdown(year: number, month: number, filters: FilterOptions) {
  const { user } = useAuth();
  const [data, setData] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReportError | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCategoryBreakdown = async () => {
      setLoading(true);
      setError(null);

      try {
        // Calculate date range for the selected month
        const monthStr = month.toString().padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

        // Fetch all expense transactions for the month with category info
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select(`
            amount,
            category_id,
            categories (
              name,
              expense_type
            )
          `)
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('date', startDate)
          .lte('date', endDate);

        if (txError) throw txError;

        // Aggregate by category
        const categoryMap = new Map<string, CategoryExpense>();
        let total = 0;

        transactions?.forEach(tx => {
          const category = tx.categories as any;
          if (!category) return;

          const expenseType = category.expense_type as ExpenseType;

          // Apply filters
          if (expenseType === 'fixed' && !filters.includeFixed) return;
          if (expenseType === 'variable' && !filters.includeVariable) return;
          if (expenseType === 'controllable_fixed' && !filters.includeControllableFixed) return;

          const existing = categoryMap.get(tx.category_id);
          if (existing) {
            existing.total += tx.amount;
          } else {
            categoryMap.set(tx.category_id, {
              category_id: tx.category_id,
              category_name: category.name,
              expense_type: expenseType,
              total: tx.amount,
              percentage: 0, // Will calculate after
            });
          }
          total += tx.amount;
        });

        // Calculate percentages and sort by total (descending)
        const result = Array.from(categoryMap.values())
          .map(cat => ({
            ...cat,
            percentage: total > 0 ? (cat.total / total) * 100 : 0,
          }))
          .sort((a, b) => b.total - a.total);

        setData(result);
        setTotalExpenses(total);
      } catch (err: any) {
        console.error('Error fetching category breakdown:', err);
        setError({
          message: err.message || 'Failed to load category breakdown',
          code: err.code,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryBreakdown();
  }, [user, year, month, filters.includeFixed, filters.includeVariable, filters.includeControllableFixed]);

  return { data, totalExpenses, loading, error };
}
