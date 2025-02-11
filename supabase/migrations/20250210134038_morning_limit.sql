-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default categories for the new user
  INSERT INTO public.categories (user_id, name, expense_type, income_category)
  VALUES
    -- Fixed expenses
    (NEW.id, 'Rent/Mortgage', 'fixed', false),
    (NEW.id, 'Loan Payments', 'fixed', false),
    (NEW.id, 'Insurance', 'fixed', false),
    -- Variable expenses
    (NEW.id, 'Groceries', 'variable', false),
    (NEW.id, 'Entertainment', 'variable', false),
    (NEW.id, 'Dining Out', 'variable', false),
    (NEW.id, 'Shopping', 'variable', false),
    -- Controllable fixed expenses
    (NEW.id, 'Utilities', 'controllable_fixed', false),
    (NEW.id, 'Phone Plan', 'controllable_fixed', false),
    (NEW.id, 'Transportation', 'controllable_fixed', false),
    (NEW.id, 'Gym Membership', 'controllable_fixed', false),
    -- Income categories
    (NEW.id, 'Salary', null, true),
    (NEW.id, 'Investment', null, true),
    (NEW.id, 'Freelance', null, true),
    (NEW.id, 'Other Income', null, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policies for auth.users if they don't exist
DO $$ 
BEGIN
  -- Users can read their own record
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'auth' 
    AND policyname = 'Users can read own record'
  ) THEN
    CREATE POLICY "Users can read own record"
      ON auth.users
      FOR SELECT
      USING (auth.uid() = id);
  END IF;

  -- Users can update their own record
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'auth' 
    AND policyname = 'Users can update own record'
  ) THEN
    CREATE POLICY "Users can update own record"
      ON auth.users
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;