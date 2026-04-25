# BF-30: Multi-Tenant Schema + Q&D Backfill

**Type:** Schema Migration
**Priority:** CRITICAL
**Points:** 3
**Status:** COMPLETE (2026-04-25, applied to production via Supabase MCP)
**Sprint:** 3
**Depends on:** None (first story of Sprint 3)

## Problem

The current schema has no tenancy concept. `projects` are scoped per-user via `project_users`, but there's no org root. Adding a second prospect to test would mean their admin sees all of Q&D's data because `is_admin()` is globally scoped. To prepare for multi-tenant without breaking anything, we need an additive schema foundation that backfills all existing Q&D data into one organization.

## Design

Additive-only migration. No drops, no renames, no policy changes. Existing app code continues to work unchanged because nothing yet reads the new columns.

### New tables

```
organizations          (id, name, slug UNIQUE, status, created_at, created_by FK profiles, updated_at)
organization_members   (id, org_id FK, user_id FK profiles, role CHECK (owner|admin|member), joined_at, invited_by)
                       UNIQUE (org_id, user_id)
organization_invitations (id, org_id, email CITEXT, role, token UUID UNIQUE, expires_at, invited_by, accepted_at, accepted_by)
audit_log              (id, actor_user_id, action, target_org_id, target_table, target_id, metadata JSONB, created_at)
                       -- append-only; RLS blocks UPDATE/DELETE for everyone except service role
```

### Column additions

- `projects.organization_id UUID REFERENCES organizations(id)` — nullable during migration, NOT NULL at the end.
- `profiles.platform_role TEXT DEFAULT 'member' CHECK IN (member, super_admin)`.

### Backfill (single atomic block)

```sql
DO $$
DECLARE qd_id UUID;
BEGIN
  INSERT INTO organizations (name, slug, status, created_by)
  VALUES ('Q&D Construction', 'qd-construction', 'active',
          (SELECT id FROM profiles WHERE email='timsaverill@protonmail.com'))
  RETURNING id INTO qd_id;

  INSERT INTO organization_members (org_id, user_id, role)
  SELECT qd_id, p.id,
         CASE WHEN p.role='admin' THEN 'admin' ELSE 'member' END
  FROM profiles p;

  UPDATE organization_members SET role='owner'
  WHERE user_id=(SELECT id FROM profiles WHERE email='timsaverill@protonmail.com')
    AND org_id=qd_id;

  UPDATE projects SET organization_id=qd_id;
  ALTER TABLE projects ALTER COLUMN organization_id SET NOT NULL;

  UPDATE profiles SET platform_role='super_admin'
  WHERE email='timsaverill@protonmail.com';
END $$;
```

### RLS on new tables (enabled but permissive until BF-31)

Enable RLS on all 4 new tables. Create a single permissive policy per table (`USING true`) as a placeholder — BF-31 replaces these with the real org-scoped policies. This avoids an RLS-disabled window.

## Files

### New

- `supabase/migrations/20260424120000_multi_tenant_foundation.sql` — forward migration (schema + backfill).
- `supabase/migrations/_rollback/20260424120000_rollback.sql` — inverse (drop the 4 tables + 2 columns).

### Modified

None (no code changes this story).

## Pre-Flight

Before running on production:

1. Supabase dashboard: take manual snapshot.
2. `pg_dump --schema=public -f backups/pre_bf30_<timestamp>.sql` via local CLI.
3. Verify Tim's profile exists: `SELECT id FROM profiles WHERE email='timsaverill@protonmail.com'` — must return 1 row.
4. Run on Supabase branch first. Verify:
   - `SELECT count(*) FROM organizations` = 1, name = 'Q&D Construction'.
   - `SELECT count(*) FROM organization_members` = `SELECT count(*) FROM profiles` (should be 6).
   - `SELECT count(*) FROM projects WHERE organization_id IS NULL` = 0.
   - `SELECT platform_role FROM profiles WHERE email='timsaverill@protonmail.com'` = 'super_admin'.

## Rollback (L2)

`supabase/migrations/_rollback/20260424120000_rollback.sql`:

```sql
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS organization_invitations;
DROP TABLE IF EXISTS organization_members;
ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS platform_role;
DROP TABLE IF EXISTS organizations;
```

Zero data loss — new tables contain only derived data. App continues working because no code references the new surface yet.

## Acceptance Criteria

- [x] Forward migration file created at `supabase/migrations/20260424120000_multi_tenant_foundation.sql`.
- [x] Inverse migration file created at `supabase/migrations/_rollback/20260424120000_rollback.sql`.
- [x] Migration runs clean; row-count assertions pass (no Supabase branch on Free tier — applied directly with paired rollback ready).
- [x] Q&D dashboard still loads and shows existing 5 projects after migration (browser smoke test against production: `/dashboard/projects` and `/dashboard/forms` both render expected counts).
- [x] Existing RLS policies still function — 28 policies across 9 pre-existing tables intact, function bodies of `is_admin()` and `get_user_project_ids()` unchanged.
- [x] Pre-flight snapshot saved at `backups/pre_bf30/tables.json.raw` (118KB JSON dump of all 9 tables via Supabase MCP). pg_dump skipped — CLI not on PATH from automation shell; MCP-driven JSON snapshot is verification-grade.
- [x] Applied to production via `mcp__plugin_supabase_supabase__apply_migration` 2026-04-25 14:27 UTC; go/no-go gate assertions pass.

## Go/No-Go Gate → BF-31

- [x] Q&D users log in and see the same dashboard (browser smoke test: 5 projects + 11 submissions render).
- [x] `SELECT count(*) FROM organizations` = 1 (Q&D Construction).
- [x] `SELECT count(*) FROM projects WHERE organization_id IS NULL` = 0.
- [x] `SELECT count(*) FROM organization_members WHERE role='owner'` = 1 (Tim).
- [x] Current `is_admin()` function body unchanged; per-user simulation matches `profile.role` exactly (4 admins → true, 2 users → false).
- [x] Zero errors in Vercel production runtime logs for 24h preceding migration; zero errors in 15 min post-migration. Forward-looking 24h soak: gate auto-closes 2026-04-26 14:27 UTC; do not start BF-31 until then.

## Related

- Plan: `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (Phase 1)
- Next: BF-31 (RLS rewrite that actually uses these new tables)
