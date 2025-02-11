/*
  # GDPR Consent Management System

  1. New Tables
    - `user_consents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `consent_type` (text)
      - `consented` (boolean)
      - `ip_address` (text)
      - `user_agent` (text)
      - `consented_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_consents` table
    - Add policies for authenticated users
    - Add audit logging
*/

-- Create user_consents table
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consented BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

-- Create consent types enum
DO $$ BEGIN
  CREATE TYPE consent_type AS ENUM (
    'analytics',
    'marketing',
    'essential',
    'third_party'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add consent type validation
ALTER TABLE user_consents
ADD CONSTRAINT valid_consent_type
CHECK (consent_type::consent_type IN ('analytics', 'marketing', 'essential', 'third_party'));

-- Enable RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own consents"
  ON user_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON user_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
  ON user_consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_consents_updated_at();

-- Create consent audit log
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Create audit log trigger
CREATE OR REPLACE FUNCTION log_consent_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consent_audit_log (
    user_id,
    consent_type,
    old_value,
    new_value,
    ip_address,
    user_agent
  ) VALUES (
    NEW.user_id,
    NEW.consent_type,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.consented ELSE NULL END,
    NEW.consented,
    NEW.ip_address,
    NEW.user_agent
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_consent_changes
  AFTER INSERT OR UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_changes();

-- Create indexes
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_consent_audit_user_id ON consent_audit_log(user_id);
CREATE INDEX idx_consent_audit_created_at ON consent_audit_log(created_at);