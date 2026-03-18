-- Fix: allow the invited user to claim (mark as used) their own invite.
-- Previously only the group HEAD could UPDATE family_invites, so the
-- claim step in handleConfirmJoin was silently blocked, which in turn
-- also blocked the group_members INSERT (which checks for a used invite).

CREATE POLICY "Invited user can claim their invite"
  ON family_invites FOR UPDATE
  TO authenticated
  USING (
    -- The invite must be unclaimed and not expired
    used_by_user_id IS NULL
    AND expires_at > now()
  )
  WITH CHECK (
    -- The caller can only set used_by_user_id to themselves
    used_by_user_id = auth.uid()
  );
