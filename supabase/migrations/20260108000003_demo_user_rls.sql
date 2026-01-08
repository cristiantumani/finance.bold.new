/*
  # Add RLS policies for demo user

  1. Changes
    - Add SELECT policies for demo user on all tables
    - Demo user can read but not write (enforced at app level)

  2. Security
    - Only affects the specific demo user ID
    - Read-only access
*/

-- Allow public SELECT access for demo user on transactions
CREATE POLICY "Demo user can view demo transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Allow public SELECT access for demo user on categories
CREATE POLICY "Demo user can view demo categories"
  ON categories
  FOR SELECT
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Allow public SELECT access for demo user on budgets
CREATE POLICY "Demo user can view demo budgets"
  ON budgets
  FOR SELECT
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Allow public SELECT access for demo user profile
CREATE POLICY "Demo user can view demo profile"
  ON user_profiles
  FOR SELECT
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000001');
