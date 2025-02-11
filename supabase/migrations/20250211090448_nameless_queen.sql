-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for authenticated users only"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for reading analytics (admin only)
CREATE POLICY "Enable read for service role only"
  ON analytics_events
  FOR SELECT
  TO service_role
  USING (true);

-- Create helper functions for analytics
CREATE OR REPLACE FUNCTION get_daily_active_users(start_date DATE, end_date DATE)
RETURNS TABLE (date DATE, active_users BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('day', created_at)::DATE,
    COUNT(DISTINCT user_id)
  FROM analytics_events
  WHERE created_at >= start_date
  AND created_at < end_date + INTERVAL '1 day'
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_event_counts(start_date DATE, end_date DATE)
RETURNS TABLE (event_name TEXT, event_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    analytics_events.event_name,
    COUNT(*)
  FROM analytics_events
  WHERE created_at >= start_date
  AND created_at < end_date + INTERVAL '1 day'
  GROUP BY event_name
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_retention(cohort_date DATE)
RETURNS TABLE (
  days_since_signup INTEGER,
  users_count BIGINT,
  retention_rate NUMERIC
) AS $$
DECLARE
  total_users BIGINT;
BEGIN
  -- Get total users who signed up on cohort_date
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM analytics_events
  WHERE event_name = 'sign_up'
  AND DATE_TRUNC('day', created_at)::DATE = cohort_date;

  RETURN QUERY
  WITH user_activity AS (
    SELECT
      user_id,
      (DATE_TRUNC('day', created_at)::DATE - cohort_date) AS days_since_signup
    FROM analytics_events
    WHERE user_id IN (
      SELECT DISTINCT user_id
      FROM analytics_events
      WHERE event_name = 'sign_up'
      AND DATE_TRUNC('day', created_at)::DATE = cohort_date
    )
    AND created_at >= cohort_date
    AND created_at < cohort_date + INTERVAL '30 days'
  )
  SELECT
    days_since_signup::INTEGER,
    COUNT(DISTINCT user_id) AS users_count,
    ROUND((COUNT(DISTINCT user_id)::NUMERIC / total_users) * 100, 2) AS retention_rate
  FROM user_activity
  GROUP BY days_since_signup
  ORDER BY days_since_signup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;