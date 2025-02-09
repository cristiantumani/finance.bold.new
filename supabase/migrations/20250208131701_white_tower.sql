/*
  # Add categories management

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `expense_type` (text)
      - `created_at` (timestamptz)

  2. Changes
    - Add foreign key to transactions table referencing categories
    - Add default categories for all users
    - Update transactions table to use category_id

  3. Security
    - Enable RLS on categories table
    - Add policies for authenticated users to manage their categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable', 'controllable_fixed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Add category_id to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Users can create their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to initialize default categories
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_default_categories();

-- Create indexes
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON transactions(category_id);