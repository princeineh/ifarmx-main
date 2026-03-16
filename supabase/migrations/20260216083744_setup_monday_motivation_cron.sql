/*
  # Set up Monday Motivation cron job

  1. Purpose
    - Send inspiring and motivational messages to all users every Monday
    - Boost engagement and community spirit at the start of each week

  2. Cron Job
    - `monday-motivation`: Runs every Monday at 6:00 AM UTC (7 AM WAT)
    - Calls the `monday-motivation` edge function via pg_net HTTP POST
    - Sends different motivations based on user status:
      * Active farmers with plants get farming-focused motivation
      * Users with reservations get journey preparation messages
      * All other users get universal community motivation

  3. User Targeting
    - All users except organizations
    - Personalized with user's display name or farm name
    - Prevents duplicate sends on the same day

  4. Notes
    - The edge function only runs on Mondays (day check in function)
    - Inserts into the `notifications` table
    - The existing trigger `on_notification_created_send_email` fires emails
    - Batch processing for large user bases (500 users per batch)
*/

SELECT cron.schedule(
  'monday-motivation',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/monday-motivation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
