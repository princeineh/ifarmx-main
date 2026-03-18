-- Fix: allow linked members (joined via invite) to view their group and fellow members

-- 1. farming_groups: allow head_user_id and linked members to SELECT the group
CREATE POLICY "Head and linked members can view their group"
  ON farming_groups FOR SELECT
  TO authenticated
  USING (
    head_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = farming_groups.id
        AND gm.linked_user_id = auth.uid()
    )
  );

-- 2. group_members: allow a linked member to view their own record and all
--    sibling members in the same group
CREATE POLICY "Linked members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    linked_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
        AND gm2.linked_user_id = auth.uid()
    )
  );
