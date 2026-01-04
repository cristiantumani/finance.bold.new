/*
  # Add month column to budgets table

  This migration adds a month column to the budgets table to allow
  budget amounts to vary by month instead of being static per category.

  Changes:
  - Add 'month' column to budgets table (VARCHAR in YYYY-MM format)
  - Add index on (user_id, month) for efficient monthly queries
  - Add unique constraint on (user_id, category, period, month) to prevent duplicates
*/

-- Add month column to budgets table
-- Using VARCHAR(7) for YYYY-MM format (e.g., '2026-01')
-- Nullable initially for backward compatibility with existing budgets
ALTER TABLE budgets
ADD COLUMN month VARCHAR(7);

-- Create index for efficient monthly budget queries
CREATE INDEX IF NOT EXISTS budgets_user_month_idx ON budgets(user_id, month);

-- Add unique constraint to prevent duplicate budgets for same category/period/month
-- Drop existing unique constraints if any, then add new one
-- This ensures one budget per category per period per month per user
CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_category_period_month_unique
ON budgets(user_id, category_id, period, month);

-- Add comment to explain the month column
COMMENT ON COLUMN budgets.month IS 'Month for this budget in YYYY-MM format. NULL means budget applies to all months.';
