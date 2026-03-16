/*
  # Setup Auth User Created Trigger
  
  This creates a trigger that automatically calls the auth-user-created edge function
  when a new user is created in the auth.users table. This ensures that user profiles
  are automatically created for all new users, whether they sign up via email or OAuth.
  
  Changes:
  - Enable pg_net extension for HTTP requests from the database
  - Create trigger function to call the edge function
  - Create trigger on auth.users table
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create or replace the function that calls the edge function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  response_body jsonb;
BEGIN
  -- Call the edge function with the new user data
  SELECT content INTO response_body FROM http((
    'POST',
    (SELECT (current_setting('app.settings'::text, true) -> 'supabase_url')::text || '/functions/v1/auth-user-created'),
    ARRAY[http_header('Content-Type', 'application/json'), http_header('Authorization', 'Bearer ' || current_setting('app.settings'::text, true) ->> 'service_role_key')],
    'application/json',
    jsonb_build_object('record', row_to_json(NEW))::text
  )::http_response);

  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
