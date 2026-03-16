/*
  # Add missing indexes on foreign keys

  1. New Indexes
    - `farming_groups.kit_code_id` - FK to kit_codes
    - `farming_groups.user_id` - FK to auth.users
    - `group_members.group_id` - FK to farming_groups
    - `invites.program_id` - FK to programs
    - `invites.used_by` - FK to auth.users
    - `kit_codes.assigned_by_org_id` - FK to user_profiles
    - `kit_codes.program_id` - FK to programs
    - `kit_item_checks.kit_item_id` - FK to kit items
    - `kit_item_checks.verification_id` - FK to kit_verifications
    - `kit_verifications.kit_code_id` - FK to kit_codes
    - `kit_verifications.user_id` - FK to auth.users
    - `plants.farming_group_id` - FK to farming_groups
    - `plants.kit_code_id` - FK to kit_codes

  2. Purpose
    - Improve JOIN and query performance on foreign key columns
    - Prevent sequential scans during cascading operations
*/

CREATE INDEX IF NOT EXISTS idx_farming_groups_kit_code_id ON public.farming_groups (kit_code_id);
CREATE INDEX IF NOT EXISTS idx_farming_groups_user_id ON public.farming_groups (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_invites_program_id ON public.invites (program_id);
CREATE INDEX IF NOT EXISTS idx_invites_used_by ON public.invites (used_by);
CREATE INDEX IF NOT EXISTS idx_kit_codes_assigned_by_org_id ON public.kit_codes (assigned_by_org_id);
CREATE INDEX IF NOT EXISTS idx_kit_codes_program_id ON public.kit_codes (program_id);
CREATE INDEX IF NOT EXISTS idx_kit_item_checks_kit_item_id ON public.kit_item_checks (kit_item_id);
CREATE INDEX IF NOT EXISTS idx_kit_item_checks_verification_id ON public.kit_item_checks (verification_id);
CREATE INDEX IF NOT EXISTS idx_kit_verifications_kit_code_id ON public.kit_verifications (kit_code_id);
CREATE INDEX IF NOT EXISTS idx_kit_verifications_user_id ON public.kit_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_plants_farming_group_id ON public.plants (farming_group_id);
CREATE INDEX IF NOT EXISTS idx_plants_kit_code_id ON public.plants (kit_code_id);