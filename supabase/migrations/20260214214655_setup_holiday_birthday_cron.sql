/*
  # Setup Holiday & Birthday Greetings Cron Job

  1. Changes
    - Adds a daily cron job to check for holidays and user birthdays
    - Runs every day at 7:00 AM WAT (6:00 AM UTC)
    - Sends personalized greetings for public holidays (Nigerian, Christian, Muslim)
    - Sends birthday wishes to users whose birthday matches the current date

  2. Important Notes
    - Uses pg_cron and pg_net extensions (already enabled)
    - Function handles deduplication so messages are never sent twice on the same day
*/

SELECT cron.schedule(
  'holiday-birthday-greetings',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/holiday-birthday-greetings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);