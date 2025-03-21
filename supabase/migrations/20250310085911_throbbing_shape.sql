/*
  # Add Verification Helper Functions

  1. Functions
    - create_verification_token: Creates a new verification token
    - verify_email: Verifies an email using a token
    - resend_verification: Resends verification email
*/

-- Function to create a verification token
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

-- Function to verify email
CREATE OR REPLACE FUNCTION verify_email(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token verification_tokens;
BEGIN
  -- Get and validate token
  SELECT * INTO v_token
  FROM verification_tokens
  WHERE token = p_token;

  IF v_token IS NULL THEN
    RAISE EXCEPTION 'Invalid verification token';
  END IF;

  IF v_token.verified_at IS NOT NULL THEN
    RAISE EXCEPTION 'Email already verified';
  END IF;

  IF v_token.expires_at < now() THEN
    RAISE EXCEPTION 'Verification link expired';
  END IF;

  -- Mark token as verified
  UPDATE verification_tokens
  SET verified_at = now()
  WHERE token = p_token;
END;
$$;

-- Function to resend verification
CREATE OR REPLACE FUNCTION resend_verification(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Delete existing unverified token if any
  DELETE FROM verification_tokens
  WHERE user_id = v_user_id
  AND verified_at IS NULL;

  -- Create new token
  INSERT INTO verification_tokens (user_id, token, expires_at)
  VALUES (
    v_user_id,
    gen_random_uuid()::text,
    now() + interval '24 hours'
  );
END;
$$;