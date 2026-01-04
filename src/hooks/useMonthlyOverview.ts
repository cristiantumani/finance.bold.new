import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { MonthlyData, ReportError } from '../types/reports';

export function useMonthlyOverview(year: number) {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReportError | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMonthlyOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get all months in the year
        const months = Array.from({ length: 12 }, (_, i) => {
          const month = (i + 1).toString().padStart(2, '0');
          return `${year}-${month}`;
        });

        // Fetch all transactions for the year in ONE query
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('date, type, amount')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate);

        if (txError) throw txError;

        // Fetch all budgets for the user
        const { data: budgets, error: budgetError } = await supabase
          .from('budgets')
          .select('budget_limit, period')
          .eq('user_id', user.id);

        if (budgetError) throw budgetError;

        // Calculate total monthly budget
        let totalMonthlyBudget = 0;
        budgets?.forEach(budget => {
          // Only count monthly budgets for now
          if (budget.period === 'monthly') {
            totalMonthlyBudget += budget.budget_limit;
          }
        });

        // Process data efficiently in memory
        const monthlyDataMap = new Map<string, MonthlyData>();

        // Initialize all months
        months.forEach(month => {
          monthlyDataMap.set(month, {
            month,
            income: 0,
            expense: 0,
            savings: 0,
            budget: totalMonthlyBudget, // Same budget for all months
          });
        });

        // Aggregate transactions
        transactions?.forEach(tx => {
          const month = tx.date.substring(0, 7);
          const monthData = monthlyDataMap.get(month);

          if (monthData) {
            if (tx.type === 'income') {
              monthData.income += tx.amount;
            } else {
              monthData.expense += tx.amount;
            }
          }
        });

        // Calculate savings for each month
        monthlyDataMap.forEach(monthData => {
          monthData.savings = monthData.income - monthData.expense;
        });

        // Convert map to array
        const result = Array.from(monthlyDataMap.values());

        setData(result);
      } catch (err: any) {
        console.error('Error fetching monthly overview:', err);
        setError({
          message: err.message || 'Failed to load monthly overview',
          code: err.code,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyOverview();
  }, [user, year]);

  return { data, loading, error };
}
