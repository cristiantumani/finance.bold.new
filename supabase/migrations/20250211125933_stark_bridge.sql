/*
  # Fix Feedback Email Notifications

  1. Changes
    - Remove direct email sending from database trigger
    - Add notification queue table for Edge Function processing
    - Update trigger to use queue table instead of direct email sending
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS send_feedback_notification ON user_feedback;
DROP FUNCTION IF EXISTS handle_feedback_notification();

-- Create notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS on notification queue
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification queue
CREATE POLICY "Service role can manage notification queue"
  ON notification_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to queue feedback notifications
CREATE OR REPLACE FUNCTION queue_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Queue the notification
  INSERT INTO notification_queue (type, payload)
  VALUES (
    'feedback_notification',
    jsonb_build_object(
      'feedback_id', NEW.id,
      'user_id', NEW.user_id,
      'user_email', user_email,
      'type', NEW.type,
      'satisfaction', COALESCE(NEW.satisfaction, 'Not specified'),
      'message', NEW.message,
      'url', COALESCE(NEW.url, 'Not specified'),
      'user_agent', COALESCE(NEW.user_agent, 'Not specified'),
      'created_at', NEW.created_at,
      'notification_email', 'cristiantumani@gmail.com'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for queueing notifications
CREATE TRIGGER queue_feedback_notification
  AFTER INSERT ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION queue_feedback_notification();

-- Create indexes for notification queue
CREATE INDEX idx_notification_queue_type ON notification_queue(type);
CREATE INDEX idx_notification_queue_processed ON notification_queue(processed) WHERE NOT processed;
CREATE INDEX idx_notification_queue_created_at ON notification_queue(created_at);