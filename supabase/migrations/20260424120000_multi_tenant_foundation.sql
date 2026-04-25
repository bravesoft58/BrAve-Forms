-- BF-30: Multi-Tenant Foundation
-- Forward migration: additive schema + atomic Q&D backfill.
-- Pair: supabase/migrations/_rollback/20260424120000_rollback.sql
--
-- This migration is purely additive. No existing data is modified except:
--   - projects.organization_id is populated for every existing project (Q&D org)
--   - profiles.platform_role is populated ('member' default; 'super_admin' for Tim)
-- Existing app code does not read either column, so behavior is unchanged.

CREATE EXTENSION IF NOT EXISTS citext;

-- =========================================================================
-- 1. NEW TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner','admin','member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_org
  ON public.organization_members (user_id, org_id);

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email        CITEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('owner','admin','member')),
  token        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  invited_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at  TIMESTAMPTZ,
  accepted_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.organization_invitations (token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON public.organization_invitations (email);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  target_org_id   UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  target_table    TEXT,
  target_id       UUID,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_org ON public.audit_log (target_org_id);

-- =========================================================================
-- 2. COLUMN ADDITIONS
-- =========================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role TEXT NOT NULL DEFAULT 'member'
    CHECK (platform_role IN ('member','super_admin'));

-- =========================================================================
-- 3. RLS — placeholder policies (BF-31 replaces with real org-scoped rules)
-- Enabling RLS on the new tables prevents an RLS-disabled window between
-- BF-30 and BF-31. Placeholders are SELECT-only for authenticated; writes
-- only succeed via service role until BF-31 lands.
-- =========================================================================

ALTER TABLE public.organizations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log                ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bf30_placeholder_select" ON public.organizations;
CREATE POLICY "bf30_placeholder_select" ON public.organizations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bf30_placeholder_select" ON public.organization_members;
CREATE POLICY "bf30_placeholder_select" ON public.organization_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bf30_placeholder_select" ON public.organization_invitations;
CREATE POLICY "bf30_placeholder_select" ON public.organization_invitations
  FOR SELECT TO authenticated USING (true);

-- audit_log: no policies = service role only. Locked down by default.

-- =========================================================================
-- 4. ATOMIC BACKFILL (idempotent — guarded against re-application)
-- =========================================================================

DO $$
DECLARE
  qd_id  UUID;
  tim_id UUID;
  expected_profile_count INT;
  actual_member_count    INT;
  unscoped_projects      INT;
BEGIN
  -- Skip backfill if already done (idempotency for branch testing / re-runs)
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'qd-construction') THEN
    RAISE NOTICE 'BF-30: Q&D org already exists, skipping backfill';
    RETURN;
  END IF;

  SELECT id INTO tim_id FROM public.profiles WHERE email = 'timsaverill@protonmail.com';
  IF tim_id IS NULL THEN
    RAISE EXCEPTION 'BF-30 backfill: Tim profile not found (timsaverill@protonmail.com)';
  END IF;

  INSERT INTO public.organizations (name, slug, status, created_by)
  VALUES ('Q&D Construction', 'qd-construction', 'active', tim_id)
  RETURNING id INTO qd_id;

  INSERT INTO public.organization_members (org_id, user_id, role, invited_by)
  SELECT qd_id, p.id,
         CASE WHEN p.role = 'admin' THEN 'admin' ELSE 'member' END,
         tim_id
  FROM public.profiles p;

  UPDATE public.organization_members
    SET role = 'owner'
    WHERE user_id = tim_id AND org_id = qd_id;

  UPDATE public.projects SET organization_id = qd_id WHERE organization_id IS NULL;

  UPDATE public.profiles SET platform_role = 'super_admin' WHERE id = tim_id;

  -- Assertions: fail loudly if any drift
  SELECT count(*) INTO expected_profile_count FROM public.profiles;
  SELECT count(*) INTO actual_member_count
    FROM public.organization_members WHERE org_id = qd_id;
  IF actual_member_count <> expected_profile_count THEN
    RAISE EXCEPTION 'BF-30 backfill: member count % does not match profile count %',
      actual_member_count, expected_profile_count;
  END IF;

  SELECT count(*) INTO unscoped_projects
    FROM public.projects WHERE organization_id IS NULL;
  IF unscoped_projects > 0 THEN
    RAISE EXCEPTION 'BF-30 backfill: % projects still have NULL organization_id', unscoped_projects;
  END IF;

  -- Now safe to enforce NOT NULL
  ALTER TABLE public.projects ALTER COLUMN organization_id SET NOT NULL;
END $$;

-- =========================================================================
-- 5. updated_at trigger for organizations (scoped helper to keep rollback clean)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.update_organizations_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_set_updated_at ON public.organizations;
CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_organizations_timestamp();

-- =========================================================================
-- 6. TABLE COMMENTS (documentation)
-- =========================================================================

COMMENT ON TABLE public.organizations IS
  'Tenant root. Each org isolates projects, members, forms. Created by super-admin only (BF-33).';
COMMENT ON TABLE public.organization_members IS
  'User-to-org membership with role. owner/admin/member. Source of truth for org-scoped access in BF-31.';
COMMENT ON TABLE public.organization_invitations IS
  'Pending invitations. Token-based accept flow lands in BF-33.';
COMMENT ON TABLE public.audit_log IS
  'Append-only log of cross-org super-admin actions. Writes via service role only. RLS blocks UPDATE/DELETE.';
COMMENT ON COLUMN public.profiles.platform_role IS
  'Platform-wide role. ''super_admin'' grants read-only cross-org access (BF-33). Default ''member''.';
COMMENT ON COLUMN public.projects.organization_id IS
  'Tenant scope. All projects belong to exactly one organization. Backfilled to Q&D in BF-30.';
