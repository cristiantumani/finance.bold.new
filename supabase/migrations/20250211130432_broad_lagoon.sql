-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create cron job to process notifications
SELECT cron.schedule(
  'process-feedback-notifications',  -- name of the cron job
  '* * * * *',                      -- run every minute
  $$
  SELECT
    CASE
      WHEN status >= 200 AND status < 300 THEN true
      ELSE false
    END as success
  FROM 
    net.http_get(
      url := current_setting('app.settings.edge_function_url') || '/process-notifications'
    ) AS t;
  $$
);