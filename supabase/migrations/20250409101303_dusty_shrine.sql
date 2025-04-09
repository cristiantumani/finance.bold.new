/*
  # Remove Default Categories System

  1. Changes
    - Drop existing trigger for default categories
    - Drop function that creates default categories
    - Remove automatic category creation on user signup
    
  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS initialize_default_categories();
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a new, simplified handler for new users (without default categories)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- No default categories are created
  -- This function exists as a placeholder for future user initialization needs
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger that doesn't create default categories
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();