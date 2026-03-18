-- Fix infinite recursion in farming_groups / group_members RLS policies

-- Drop the recursive policies added in the previous migration
DROP POLICY IF EXISTS "Head and linked members can view their group" ON farming_groups;
DROP POLICY IF EXISTS "Linked members can view group members" ON group_members;

-- SECURITY DEFINER function: checks if the current user is a linked member of a group
-- Runs as the function owner (bypasses RLS on group_members), breaking the recursion cycle
CREATE OR REPLACE FUNCTION auth_user_is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND linked_user_id = (SELECT auth.uid())
  );
$$;

-- farming_groups: allow head_user_id and linked members to SELECT
CREATE POLICY "Head and linked members can view their group"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (
    head_user_id = auth.uid()
    OR auth_user_is_group_member(id)
  );

-- group_members: allow a linked member to see their own row + all sibling members
CREATE POLICY "Linked members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    linked_user_id = auth.uid()
    OR auth_user_is_group_member(group_id)
  );
