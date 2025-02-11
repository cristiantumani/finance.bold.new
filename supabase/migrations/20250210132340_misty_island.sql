-- Ensure proper RLS policies for auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to update their own records
CREATE POLICY "Users can update own record"
  ON auth.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy to allow users to read their own records
CREATE POLICY "Users can read own record"
  ON auth.users
  FOR SELECT
  USING (auth.uid() = id);

-- Ensure default categories are created for new users
CREATE OR REPLACE FUNCTION initialize_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Fixed expenses
  INSERT INTO categories (user_id, name, expense_type, income_category) VALUES
    (NEW.id, 'Rent/Mortgage', 'fixed', false),
    (NEW.id, 'Loan Payments', 'fixed', false),
    (NEW.id, 'Insurance', 'fixed', false);

  -- Variable expenses
  INSERT INTO categories (user_id, name, expense_type, income_category) VALUES
    (NEW.id, 'Groceries', 'variable', false),
    (NEW.id, 'Entertainment', 'variable', false),
    (NEW.id, 'Dining Out', 'variable', false),
    (NEW.id, 'Shopping', 'variable', false);

  -- Controllable fixed expenses
  INSERT INTO categories (user_id, name, expense_type, income_category) VALUES
    (NEW.id, 'Utilities', 'controllable_fixed', false),
    (NEW.id, 'Phone Plan', 'controllable_fixed', false),
    (NEW.id, 'Transportation', 'controllable_fixed', false),
    (NEW.id, 'Gym Membership', 'controllable_fixed', false);

  -- Income categories
  INSERT INTO categories (user_id, name, income_category) VALUES
    (NEW.id, 'Salary', true),
    (NEW.id, 'Investment', true),
    (NEW.id, 'Freelance', true),
    (NEW.id, 'Other Income', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_default_categories();