/*
  # Update transactions table structure

  This migration updates the transactions table to use category_id instead of category
  and ensures proper foreign key relationships.

  1. Changes:
    - Migrate data from category to category_id
    - Remove old category column
    - Add foreign key constraint

  2. Security:
    - Maintains existing RLS policies
    - Adds referential integrity with categories table
*/

-- Create a function to safely handle the migration
DO $$ 
DECLARE
  transaction_record RECORD;
BEGIN
  -- For each transaction, try to find the matching category and update category_id
  FOR transaction_record IN SELECT * FROM transactions LOOP
    -- Try to find the category by name
    UPDATE transactions t
    SET category_id = c.id
    FROM categories c
    WHERE t.id = transaction_record.id
    AND c.name = transaction_record.category;
  END LOOP;
END $$;

-- Drop the old column
ALTER TABLE transactions 
DROP COLUMN IF EXISTS category;

-- Make category_id required
ALTER TABLE transactions 
ALTER COLUMN category_id SET NOT NULL;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_category_id_fkey'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE;
  END IF;
END $$;