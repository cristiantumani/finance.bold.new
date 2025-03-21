/*
  # Email Verification System

  1. New Tables
    - verification_tokens
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - token (text, unique)
      - expires_at (timestamptz)
      - created_at (timestamptz)
      - verified_at (timestamptz)

  2. Functions
    - create_verification_token: Creates a new verification token
    - verify_email: Verifies an email using a token
    - resend_verification: Resends verification email
    - cleanup_expired_verifications: Removes expired tokens and unverified accounts

  3. Security
    - RLS policies for verification_tokens table
    - Service role access for token management
*/

-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS create_verification_token CASCADE;
DROP FUNCTION IF EXISTS verify_email CASCADE;
DROP FUNCTION IF EXISTS resend_verification CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_verifications CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;

-- Create verification_tokens table
CREATE TABLE verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

-- Enable RLS
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create RPC function to create verification token
CREATE OR REPLACE FUNCTION create_verification_token(
  p_user_id uuid,
  p_token text,
  p_expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO verification_tokens (user_id, token, expires_at)
  VALUES (p_user_id, p_token, p_expires_at);
END;
$$;

-- Create RPC function to verify email
CREATE OR REPLACE FUNCTION verify_email(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get and validate token
  SELECT user_id INTO v_user_id
  FROM verification_tokens
  WHERE token = p_token
    AND verified_at IS NULL
    AND expires_at > now();
    
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired verification token';
  END IF;

  -- Mark token as verified
  UPDATE verification_tokens
  SET verified_at = now()
  WHERE token = p_token;

  -- Update user's email verification status
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = v_user_id;
END;
$$;

-- Create RPC function to resend verification
CREATE OR REPLACE FUNCTION resend_verification(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_token text;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email AND email_confirmed_at IS NULL;
    
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found or already verified';
  END IF;

  -- Generate new token
  v_token := gen_random_uuid()::text;

  -- Insert new verification token
  INSERT INTO verification_tokens (user_id, token, expires_at)
  VALUES (v_user_id, v_token, now() + interval '24 hours');
END;
$$;

-- Create function to clean up expired verifications
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create policies
CREATE POLICY "Service role can manage tokens"
  ON verification_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);

-- Schedule cleanup job (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-expired-verifications',
  '0 * * * *', -- Every hour
  $$SELECT cleanup_expired_verifications()$$
);