# BF-35: Drop Global Role (`is_admin()` + `profiles.role`)

**Type:** Schema Migration / Cleanup
**Priority:** MEDIUM
**Points:** 1
**Status:** SCHEDULED (+7 days after BF-34 is stable in production)
**Sprint:** 3
**Depends on:** BF-34 + 7-day stability + CI grep gate

## Problem

After BF-34, nothing in the app reads `profiles.role` or calls `is_admin()` — both were kept alive as compatibility shims during the refactor. Leaving them in place is a footgun: someone could accidentally reintroduce a dependency and silently re-globalize admin access. Drop them. Keep a backup table for 30 days in case of latent regression.

## Design

### Pre-drop backup

```sql
CREATE TABLE profile_role_backup AS
  SELECT id, role, now() AS backed_up_at FROM profiles;
COMMENT ON TABLE profile_role_backup IS 'BF-35 backup of profiles.role before drop. Safe to delete after 2026-05-15 (30-day retention).';
```

### Drops

```sql
DROP FUNCTION IF EXISTS public.is_admin();
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
```

## Files

### New

- `supabase/migrations/20260501120000_drop_global_role.sql` — forward (backup + drop in one transaction).
- `supabase/migrations/_rollback/20260501120000_rollback.sql` — inverse (restore column + function from backup).

### Modified

None.

## Pre-Flight (Mandatory Gates)

1. **CI grep gate** — `grep -rE "is_admin\(|profile\.role|profiles\..*\.role" src/ supabase/` returns zero matches. If any hit, HALT.
2. **DB-side check** — `SELECT proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND prosrc LIKE '%is_admin%'` returns zero rows (no other function references it).
3. **Policy check** — `SELECT polname FROM pg_policy WHERE pg_get_expr(polqual, polrelid) LIKE '%is_admin%'` returns zero rows.
4. **Snapshot** — Supabase dashboard snapshot + `pg_dump` before running.
5. **7-day stability window** — BF-34 has been in production for at least 7 days with no rollbacks or major incidents.
6. **Audit log sanity** — confirm `audit_log` has been receiving super-admin view rows; if the audit system is silently broken, delay this story.

## Rollback (L2)

`supabase/migrations/_rollback/20260501120000_rollback.sql`:

```sql
-- Restore column
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
UPDATE profiles SET role = b.role
FROM profile_role_backup b
WHERE profiles.id = b.id;
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;

-- Restore function (body captured during planning)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

Full data restoration. Anyone added to `profiles` between drop and rollback gets default `role='user'` — if that's wrong, manual fix from `audit_log` or user report.

## Acceptance Criteria

- [ ] All 6 pre-flight gates pass.
- [ ] `profile_role_backup` table created with row count matching `profiles`.
- [ ] `is_admin()` function dropped.
- [ ] `profiles.role` column dropped.
- [ ] Backup table has a `COMMENT` noting the 2026-05-15 retention end date.
- [ ] Post-drop smoke: every dashboard route loads correctly for Q&D users; new prospect org admin can still invite and manage their org.
- [ ] Rollback migration tested (dry-run on branch) — column and function restore correctly with original data.
- [ ] Calendar reminder set to drop `profile_role_backup` table on 2026-05-24 (30 days post-BF-35).

## Go/No-Go Gate → Sprint 3 Close

- All AC passed.
- Production stable for 48h post-drop.
- Andy confirms Q&D UX unchanged.
- First prospect org onboarded successfully on the multi-tenant codebase.

## Related

- Plan: `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (Phase 5b)
- Previous: BF-34 (all code callers migrated)
- Cleanup: drop `profile_role_backup` on 2026-05-24
