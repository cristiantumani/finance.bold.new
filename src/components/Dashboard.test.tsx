import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, vi, beforeAll, afterAll } from 'vitest';
import Dashboard from './Dashboard';

const mockTransactions = [
  {
    id: 't-income',
    type: 'income',
    amount: 1000,
    date: '2024-08-05',
    category_id: 'cat-salary',
    categories: { name: 'Salary', expense_type: 'income' },
    description: 'Paycheck'
  },
  {
    id: 't-rent',
    type: 'expense',
    amount: 300,
    date: '2024-08-06',
    category_id: 'cat-rent',
    categories: { name: 'Rent', expense_type: 'expense' },
    description: 'Rent'
  },
  {
    id: 't-dining',
    type: 'expense',
    amount: 150,
    date: '2024-08-08',
    category_id: 'cat-dining',
    categories: { name: 'Dining', expense_type: 'expense' },
    description: 'Dinner out'
  }
];

const mockBudgets = [
  {
    id: 'b-dining',
    category_id: 'cat-dining',
    budget_limit: 100,
    period: 'monthly',
    month: null,
    categories: { name: 'Dining' },
    spent: 0,
    percentage: 0
  }
];

const buildChain = (data: any[], resolveAtLte = false) => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    lte: () => resolveAtLte ? Promise.resolve({ data, error: null }) : chain,
    order: () => Promise.resolve({ data, error: null }),
    or: () => Promise.resolve({ data, error: null })
  };
  return chain;
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'transactions') {
        return {
          select: (fields?: string) => {
            if (fields?.includes('type, amount, date')) {
              return buildChain(mockTransactions, true);
            }
            return buildChain(mockTransactions);
          }
        };
      }

      if (table === 'budgets') {
        return {
          select: () => buildChain(mockBudgets, true)
        };
      }

      return {
        select: () => buildChain([])
      };
    }
  }
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } })
}));

vi.mock('../contexts/DemoContext', () => ({
  useDemo: () => ({ isDemoMode: false })
}));

// Stub out non-critical children to keep the test focused on data/rendering
vi.mock('./MonthSwitcher', () => ({
  __esModule: true,
  default: ({ selectedDate, onChange }: any) => (
    <button onClick={() => onChange(selectedDate)} aria-label="month-switcher" />
  )
}));

vi.mock('./TransactionForm', () => ({
  __esModule: true,
  default: () => null
}));

describe('Dashboard', () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2024-08-15T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('renders key metrics and budget warning from fetched data', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('Financial Overview')).toBeInTheDocument();
    expect(await screen.findByText(/\+\$550/)).toBeInTheDocument();
    expect(await screen.findByText('0/1')).toBeInTheDocument();
    expect(await screen.findByText(/budgets are over limit/i)).toBeInTheDocument();
  });
});
