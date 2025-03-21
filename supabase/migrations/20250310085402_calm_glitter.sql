/*
  # Add Email Verification System

  1. New Tables
    - `verification_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `verified_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `verification_tokens` table
    - Add policy for authenticated users to read their own tokens
    - Add policy for service role to manage tokens

  3. Functions
    - Create function to clean up expired tokens and unverified accounts
*/

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

-- Enable RLS
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own tokens"
  ON verification_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage tokens"
  ON verification_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to clean up expired tokens and unverified accounts
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired tokens
  DELETE FROM verification_tokens
  WHERE expires_at < now() AND verified_at IS NULL;

  -- Delete unverified users after 24 hours
  DELETE FROM auth.users
  WHERE id IN (
    SELECT user_id 
    FROM verification_tokens 
    WHERE created_at < now() - interval '24 hours' 
    AND verified_at IS NULL
  );
END;
$$;

-- Create a scheduled task to run cleanup every hour
SELECT cron.schedule(
  'cleanup-expired-verifications',
  '0 * * * *', -- Every hour
  'SELECT cleanup_expired_verifications()'
);

-- Create index for faster lookups
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);