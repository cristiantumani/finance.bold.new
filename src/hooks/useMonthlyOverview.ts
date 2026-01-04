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

        console.log('=== Monthly Overview Debug ===');
        console.log('Year:', year);
        console.log('Total transactions fetched:', transactions?.length || 0);
        console.log('Sample transactions:', transactions?.slice(0, 5));

        // Fetch all budgets for the user (including month-specific budgets)
        const { data: budgets, error: budgetError } = await supabase
          .from('budgets')
          .select('budget_limit, period, month')
          .eq('user_id', user.id);

        if (budgetError) throw budgetError;

        // Process data efficiently in memory
        const monthlyDataMap = new Map<string, MonthlyData>();

        // Initialize all months
        months.forEach(month => {
          // Calculate budget for this specific month
          let monthBudget = 0;

          budgets?.forEach(budget => {
            // Only count monthly budgets
            if (budget.period === 'monthly') {
              // If budget has a specific month, only apply it to that month
              // If budget.month is null, apply it to all months (backward compatibility)
              if (budget.month === month || budget.month === null) {
                monthBudget += Number(budget.budget_limit);
              }
            }
          });

          monthlyDataMap.set(month, {
            month,
            income: 0,
            expense: 0,
            savings: 0,
            budget: monthBudget,
          });
        });

        // Aggregate transactions
        transactions?.forEach(tx => {
          const month = tx.date.substring(0, 7);
          const monthData = monthlyDataMap.get(month);

          if (monthData) {
            const amount = Number(tx.amount); // Ensure amount is a number
            if (tx.type === 'income') {
              monthData.income += amount;
            } else {
              monthData.expense += amount;
            }
          } else {
            console.warn('Transaction outside year range:', tx.date, 'Expected year:', year);
          }
        });

        console.log('Monthly aggregation results:');
        monthlyDataMap.forEach((data, month) => {
          if (data.income > 0 || data.expense > 0) {
            console.log(`${month}: Income=$${data.income}, Expense=$${data.expense}`);
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
