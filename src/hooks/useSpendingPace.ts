import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import type { ReportError } from '../types/reports';

// Demo user ID for demo mode
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export type DailySpending = {
  day: number; // 1-31
  amount: number;
  cumulative: number;
};

export type MonthSpending = {
  month: string; // YYYY-MM
  monthLabel: string; // "January 2026"
  days: DailySpending[];
  total: number;
  isCurrent: boolean;
};

export function useSpendingPace(year: number, month: number, monthsToCompare: number = 3) {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [data, setData] = useState<MonthSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReportError | null>(null);
  const [currentDayOfMonth, setCurrentDayOfMonth] = useState(new Date().getDate());

  // Use demo user ID when in demo mode, otherwise use authenticated user
  const effectiveUserId = isDemoMode ? DEMO_USER_ID : user?.id;

  useEffect(() => {
    if (!effectiveUserId) return;

    const fetchSpendingPace = async () => {
      setLoading(true);
      setError(null);

      try {
        const monthsData: MonthSpending[] = [];

        // Determine if selected month is current month
        const now = new Date();
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
        setCurrentDayOfMonth(isCurrentMonth ? now.getDate() : 31);

        // Fetch data for selected month + previous months
        for (let i = 0; i < monthsToCompare; i++) {
          // Calculate year and month for this iteration
          const targetDate = new Date(year, month - 1 - i, 1);
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth() + 1;
          const monthStr = targetMonth.toString().padStart(2, '0');
          const monthKey = `${targetYear}-${monthStr}`;

          // Calculate first and last day of the month
          const firstDay = `${targetYear}-${monthStr}-01`;
          const lastDay = new Date(targetYear, targetMonth, 0);
          const lastDayStr = lastDay.toISOString().split('T')[0];

          // Fetch all expense transactions for this month
          const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('date, amount')
            .eq('user_id', effectiveUserId)
            .eq('type', 'expense')
            .gte('date', firstDay)
            .lte('date', lastDayStr);

          if (txError) throw txError;

          // Get the number of days in this month
          const daysInMonth = lastDay.getDate();

          // Aggregate by day of month
          const dailyMap = new Map<number, number>();

          // Initialize all days to 0
          for (let day = 1; day <= daysInMonth; day++) {
            dailyMap.set(day, 0);
          }

          // Add transaction amounts to their respective days
          transactions?.forEach(tx => {
            const day = parseInt(tx.date.split('-')[2], 10);
            const current = dailyMap.get(day) || 0;
            dailyMap.set(day, current + tx.amount);
          });

          // Calculate cumulative spending
          let cumulative = 0;
          const days: DailySpending[] = [];
          let total = 0;

          for (let day = 1; day <= daysInMonth; day++) {
            const amount = dailyMap.get(day) || 0;
            cumulative += amount;
            total += amount;

            days.push({
              day,
              amount,
              cumulative,
            });
          }

          // Create month label
          const monthLabel = targetDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          });

          monthsData.push({
            month: monthKey,
            monthLabel,
            days,
            total,
            isCurrent: i === 0, // First iteration is the selected month
          });
        }

        setData(monthsData);
      } catch (err: any) {
        console.error('Error fetching spending pace:', err);
        setError({
          message: err.message || 'Failed to load spending pace',
          code: err.code,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSpendingPace();
  }, [effectiveUserId, year, month, monthsToCompare]);

  return { data, currentDayOfMonth, loading, error };
}
