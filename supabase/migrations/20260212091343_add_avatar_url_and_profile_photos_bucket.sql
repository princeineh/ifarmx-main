/*
  # Add Profile Photos Support

  1. Modified Tables
    - `user_profiles`
      - Added `avatar_url` (text, nullable) - stores the public URL of the user's profile photo

  2. Storage
    - Created `profile-photos` bucket for storing user avatar images
    - Public bucket so profile photos can be viewed by organization admins

  3. Security
    - Users can upload/update/delete only their own profile photos (path must start with their user ID)
    - Anyone authenticated can view profile photos (needed for organization monitoring)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own profile photo' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload own profile photo"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile photo' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update own profile photo"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own profile photo' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete own profile photo"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view profile photos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can view profile photos"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'profile-photos');
  END IF;
END $$;
