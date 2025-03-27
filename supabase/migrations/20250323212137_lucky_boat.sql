/*
  # Set up Email Notification System
  
  1. New Tables
    - notification_queue for tracking email notifications
    
  2. Security
    - RLS policies for secure access
    - Service role permissions for Edge Functions
*/

-- Create notification queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable insert for service role" ON notification_queue;
  DROP POLICY IF EXISTS "Service role can manage notification queue" ON notification_queue;

  -- Create new policies
  CREATE POLICY "Enable insert for service role"
    ON notification_queue
    FOR INSERT
    TO service_role
    WITH CHECK (true);

  CREATE POLICY "Service role can manage notification queue"
    ON notification_queue
    FOR ALL
    TO service_role
    USING (true);
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_processed ON notification_queue(processed) WHERE NOT processed;
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON notification_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(type);