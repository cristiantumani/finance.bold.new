/*
  # Fix budget and category relationship

  1. Changes
    - Add new UUID column for category IDs
    - Migrate data from text to UUID
    - Update column structure
    - Add foreign key constraint

  2. Security
    - Maintain existing RLS policies
*/

-- Add new UUID column
ALTER TABLE budgets 
ADD COLUMN category_id_new UUID;

-- Create a function to safely handle the migration
DO $$ 
DECLARE
  budget_record RECORD;
BEGIN
  -- For each budget, try to find the matching category and update the new column
  FOR budget_record IN SELECT * FROM budgets LOOP
    -- Try to find the category by ID first (in case it's already a valid UUID)
    BEGIN
      UPDATE budgets 
      SET category_id_new = budget_record.category::uuid 
      WHERE id = budget_record.id;
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, try to find the category by name
      UPDATE budgets b
      SET category_id_new = c.id
      FROM categories c
      WHERE b.id = budget_record.id
      AND c.name = budget_record.category;
    END;
  END LOOP;
END $$;

-- Drop the old column
ALTER TABLE budgets 
DROP COLUMN category;

-- Make the new column required and rename it
ALTER TABLE budgets 
ALTER COLUMN category_id_new SET NOT NULL;

ALTER TABLE budgets 
RENAME COLUMN category_id_new TO category_id;

-- Add foreign key constraint
ALTER TABLE budgets
ADD CONSTRAINT budgets_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id)
ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS budgets_category_id_idx ON budgets(category_id);