/*
  # Add Plaid Integration Support

  1. New Tables
    - `plaid_items`
      - Stores Plaid access tokens and item IDs
      - Links bank accounts to users
      
  2. Changes
    - Add plaid_transaction_id to transactions table
    - Add unique constraint for Plaid transaction IDs
    
  3. Security
    - Enable RLS on plaid_items table
    - Add policies for authenticated users
*/

-- Create plaid_items table
CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  institution_id TEXT,
  institution_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Add plaid_transaction_id to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE;

-- Enable RLS
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own Plaid items"
  ON plaid_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_plaid_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plaid_items_updated_at
  BEFORE UPDATE ON plaid_items
  FOR EACH ROW
  EXECUTE FUNCTION update_plaid_items_updated_at();

-- Create indexes
CREATE INDEX idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX idx_plaid_items_item_id ON plaid_items(item_id);
CREATE INDEX idx_transactions_plaid_id ON transactions(plaid_transaction_id);