/*
  # Add income categories

  1. New Categories
    - Add default income categories with a special income_category flag
    - Categories: Salary, Investment, Freelance, Other Income

  2. Changes
    - Add income_category boolean flag to categories table
    - Add default income categories for all existing users
    - Add trigger to create income categories for new users

  3. Security
    - Maintain existing RLS policies
*/

-- Add income_category flag to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS income_category BOOLEAN DEFAULT false;

-- Function to create income categories for a user
CREATE OR REPLACE FUNCTION create_income_categories(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Create income categories
  INSERT INTO categories (user_id, name, income_category)
  VALUES
    (user_uuid, 'Salary', true),
    (user_uuid, 'Investment', true),
    (user_uuid, 'Freelance', true),
    (user_uuid, 'Other Income', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create income categories for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_income_categories(user_record.id);
  END LOOP;
END $$;

-- Update user creation trigger to include income categories
CREATE OR REPLACE FUNCTION initialize_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Fixed expenses
  INSERT INTO categories (user_id, name, expense_type) VALUES
    (NEW.id, 'Rent/Mortgage', 'fixed'),
    (NEW.id, 'Loan Payments', 'fixed'),
    (NEW.id, 'Insurance', 'fixed');

  -- Variable expenses
  INSERT INTO categories (user_id, name, expense_type) VALUES
    (NEW.id, 'Groceries', 'variable'),
    (NEW.id, 'Entertainment', 'variable'),
    (NEW.id, 'Dining Out', 'variable'),
    (NEW.id, 'Shopping', 'variable');

  -- Controllable fixed expenses
  INSERT INTO categories (user_id, name, expense_type) VALUES
    (NEW.id, 'Utilities', 'controllable_fixed'),
    (NEW.id, 'Phone Plan', 'controllable_fixed'),
    (NEW.id, 'Transportation', 'controllable_fixed'),
    (NEW.id, 'Gym Membership', 'controllable_fixed');

  -- Income categories
  PERFORM create_income_categories(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;