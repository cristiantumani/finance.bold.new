import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, TrendingUp, TrendingDown, Target, PiggyBank, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Tip = {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
  source: 'personal' | 'general';
};

type Budget = {
  id: string;
  category_id: string;
  budget_limit: number;
  categories: {
    name: string;
  };
};

const generalTips = [
  {
    id: 'tip-1',
    message: 'Set budgets for all your major expense categories — it\'s the best way to stay in control.',
    type: 'info',
    icon: <Target className="text-indigo-400" />
  },
  {
    id: 'tip-2',
    message: 'Track your income monthly to spot trends and adjust spending.',
    type: 'info',
    icon: <TrendingUp className="text-indigo-400" />
  },
  {
    id: 'tip-3',
    message: 'Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
    type: 'info',
    icon: <PiggyBank className="text-indigo-400" />
  },
  {
    id: 'tip-4',
    message: 'Review your subscriptions every few months — small charges add up fast.',
    type: 'info',
    icon: <Sparkles className="text-indigo-400" />
  },
  {
    id: 'tip-5',
    message: 'Build an emergency fund with at least 3 months of essential expenses.',
    type: 'info',
    icon: <PiggyBank className="text-indigo-400" />
  },
  {
    id: 'tip-6',
    message: 'Avoid lifestyle creep — when your income grows, grow your savings too.',
    type: 'info',
    icon: <TrendingUp className="text-indigo-400" />
  },
  {
    id: 'tip-7',
    message: 'Separate your needs from wants — it helps you prioritize smarter.',
    type: 'info',
    icon: <Target className="text-indigo-400" />
  },
  {
    id: 'tip-8',
    message: 'Automate savings each month so you pay yourself first, not last.',
    type: 'info',
    icon: <Sparkles className="text-indigo-400" />
  }
] as const;

export default function SmartFinanceTips() {
  const { user } = useAuth();
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateTips = async () => {
      if (!user) return;

      try {
        // Get user's transactions and budgets with proper category joins
        const [transactionsResponse, budgetsResponse] = await Promise.all([
          supabase
            .from('transactions')
            .select(`
              amount,
              type,
              category_id,
              date,
              categories (
                name
              )
            `)
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(100),
          supabase
            .from('budgets')
            .select(`
              id,
              category_id,
              budget_limit,
              categories (
                name
              )
            `)
            .eq('user_id', user.id)
        ]);

        const transactions = transactionsResponse.data || [];
        const budgets = (budgetsResponse.data || []) as Budget[];

        // If user has no data, use general tips
        if (transactions.length === 0 || budgets.length === 0) {
          const shuffledTips = [...generalTips]
            .sort(() => Math.random() - 0.5)
            .map(tip => ({ ...tip, source: 'general' as const }));
          setAllTips(shuffledTips);
          return;
        }

        // Generate personalized tips based on user data
        const personalizedTips: Tip[] = [];

        // Check for overspending in categories
        const categorySpending = transactions.reduce((acc: { [key: string]: number }, t: any) => {
          if (t.type === 'expense') {
            acc[t.category_id] = (acc[t.category_id] || 0) + Number(t.amount);
          }
          return acc;
        }, {});

        // Compare with budgets
        budgets.forEach((budget) => {
          if (!budget.categories?.name) return;

          const spent = categorySpending[budget.category_id] || 0;
          const spentPercentage = (spent / budget.budget_limit) * 100;

          if (spentPercentage > 100) {
            personalizedTips.push({
              id: `overspend-${budget.category_id}`,
              message: `You've spent ${spentPercentage.toFixed(0)}% of your ${budget.categories.name} budget. Consider reviewing your spending in this category.`,
              type: 'warning',
              icon: <TrendingUp className="text-yellow-400" />,
              source: 'personal'
            });
          } else if (spentPercentage < 50) {
            personalizedTips.push({
              id: `underspend-${budget.category_id}`,
              message: `Great job keeping ${budget.categories.name} expenses under control! You've only used ${spentPercentage.toFixed(0)}% of your budget.`,
              type: 'success',
              icon: <Sparkles className="text-emerald-400" />,
              source: 'personal'
            });
          }
        });

        // Check savings rate
        const totalIncome = transactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const totalExpenses = transactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const savingsRate = totalIncome > 0 
          ? ((totalIncome - totalExpenses) / totalIncome) * 100 
          : 0;

        if (savingsRate > 20) {
          personalizedTips.push({
            id: 'savings-great',
            message: `Excellent work! Your savings rate of ${savingsRate.toFixed(1)}% is above the recommended 20%.`,
            type: 'success',
            icon: <TrendingUp className="text-emerald-400" />,
            source: 'personal'
          });
        } else if (savingsRate < 10) {
          personalizedTips.push({
            id: 'savings-low',
            message: 'Your savings rate is below 10%. Try identifying areas where you can reduce expenses.',
            type: 'warning',
            icon: <TrendingDown className="text-yellow-400" />,
            source: 'personal'
          });
        }

        // Shuffle both personal and general tips
        const shuffledPersonalTips = personalizedTips.sort(() => Math.random() - 0.5);
        const shuffledGeneralTips = [...generalTips]
          .sort(() => Math.random() - 0.5)
          .map(tip => ({ ...tip, source: 'general' as const }));

        // Interleave personal and general tips
        const combinedTips: Tip[] = [];
        const maxLength = Math.max(shuffledPersonalTips.length, shuffledGeneralTips.length);

        for (let i = 0; i < maxLength; i++) {
          // Add two personal tips if available
          if (i < shuffledPersonalTips.length) {
            combinedTips.push(shuffledPersonalTips[i]);
          }
          if (i + 1 < shuffledPersonalTips.length) {
            combinedTips.push(shuffledPersonalTips[i + 1]);
          }
          // Add one general tip
          if (i < shuffledGeneralTips.length) {
            combinedTips.push(shuffledGeneralTips[i]);
          }
        }

        setAllTips(combinedTips);
      } catch (error) {
        console.error('Error generating finance tips:', error);
        // Fall back to general tips on error
        const shuffledTips = [...generalTips]
          .sort(() => Math.random() - 0.5)
          .map(tip => ({ ...tip, source: 'general' as const }));
        setAllTips(shuffledTips);
      } finally {
        setLoading(false);
      }
    };

    generateTips();
  }, [user]);

  // Rotate tips every 10 seconds
  useEffect(() => {
    if (allTips.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTipIndex(current => (current + 1) % allTips.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [allTips.length]);

  if (loading || allTips.length === 0) return null;

  const currentTip = allTips[currentTipIndex];

  return (
    <div className="bg-dark-800/50 backdrop-blur-xl p-4 lg:p-6 rounded-2xl shadow-lg border border-dark-700">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-dark-700/50 rounded-xl">
          <Lightbulb className="text-indigo-400 w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-dark-50 mb-4">
            Smart Finance Tips
          </h2>
          <div 
            className={`p-3 rounded-lg ${
              currentTip.type === 'success' ? 'bg-emerald-900/20 border border-emerald-900/30' :
              currentTip.type === 'warning' ? 'bg-yellow-900/20 border border-yellow-900/30' :
              'bg-dark-700/20 border border-dark-600'
            }`}
          >
            <p className={`text-sm ${
              currentTip.type === 'success' ? 'text-emerald-400' :
              currentTip.type === 'warning' ? 'text-yellow-400' :
              'text-dark-200'
            }`}>
              {currentTip.message}
            </p>
          </div>
          <Link 
            to="/reports" 
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View detailed reports
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}