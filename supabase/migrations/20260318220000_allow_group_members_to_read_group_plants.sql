-- Allow all linked members of a group to read that group's plants.
-- This enables the family FarmStatsBoard to show everyone's stats correctly,
-- since group plants belong to the head's user_id but need to be visible
-- to all approved members.

CREATE OR REPLACE FUNCTION auth_user_farming_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT group_id FROM group_members WHERE linked_user_id = (SELECT auth.uid());
$$;

CREATE POLICY "Group members can view all plants in their group"
  ON plants FOR SELECT
  TO authenticated
  USING (
    farming_group_id IS NOT NULL
    AND farming_group_id IN (SELECT auth_user_farming_group_ids())
  );
