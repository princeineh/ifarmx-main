/*
  # Allow admins to insert kit codes

  1. Security Changes
    - Add INSERT policy on `kit_codes` for admin users
    - This enables the admin approval and delivery workflows to generate activation codes

  2. Important Notes
    - Admins generate codes when marking individual/family orders as delivered
    - Admins generate codes when approving organization orders
*/

CREATE POLICY "Admins can insert kit codes"
  ON kit_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
