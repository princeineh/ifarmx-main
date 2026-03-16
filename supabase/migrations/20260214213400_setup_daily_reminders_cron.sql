/*
  # Set up daily reminders cron job

  1. Extensions
    - Enable `pg_cron` for scheduled job execution

  2. Cron Job
    - `daily-farming-reminders`: Runs every day at 7:00 AM UTC (8 AM WAT)
    - Calls the `daily-reminders` edge function via pg_net HTTP POST
    - Sends care log reminders, appreciation emails, kit activation nudges,
      profile completion reminders, and kit verification reminders

  3. Notes
    - The edge function inserts into the `notifications` table
    - The existing trigger `on_notification_created_send_email` fires the email
    - Duplicate prevention: the function checks if a reminder was already sent today
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

SELECT cron.schedule(
  'daily-farming-reminders',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
