/*
  # Fix Budget Category Schema

  1. Changes
    - Ensure budget_limit column exists and is properly typed
    - Add missing foreign key constraints
    - Add missing indexes
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add any missing policies for data protection
*/

-- Ensure budget_limit column exists and is properly typed
DO $$ 
BEGIN
  -- Rename 'limit' to 'budget_limit' if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'limit'
  ) THEN
    ALTER TABLE budgets RENAME COLUMN "limit" TO budget_limit;
  END IF;

  -- Ensure budget_limit is DECIMAL(12,2)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'budget_limit'
  ) THEN
    ALTER TABLE budgets ALTER COLUMN budget_limit TYPE DECIMAL(12,2);
  ELSE
    ALTER TABLE budgets ADD COLUMN budget_limit DECIMAL(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Ensure proper foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'budgets_category_id_fkey'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create or update indexes
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- Ensure RLS policies are properly set
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;

-- Create comprehensive RLS policies
CREATE POLICY "Users can create their own budgets"
  ON budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own budgets"
  ON budgets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);