/*
  # Add Collaboration Invite Notification

  1. Changes
    - Add trigger to queue notification when collaboration invite is created
    - Ensure notification is sent via notification queue system
*/

-- Create trigger function for collaboration invites
CREATE OR REPLACE FUNCTION queue_collaboration_invite_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue the notification
  INSERT INTO notification_queue (
    type,
    payload
  ) VALUES (
    'collaboration_invite',
    jsonb_build_object(
      'invite_id', NEW.id,
      'email', NEW.email,
      'token', NEW.token,
      'permission_level', NEW.permission_level,
      'expires_at', NEW.expires_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS queue_collaboration_invite_notification ON collaboration_invites;

-- Create trigger
CREATE TRIGGER queue_collaboration_invite_notification
  AFTER INSERT ON collaboration_invites
  FOR EACH ROW
  EXECUTE FUNCTION queue_collaboration_invite_notification();

-- Ensure notification_queue has proper RLS policy for the trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_queue' 
    AND policyname = 'Enable insert for service role'
  ) THEN
    CREATE POLICY "Enable insert for service role"
      ON notification_queue
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;