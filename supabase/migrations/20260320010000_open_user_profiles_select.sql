-- Allow any authenticated user to read any user profile.
-- This is needed so the family head can see the name/avatar of someone
-- who has submitted a join request (before they're approved, they don't
-- share a group, so the old "shares group" policy blocked the lookup).
-- This is standard practice for social/community apps.

DROP POLICY IF EXISTS "Linked members can see each other's last_seen" ON user_profiles;
DROP POLICY IF EXISTS "Linked members can see each other's presence" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (true);
