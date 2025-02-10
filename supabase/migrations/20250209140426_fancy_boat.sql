/*
  # Add missing RLS policies

  1. Changes
    - Add INSERT policies for transaction_patterns table
    - Add INSERT policies for ai_suggestions table
    - Add UPDATE policies for transaction_patterns table
    
  2. Security
    - Ensures users can only insert/update their own patterns and suggestions
*/

-- Add INSERT policy for transaction_patterns
CREATE POLICY "Users can insert their own patterns"
  ON transaction_patterns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for transaction_patterns
CREATE POLICY "Users can update their own patterns"
  ON transaction_patterns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for ai_suggestions
CREATE POLICY "System can insert suggestions"
  ON ai_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for ai_suggestions
CREATE POLICY "Users can update their own suggestions"
  ON ai_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);