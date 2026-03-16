/*
  # Add foreign key from program_participants to user_profiles

  1. Changes
    - Add FK from `program_participants.user_id` to `user_profiles.id`
    - This enables Supabase PostgREST to resolve the join 
      `program_participants -> user_profiles` which the Participant Monitor uses

  2. Notes
    - Without this FK, the `!inner` join in the monitor query silently 
      returns empty results because PostgREST cannot resolve the relationship
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'program_participants_user_id_fkey_profiles'
    AND table_name = 'program_participants'
  ) THEN
    ALTER TABLE program_participants
      ADD CONSTRAINT program_participants_user_id_fkey_profiles
      FOREIGN KEY (user_id) REFERENCES user_profiles(id);
  END IF;
END $$;
