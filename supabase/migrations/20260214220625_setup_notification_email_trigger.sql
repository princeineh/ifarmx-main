/*
  # Auto-send email on notification insert

  1. Changes
    - Creates a trigger function that calls the send-notification-email edge function
      via pg_net whenever a new notification is inserted
    - Uses the existing pg_net extension for async HTTP calls
    - Adds an `email_sent` column to notifications if not present

  2. Security
    - Trigger function uses SECURITY DEFINER to ensure it runs with proper permissions
    - Only fires on INSERT (not UPDATE/DELETE)

  3. Important Notes
    - The edge function has verify_jwt=false so pg_net can call it directly
    - pg_net makes async calls so it won't block notification inserts
    - The edge function handles looking up user email and sending via Resend
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE notifications ADD COLUMN email_sent boolean DEFAULT false;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_notification_email()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://kbhuzdhyuzcdsouthzoo.supabase.co/functions/v1/send-notification-email',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id::text,
        'user_id', NEW.user_id::text,
        'type', NEW.type,
        'title', NEW.title,
        'message', NEW.message
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_created ON notifications;

CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notification_email();
