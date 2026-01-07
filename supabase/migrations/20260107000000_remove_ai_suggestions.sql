/*
  # Remove AI Suggestions functionality

  1. Changes
    - Drop trigger that generates AI suggestions on transaction insert
    - Drop function that generates transaction insights
    - Clean up any remaining AI suggestions references

  2. Security
    - No security changes
*/

-- Drop the trigger
DROP TRIGGER IF EXISTS generate_insights_trigger ON transactions;

-- Drop the function
DROP FUNCTION IF EXISTS generate_transaction_insights();

-- Drop the ai_suggestions table if it still exists (in case it wasn't fully deleted)
DROP TABLE IF EXISTS ai_suggestions CASCADE;
