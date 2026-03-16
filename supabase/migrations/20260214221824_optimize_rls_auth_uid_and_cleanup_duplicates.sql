/*
  # Optimize RLS policies and remove duplicate policies

  1. RLS Policy Optimization
    - All policies now use `(select auth.uid())` instead of bare `auth.uid()`
    - This prevents re-evaluation of auth functions per row, improving query performance
    - Affected tables: ambassador_tasks, ambassadors, appreciations, care_logs,
      invites, notifications, page_views, plants, program_applications,
      program_kit_purchases, program_participants, user_events, user_profiles

  2. Duplicate Policies Removed
    - program_applications: Removed 5 duplicate SELECT/INSERT/UPDATE policies
    - programs: Removed 2 duplicate SELECT policies and 1 duplicate DELETE policy
    - These duplicates had identical conditions, causing unnecessary policy evaluation

  3. Function Search Path Fixes
    - Set explicit search_path on is_admin, handle_new_notification_email,
      and trigger_notification_email to prevent mutable search_path exploits

  4. Important Notes
    - No data changes, only policy and function metadata
    - All access patterns remain identical
    - Performance improvement for tables with many rows
*/

-- ============================================================
-- AMBASSADOR_TASKS: Fix all 4 policies
-- ============================================================

DROP POLICY IF EXISTS "Organizers can delete tasks" ON ambassador_tasks;
CREATE POLICY "Organizers can delete tasks" ON ambassador_tasks
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ambassadors a
    WHERE a.id = ambassador_tasks.ambassador_id
    AND a.appointed_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Organizers can create tasks" ON ambassador_tasks;
CREATE POLICY "Organizers can create tasks" ON ambassador_tasks
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ambassadors a
    WHERE a.id = ambassador_tasks.ambassador_id
    AND a.appointed_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Organizers and ambassadors can view tasks" ON ambassador_tasks;
CREATE POLICY "Organizers and ambassadors can view tasks" ON ambassador_tasks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ambassadors a
    WHERE a.id = ambassador_tasks.ambassador_id
    AND (a.appointed_by = (select auth.uid()) OR a.user_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Organizers and ambassadors can update tasks" ON ambassador_tasks;
CREATE POLICY "Organizers and ambassadors can update tasks" ON ambassador_tasks
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ambassadors a
    WHERE a.id = ambassador_tasks.ambassador_id
    AND (a.appointed_by = (select auth.uid()) OR a.user_id = (select auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ambassadors a
    WHERE a.id = ambassador_tasks.ambassador_id
    AND (a.appointed_by = (select auth.uid()) OR a.user_id = (select auth.uid()))
  ));

-- ============================================================
-- AMBASSADORS: Fix all 4 policies
-- ============================================================

DROP POLICY IF EXISTS "Organizers can remove ambassadors" ON ambassadors;
CREATE POLICY "Organizers can remove ambassadors" ON ambassadors
  FOR DELETE TO authenticated
  USING (appointed_by = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can appoint ambassadors" ON ambassadors;
CREATE POLICY "Organizers can appoint ambassadors" ON ambassadors
  FOR INSERT TO authenticated
  WITH CHECK (appointed_by = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can view program ambassadors" ON ambassadors;
CREATE POLICY "Organizers can view program ambassadors" ON ambassadors
  FOR SELECT TO authenticated
  USING (appointed_by = (select auth.uid()) OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can update ambassadors" ON ambassadors;
CREATE POLICY "Organizers can update ambassadors" ON ambassadors
  FOR UPDATE TO authenticated
  USING (appointed_by = (select auth.uid()))
  WITH CHECK (appointed_by = (select auth.uid()));

-- ============================================================
-- APPRECIATIONS: Fix all 4 policies
-- ============================================================

DROP POLICY IF EXISTS "Org users can insert appreciations for their programs" ON appreciations;
CREATE POLICY "Org users can insert appreciations for their programs" ON appreciations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM programs WHERE programs.id = appreciations.program_id AND programs.org_user_id = (select auth.uid()))
    AND sender_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Org users can view appreciations they sent" ON appreciations;
CREATE POLICY "Org users can view appreciations they sent" ON appreciations
  FOR SELECT TO authenticated
  USING (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recipients can view their appreciations" ON appreciations;
CREATE POLICY "Recipients can view their appreciations" ON appreciations
  FOR SELECT TO authenticated
  USING (recipient_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recipients can mark appreciations as read" ON appreciations;
CREATE POLICY "Recipients can mark appreciations as read" ON appreciations
  FOR UPDATE TO authenticated
  USING (recipient_id = (select auth.uid()))
  WITH CHECK (recipient_id = (select auth.uid()));

-- ============================================================
-- CARE_LOGS: Fix 1 policy
-- ============================================================

DROP POLICY IF EXISTS "Orgs can view applicant care logs for selection" ON care_logs;
CREATE POLICY "Orgs can view applicant care logs for selection" ON care_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plants pl
    JOIN program_applications pa ON pa.user_id = pl.user_id
    JOIN programs p ON p.id = pa.program_id
    WHERE pl.id = care_logs.plant_id
    AND p.org_user_id = (select auth.uid())
    AND pa.status = 'pending'
  ));

-- ============================================================
-- INVITES: Fix 1 policy
-- ============================================================

DROP POLICY IF EXISTS "Org users can view invites for own programs" ON invites;
CREATE POLICY "Org users can view invites for own programs" ON invites
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = invites.program_id
    AND programs.org_user_id = (select auth.uid())
  ));

-- ============================================================
-- NOTIFICATIONS: Fix 3 policies
-- ============================================================

DROP POLICY IF EXISTS "Org and system can insert notifications" ON notifications;
CREATE POLICY "Org and system can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (select auth.uid())
    AND (user_profiles.user_type = 'organization' OR user_profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- PAGE_VIEWS: Fix 1 policy
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert own page views" ON page_views;
CREATE POLICY "Authenticated users can insert own page views" ON page_views
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================
-- PLANTS: Fix 1 policy
-- ============================================================

DROP POLICY IF EXISTS "Orgs can view applicant plants for selection" ON plants;
CREATE POLICY "Orgs can view applicant plants for selection" ON plants
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM program_applications pa
    JOIN programs p ON p.id = pa.program_id
    WHERE pa.user_id = plants.user_id
    AND p.org_user_id = (select auth.uid())
    AND pa.status = 'pending'
  ));

