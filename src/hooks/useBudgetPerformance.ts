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

export type SuggestionType = 'increase' | 'decrease' | 'seasonal';
export type TimeRange = 3 | 6;

export type BudgetSuggestion = {
  category_id: string;
  category_name: string;
  expense_type: 'fixed' | 'variable' | 'controllable_fixed';
  current_budget: number;
  suggested_budget: number;
  adjustment_amount: number;
  adjustment_percentage: number;
  suggestion_type: SuggestionType;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  months_analyzed: number;
  months_over_budget: number;
  months_under_budget: number;
  average_spent: number;
  variance: number;
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

// Helper function to calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

export function useBudgetSuggestions(monthsBack: TimeRange = 6) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReportError | null>(null);

  useEffect(() => {
    if (!user) return;

    const calculateSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if user has enough data (at least 3 months)
        const { data: oldestTx, error: oldestError } = await supabase
          .from('transactions')
          .select('date')
          .eq('user_id', user.id)
          .order('date', { ascending: true })
          .limit(1)
          .single();

        if (oldestError && oldestError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned", which is fine
          throw oldestError;
        }

        if (oldestTx) {
          const now = new Date();
          const monthsSinceFirst = Math.floor(
            (now.getTime() - new Date(oldestTx.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
          );

          if (monthsSinceFirst < 3) {
            setError({
              message: 'Not enough data yet. You need at least 3 months of transaction history to get budget suggestions.',
              code: 'INSUFFICIENT_DATA',
            });
            setLoading(false);
            return;
          }
        }

        // Fetch all budgets with categories
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
          .eq('user_id', user.id)
          .eq('period', 'monthly');

        if (budgetError) throw budgetError;

        const now = new Date();
        const suggestionsData: BudgetSuggestion[] = [];

        // Process each budget
        for (const budget of budgets || []) {
          const category = budget.categories as any;
          if (!category) continue;

          let totalSpent = 0;
          let monthsOverBudget = 0;
          let monthsUnderBudget = 0;
          const spentValues: number[] = [];

          // Collect data for the last N months
          for (let i = 0; i < monthsBack; i++) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const targetYear = targetDate.getFullYear();
            const targetMonth = targetDate.getMonth() + 1;
            const monthStr = targetMonth.toString().padStart(2, '0');
            const startDate = `${targetYear}-${monthStr}-01`;
            const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

            // Fetch transactions for this month
            const { data: transactions, error: txError } = await supabase
              .from('transactions')
              .select('amount')
              .eq('user_id', user.id)
              .eq('type', 'expense')
              .eq('category_id', budget.category_id)
              .gte('date', startDate)
              .lte('date', endDate);

            if (txError) throw txError;

            const spent = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
            const percentage = budget.budget_limit > 0 ? (spent / budget.budget_limit) * 100 : 0;

            totalSpent += spent;
            spentValues.push(spent);

            if (percentage >= 100) monthsOverBudget++;
            else if (percentage < 85) monthsUnderBudget++;
          }

          // Calculate statistics
          const averageSpent = totalSpent / monthsBack;
          const variance = calculateStandardDeviation(spentValues);
          const coefficientOfVariation = averageSpent > 0 ? variance / averageSpent : 0;

          // Skip if minimal spending
          if (averageSpent < 10) continue;

          // Determine suggestion type and calculate new budget
          let suggestionType: SuggestionType;
          let suggestedBudget = budget.budget_limit;
          let reasoning = '';

          // High variance suggests seasonal pattern
          if (coefficientOfVariation > 0.3) {
            suggestionType = 'seasonal';
            const maxSpent = Math.max(...spentValues);
            suggestedBudget = Math.round(maxSpent * 1.1);
            reasoning = `Spending varies significantly by month (${(coefficientOfVariation * 100).toFixed(0)}% variation). Consider adjusting budget to $${suggestedBudget.toLocaleString()} to cover peak months.`;
          }
          // Consistently over budget
          else if (monthsOverBudget >= monthsBack * 0.5) {
            suggestionType = 'increase';
            suggestedBudget = Math.round(averageSpent * 1.15);
            reasoning = `You've exceeded this budget in ${monthsOverBudget}/${monthsBack} months by an average of ${(((averageSpent - budget.budget_limit) / budget.budget_limit) * 100).toFixed(0)}%. Increase to $${suggestedBudget.toLocaleString()} for a more realistic target.`;
          }
          // Consistently under budget
          else if (monthsUnderBudget >= monthsBack * 0.7) {
            suggestionType = 'decrease';
            suggestedBudget = Math.round(averageSpent * 1.1);
            reasoning = `You've stayed well under budget in ${monthsUnderBudget}/${monthsBack} months, averaging $${Math.round(averageSpent).toLocaleString()}/month. Consider reducing to $${suggestedBudget.toLocaleString()} to free up budget for other categories.`;
          } else {
            // No suggestion needed
            continue;
          }

          // Skip if suggested budget is too close to current (within 5%)
          const adjustmentPercentage = ((suggestedBudget - budget.budget_limit) / budget.budget_limit) * 100;
          if (Math.abs(adjustmentPercentage) < 5) continue;

          // Determine priority
          let priority: 'high' | 'medium' | 'low' = 'medium';
          if (suggestionType === 'increase' && Math.abs(adjustmentPercentage) > 30) {
            priority = 'high';
          } else if (suggestionType === 'increase' && Math.abs(adjustmentPercentage) > 15) {
            priority = 'medium';
          } else {
            priority = 'low';
          }

          suggestionsData.push({
            category_id: budget.category_id,
            category_name: category.name,
            expense_type: category.expense_type,
            current_budget: budget.budget_limit,
            suggested_budget: suggestedBudget,
            adjustment_amount: suggestedBudget - budget.budget_limit,
            adjustment_percentage: adjustmentPercentage,
            suggestion_type: suggestionType,
            priority,
            reasoning,
            months_analyzed: monthsBack,
            months_over_budget: monthsOverBudget,
            months_under_budget: monthsUnderBudget,
            average_spent: averageSpent,
            variance,
          });
        }

        // Sort by priority (high first) then by adjustment percentage
        suggestionsData.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return Math.abs(b.adjustment_percentage) - Math.abs(a.adjustment_percentage);
        });

        setSuggestions(suggestionsData);
      } catch (err: any) {
        console.error('Error calculating budget suggestions:', err);
        setError({
          message: err.message || 'Failed to calculate budget suggestions',
          code: err.code,
        });
      } finally {
        setLoading(false);
      }
    };

    calculateSuggestions();
  }, [user, monthsBack]);

  return { suggestions, loading, error };
}
