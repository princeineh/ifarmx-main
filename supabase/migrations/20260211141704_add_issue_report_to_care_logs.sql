/*
  # Add issue reporting to care logs

  1. Modified Tables
    - `care_logs`
      - Added `issue_report` (text, nullable) - allows users to report plant issues like pests, disease, wilting etc.

  2. Notes
    - The `notes` column is kept for backward compatibility but the UI will now use `issue_report` instead
    - This enables farmers to flag problems that need attention
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_logs' AND column_name = 'issue_report'
  ) THEN
    ALTER TABLE care_logs ADD COLUMN issue_report text;
  END IF;
END $$;
