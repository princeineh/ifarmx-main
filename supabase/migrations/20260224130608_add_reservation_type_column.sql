/*
  # Add reservation_type to reservations table

  ## Changes
  - Adds `reservation_type` column to `reservations` table
    - Values: 'test_run' (default) or 'reserve'
    - Defaults to 'test_run' since the platform is in test run phase until April 1

  ## Notes
  - All existing reservations will default to 'test_run'
  - No data is lost
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'reservation_type'
  ) THEN
    ALTER TABLE reservations ADD COLUMN reservation_type text NOT NULL DEFAULT 'test_run';
  END IF;
END $$;
