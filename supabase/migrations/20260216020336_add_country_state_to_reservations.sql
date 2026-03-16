/*
  # Add Country and State to Reservations

  1. Modified Tables
    - `reservations`
      - `country` (text, default 'Nigeria') - User's country
      - `state` (text, nullable) - User's state or region

  2. Notes
    - Allows tracking where reservations come from globally
    - Defaults to Nigeria for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'country'
  ) THEN
    ALTER TABLE reservations ADD COLUMN country text NOT NULL DEFAULT 'Nigeria';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'state'
  ) THEN
    ALTER TABLE reservations ADD COLUMN state text;
  END IF;
END $$;
