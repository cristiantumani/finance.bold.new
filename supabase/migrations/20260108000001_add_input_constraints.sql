/*
  # Add Input Validation Constraints

  1. Changes
    - Add length constraints on text fields to prevent abuse
    - Add range constraints on numeric fields
    - Add check constraints for data integrity
    - These complement client-side validation for defense in depth

  2. Security
    - Prevents excessively long inputs that could cause DoS
    - Ensures data integrity at database level
    - Works as final validation layer after client-side checks
*/

-- Transaction constraints
DO $$
BEGIN
  -- Add description length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_description_length'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_description_length
    CHECK (length(description) <= 500);
  END IF;

  -- Add amount positive constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_amount_positive'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_amount_positive
    CHECK (amount > 0);
  END IF;

  -- Add amount maximum constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_amount_max'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_amount_max
    CHECK (amount <= 1000000000);
  END IF;

  -- Add date range constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_date_range'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_date_range
    CHECK (date >= '2000-01-01' AND date <= CURRENT_DATE);
  END IF;
END $$;

-- Category constraints
DO $$
BEGIN
  -- Add name length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_name_length'
  ) THEN
    ALTER TABLE categories
    ADD CONSTRAINT categories_name_length
    CHECK (length(name) <= 100 AND length(name) > 0);
  END IF;

  -- Add expense type constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_expense_type_valid'
  ) THEN
    ALTER TABLE categories
    ADD CONSTRAINT categories_expense_type_valid
    CHECK (expense_type IN ('fixed', 'variable', 'controllable_fixed'));
  END IF;
END $$;

-- Budget constraints
DO $$
BEGIN
  -- Add budget limit positive constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'budgets_budget_limit_positive'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_budget_limit_positive
    CHECK (budget_limit > 0);
  END IF;

  -- Add budget limit maximum constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'budgets_budget_limit_max'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_budget_limit_max
    CHECK (budget_limit <= 1000000000);
  END IF;

  -- Add spent non-negative constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'budgets_spent_nonnegative'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_spent_nonnegative
    CHECK (spent >= 0);
  END IF;

  -- Add period constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'budgets_period_valid'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_period_valid
    CHECK (period IN ('monthly', 'yearly', 'custom'));
  END IF;
END $$;

-- User profile constraints
DO $$
BEGIN
  -- Add first name length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_first_name_length'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_first_name_length
    CHECK (length(first_name) <= 50 AND length(first_name) > 0);
  END IF;

  -- Add last name length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_last_name_length'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_last_name_length
    CHECK (length(last_name) <= 50 AND length(last_name) > 0);
  END IF;

  -- Add location length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_location_length'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_location_length
    CHECK (location IS NULL OR length(location) <= 100);
  END IF;

  -- Add app goal length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_app_goal_length'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_app_goal_length
    CHECK (app_goal IS NULL OR length(app_goal) <= 500);
  END IF;
END $$;

-- Create index on user_id for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