-- ============================================================
-- PROGRAM_APPLICATIONS: Fix + consolidate duplicates
-- ============================================================

-- INSERT: Remove duplicate, fix auth pattern
DROP POLICY IF EXISTS "Users can apply to published programs" ON program_applications;
DROP POLICY IF EXISTS "Users can insert applications for published open programs" ON program_applications;
CREATE POLICY "Users can apply to published programs" ON program_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = program_applications.program_id
      AND programs.status = 'published'
      AND programs.acceptance_type = 'open'
    )
  );

-- SELECT: Consolidate 3 identical org policies into 1
DROP POLICY IF EXISTS "Org owners can read applications for their programs" ON program_applications;
DROP POLICY IF EXISTS "Org owners can view applications for their programs" ON program_applications;
DROP POLICY IF EXISTS "Org owners can view program applications" ON program_applications;
CREATE POLICY "Org owners can read applications for their programs" ON program_applications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = program_applications.program_id
    AND programs.org_user_id = (select auth.uid())
  ));

-- SELECT: Consolidate 2 user policies into 1 (superset)
DROP POLICY IF EXISTS "Users can read own applications" ON program_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON program_applications;
CREATE POLICY "Users can view own applications" ON program_applications
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- UPDATE: Consolidate 2 identical policies into 1
DROP POLICY IF EXISTS "Org owners can update applications" ON program_applications;
DROP POLICY IF EXISTS "Org owners can update applications for their programs" ON program_applications;
CREATE POLICY "Org owners can update applications" ON program_applications
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = program_applications.program_id
    AND programs.org_user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = program_applications.program_id
    AND programs.org_user_id = (select auth.uid())
  ));

-- ============================================================
-- PROGRAM_KIT_PURCHASES: Fix all 3 policies
-- ============================================================

DROP POLICY IF EXISTS "Orgs can insert own program purchases" ON program_kit_purchases;
CREATE POLICY "Orgs can insert own program purchases" ON program_kit_purchases
  FOR INSERT TO authenticated
  WITH CHECK (ordered_by = (select auth.uid()));

DROP POLICY IF EXISTS "Orgs can view own program purchases" ON program_kit_purchases;
CREATE POLICY "Orgs can view own program purchases" ON program_kit_purchases
  FOR SELECT TO authenticated
  USING (ordered_by = (select auth.uid()));

DROP POLICY IF EXISTS "Orgs can update own program purchases" ON program_kit_purchases;
CREATE POLICY "Orgs can update own program purchases" ON program_kit_purchases
  FOR UPDATE TO authenticated
  USING (ordered_by = (select auth.uid()))
  WITH CHECK (ordered_by = (select auth.uid()));

-- ============================================================
-- PROGRAM_PARTICIPANTS: Fix 1 policy
-- ============================================================

DROP POLICY IF EXISTS "Orgs can view applicant program enrollments for selection" ON program_participants;
CREATE POLICY "Orgs can view applicant program enrollments for selection" ON program_participants
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM program_applications pa
    JOIN programs p ON p.id = pa.program_id
    WHERE pa.user_id = program_participants.user_id
    AND p.org_user_id = (select auth.uid())
    AND pa.status = 'pending'
  ));

-- ============================================================
-- USER_EVENTS: Fix 1 policy
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert own events" ON user_events;
CREATE POLICY "Authenticated users can insert own events" ON user_events
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================
-- USER_PROFILES: Fix 2 policies
-- ============================================================

DROP POLICY IF EXISTS "Org owners can view applicant and participant profiles" ON user_profiles;
CREATE POLICY "Org owners can view applicant and participant profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM program_applications pa
      JOIN programs p ON p.id = pa.program_id
      WHERE pa.user_id = user_profiles.id AND p.org_user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM program_participants pp
      JOIN programs p ON p.id = pp.program_id
      WHERE pp.user_id = user_profiles.id AND p.org_user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can view program org profiles" ON user_profiles;
CREATE POLICY "Participants can view program org profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM program_participants pp
    JOIN programs p ON p.id = pp.program_id
    WHERE pp.user_id = (select auth.uid())
    AND p.org_user_id = user_profiles.id
  ));

-- ============================================================
-- PROGRAMS: Remove duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read published programs" ON programs;
DROP POLICY IF EXISTS "Authenticated users can view published programs" ON programs;
DROP POLICY IF EXISTS "Org users can delete draft programs" ON programs;

-- ============================================================
-- FUNCTION SEARCH PATH FIXES
-- ============================================================

ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.trigger_notification_email() SET search_path = public;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_notification_email'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER FUNCTION public.handle_new_notification_email() SET search_path = public;
  END IF;
END $$;
