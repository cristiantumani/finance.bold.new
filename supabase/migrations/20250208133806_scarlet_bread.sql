/*
  # Add expense type to transactions

  1. Changes
    - Add expense_type column to transactions table
    - Add check constraint to ensure valid expense types
    - Make expense_type nullable since it's only relevant for expenses
*/

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS expense_type TEXT CHECK (expense_type IN ('fixed', 'variable', 'controllable_fixed'));