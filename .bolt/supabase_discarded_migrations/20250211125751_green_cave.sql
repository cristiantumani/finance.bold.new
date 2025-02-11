/*
  # Add Feedback Email Notifications

  1. New Functions
    - `handle_feedback_notification`: Sends email notification when new feedback is submitted

  2. New Triggers
    - Trigger to call notification function after feedback insertion
*/

-- Create the notification handler function
CREATE OR REPLACE FUNCTION handle_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  feedback_type TEXT;
  satisfaction_status TEXT;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Format feedback type for email
  feedback_type := INITCAP(NEW.type);
  
  -- Format satisfaction status
  satisfaction_status := CASE 
    WHEN NEW.satisfaction IS NULL THEN 'Not specified'
    ELSE INITCAP(NEW.satisfaction)
  END;

  -- Send the email using Supabase's built-in email function
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer re_123...', -- Replace with actual Resend API key
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Financial App <notifications@yourdomain.com>',
      'to', 'ctumani@gmail.com',
      'subject', 'New Feedback Received: ' || feedback_type,
      'html', format(
        '<h2>New Feedback Received</h2>
        <p><strong>Type:</strong> %s</p>
        <p><strong>Satisfaction:</strong> %s</p>
        <p><strong>Message:</strong> %s</p>
        <p><strong>URL:</strong> %s</p>
        <p><strong>User Email:</strong> %s</p>
        <p><strong>User Agent:</strong> %s</p>
        <p><strong>Submitted At:</strong> %s</p>',
        feedback_type,
        satisfaction_status,
        NEW.message,
        COALESCE(NEW.url, 'Not specified'),
        user_email,
        COALESCE(NEW.user_agent, 'Not specified'),
        NEW.created_at
      )
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER send_feedback_notification
  AFTER INSERT ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION handle_feedback_notification();