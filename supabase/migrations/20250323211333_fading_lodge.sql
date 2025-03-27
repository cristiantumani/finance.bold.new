/*
  # Add Permission Management System

  1. New Tables
    - `account_permissions`
      - `id` (uuid, primary key)
      - `account_owner_id` (uuid, references auth.users)
      - `collaborator_id` (uuid, references auth.users)
      - `permission_level` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `collaboration_invites`
      - `id` (uuid, primary key)
      - `account_owner_id` (uuid, references auth.users)
      - `email` (text)
      - `permission_level` (text)
      - `token` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `accepted_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for account owners and collaborators
*/

-- Create account_permissions table
CREATE TABLE IF NOT EXISTS account_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('full_access', 'view_only')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_owner_id, collaborator_id)
);

-- Create collaboration_invites table
CREATE TABLE IF NOT EXISTS collaboration_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('full_access', 'view_only')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(account_owner_id, email)
);

-- Enable RLS
ALTER TABLE account_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invites ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for account_permissions
CREATE TRIGGER update_account_permissions_updated_at
  BEFORE UPDATE ON account_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for account_permissions
CREATE POLICY "Account owners can manage permissions"
  ON account_permissions
  FOR ALL
  TO authenticated
  USING (auth.uid() = account_owner_id)
  WITH CHECK (auth.uid() = account_owner_id);

CREATE POLICY "Collaborators can view permissions"
  ON account_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = collaborator_id);

-- Create RLS policies for collaboration_invites
CREATE POLICY "Account owners can manage invites"
  ON collaboration_invites
  FOR ALL
  TO authenticated
  USING (auth.uid() = account_owner_id)
  WITH CHECK (auth.uid() = account_owner_id);

-- Create function to send collaboration invite
CREATE OR REPLACE FUNCTION send_collaboration_invite(
  p_email TEXT,
  p_permission_level TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_invite_id UUID;
BEGIN
  -- Validate permission level
  IF p_permission_level NOT IN ('full_access', 'view_only') THEN
    RAISE EXCEPTION 'Invalid permission level';
  END IF;

  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Create invite
  INSERT INTO collaboration_invites (
    account_owner_id,
    email,
    permission_level,
    token,
    expires_at
  ) VALUES (
    auth.uid(),
    p_email,
    p_permission_level,
    v_token,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_invite_id;

  -- The email will be sent via Resend's database trigger

  RETURN v_invite_id;
END;
$$;

-- Create function to accept collaboration invite
CREATE OR REPLACE FUNCTION accept_collaboration_invite(
  p_token TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite collaboration_invites;
  v_user_id UUID;
BEGIN
  -- Get and validate invite
  SELECT * INTO v_invite
  FROM collaboration_invites
  WHERE token = p_token
  AND accepted_at IS NULL
  AND expires_at > NOW();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_invite.email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create permission
  INSERT INTO account_permissions (
    account_owner_id,
    collaborator_id,
    permission_level
  ) VALUES (
    v_invite.account_owner_id,
    v_user_id,
    v_invite.permission_level
  );

  -- Mark invite as accepted
  UPDATE collaboration_invites
  SET accepted_at = NOW()
  WHERE token = p_token;
END;
$$;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_account_owner_id UUID
)
RETURNS TABLE (
  permission_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return 'owner' if user is the account owner
  IF auth.uid() = p_account_owner_id THEN
    RETURN QUERY SELECT 'owner'::TEXT;
    RETURN;
  END IF;

  -- Return collaborator permission level if exists
  RETURN QUERY
  SELECT ap.permission_level
  FROM account_permissions ap
  WHERE ap.account_owner_id = p_account_owner_id
  AND ap.collaborator_id = auth.uid();

  RETURN;
END;
$$;

-- Create indexes
CREATE INDEX idx_account_permissions_owner ON account_permissions(account_owner_id);
CREATE INDEX idx_account_permissions_collaborator ON account_permissions(collaborator_id);
CREATE INDEX idx_collaboration_invites_owner ON collaboration_invites(account_owner_id);
CREATE INDEX idx_collaboration_invites_token ON collaboration_invites(token);

-- Create function to revoke collaborator access
CREATE OR REPLACE FUNCTION revoke_collaborator_access(
  p_collaborator_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM account_permissions
  WHERE account_owner_id = auth.uid()
  AND collaborator_id = p_collaborator_id;
END;
$$;

-- Create function to update collaborator permission level
CREATE OR REPLACE FUNCTION update_collaborator_permission(
  p_collaborator_id UUID,
  p_permission_level TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate permission level
  IF p_permission_level NOT IN ('full_access', 'view_only') THEN
    RAISE EXCEPTION 'Invalid permission level';
  END IF;

  UPDATE account_permissions
  SET permission_level = p_permission_level
  WHERE account_owner_id = auth.uid()
  AND collaborator_id = p_collaborator_id;
END;
$$;