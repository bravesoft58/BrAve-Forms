-- BF-30 ROLLBACK
-- Reverses 20260424120000_multi_tenant_foundation.sql
--
-- WHEN TO RUN: Only if BF-30 has caused regression and you need to fully revert.
-- DATA LOSS: Only the 4 new tables (organizations, organization_members,
--            organization_invitations, audit_log). All derived data — no
--            user-generated content lost. projects.organization_id and
--            profiles.platform_role columns are dropped (re-derivable from
--            backfill rules if reapplied).
--
-- HOW TO RUN:
--   supabase db execute -f supabase/migrations/_rollback/20260424120000_rollback.sql
-- OR via MCP apply_migration with name `bf30_rollback`.
--
-- AFTER RUNNING: delete the row from supabase_migrations.schema_migrations
-- whose version = '20260424120000' so the forward migration can be re-applied.

-- Drop trigger + helper before its table
DROP TRIGGER IF EXISTS organizations_set_updated_at ON public.organizations;
DROP FUNCTION IF EXISTS public.update_organizations_timestamp();

-- Drop columns added to existing tables
ALTER TABLE public.projects DROP COLUMN IF EXISTS organization_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS platform_role;

-- Drop new tables (FK order: dependents first)
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.organization_invitations;
DROP TABLE IF EXISTS public.organization_members;
DROP TABLE IF EXISTS public.organizations;

-- citext extension intentionally left installed (harmless, may be reused).
