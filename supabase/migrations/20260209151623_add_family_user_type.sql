/*
  # Add Family User Type

  1. Changes
    - Update user_type constraint to include 'family' as a valid option
    - This allows users to select "family/group" as their path during signup

  2. Notes
    - Existing users with 'individual' or 'organization' types remain unaffected
    - The family path enables users to create and manage family/group farming activities
*/

-- Drop the old constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'user_profiles' 
    AND constraint_name = 'user_profiles_user_type_check'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_type_check;
  END IF;
END $$;

-- Add new constraint with family type included
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_type_check 
CHECK (user_type IN ('individual', 'organization', 'family'));