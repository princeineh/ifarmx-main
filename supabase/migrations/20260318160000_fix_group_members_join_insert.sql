-- Fix: allow a user to insert themselves into group_members when they have
-- a valid (already-used-by-them) invite — this is what was blocking joined
-- members from ever appearing in the family dashboard.

CREATE POLICY "Users can join a group via valid invite"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- The row being inserted must link to the caller
    linked_user_id = auth.uid()
    -- And there must be an invite they have already claimed
    AND EXISTS (
      SELECT 1 FROM family_invites fi
      WHERE fi.group_id = group_members.group_id
        AND fi.used_by_user_id = auth.uid()
    )
  );
