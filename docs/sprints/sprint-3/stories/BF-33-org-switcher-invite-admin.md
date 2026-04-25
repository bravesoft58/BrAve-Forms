# BF-33: Org Switcher, Invite Flow, Super-Admin Routes

**Type:** Feature / UX
**Priority:** HIGH
**Points:** 5
**Status:** NOT STARTED
**Sprint:** 3
**Depends on:** BF-31

## Problem

The schema and RLS support multi-tenant, but the app has no UI to actually use it. Need:
- Active-org context (which org is the user currently viewing).
- A switcher UI for users in >1 org.
- Invite flow that scopes to an org (today it just creates a global auth user).
- Super-admin route group for Tim/Andy to provision prospect orgs (read-only elsewhere).
- Route guards for all of the above.

All user-visible changes must gate behind a feature flag so we can instantly revert UX to single-tenant if anything misbehaves in production.

## Design

### Feature flag

`NEXT_PUBLIC_MULTI_TENANT` env var. `=0` in production initially (deploys the code but keeps old UX). Flip to `=1` after 24h of clean logs on preview.

Flag readers:
- `src/components/dashboard-shell.tsx` — show/hide org switcher.
- `src/app/admin/layout.tsx` — gate the super-admin route group.
- `src/app/dashboard/users/actions.ts` — new vs old invite flow.
- Users in a single org see zero UI difference regardless of flag state.

### Active-org cookie

- Cookie name: `bf_active_org`.
- HttpOnly, Secure, SameSite=Lax, 30-day TTL.
- Signed with `COOKIE_SECRET` env var (new, provision in Vercel).
- Read by `src/proxy.ts` / `src/lib/supabase/proxy.ts` on every request. If missing or invalid (user no longer in that org), reset to first membership. If zero memberships, redirect to `/no-org`.

### Org switcher

- Component: `src/components/org-switcher.tsx`.
- Dropdown in `dashboard-shell` header. Shows list of user's memberships with current org highlighted. Hidden if exactly 1 membership and not super-admin.
- `switchOrg(orgId)` server action: validates membership via `current_org_ids()`, writes cookie, `revalidatePath('/', 'layout')`.

### Super-admin route group

- `src/app/admin/layout.tsx` — guards `platform_role='super_admin'`, else redirect to `/dashboard`. Renders a "Support view" banner so it's never confused with dashboard.
- `src/app/admin/organizations/page.tsx` — list all orgs (super_admin only).
- `src/app/admin/organizations/new/page.tsx` + `actions.ts` — create org form. Takes name + owner email. If email matches existing user, add as owner immediately. If new email, create `organization_invitations` + `auth.admin.inviteUserByEmail` with `redirectTo=/invite/{token}`.
- `src/app/admin/organizations/[id]/page.tsx` — org detail: members list, audit log view, invite button.

Super-admin reads (all in `/admin/*`) go through `createServiceClient()` (BF-34 adds the audited wrapper).

### Invite flow rewrite

- `src/app/dashboard/users/actions.ts::inviteUser` — rewrite:
  1. Requires `requireOrgAdmin(activeOrgId)`.
  2. Inserts `organization_invitations` row (token = `gen_random_uuid()`, 14-day expires_at).
  3. Calls `auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/invite/${token}` })`.
- `src/app/invite/[token]/page.tsx` (new):
  1. Validates token (exists, not expired, not already accepted) via service client.
  2. If no session, redirect to `/login?invite_token=...` (login page preserves token).
  3. If session and email matches invitation.email, insert `organization_members(org_id, user_id, role)`, mark `accepted_at`, redirect to `/dashboard`.
  4. If session but email mismatch, error page: "this invite is for a different email; please log out and retry".

### Signup restriction

- `/signup` becomes invitation-required. Bare visits redirect to an informational page.
- `/invite/{token}` page carries through signup if user isn't registered yet.

### handle_new_user trigger

Modified to insert profile only (no org auto-assignment). One-time data migration in the same story backfills any pre-trigger auth.users ghosts that lack a profile row (BF-29 gotcha):

```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', ''), 'user'
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

(Still uses `profiles.role='user'` default at this story — BF-34 migrates callers away from `profiles.role`, BF-35 drops the column.)

## Files

### New

- `src/lib/org-context.ts` — `getActiveOrg()`, `setActiveOrg(id)`, `clearActiveOrg()`.
- `src/lib/supabase/service-audited.ts` — *stub only in this story*; audit-log wiring lands in BF-34.
- `src/components/org-switcher.tsx`.
- `src/app/admin/layout.tsx`.
- `src/app/admin/organizations/page.tsx`.
- `src/app/admin/organizations/new/page.tsx` + `actions.ts`.
- `src/app/admin/organizations/[id]/page.tsx`.
- `src/app/invite/[token]/page.tsx`.
- `src/app/no-org/page.tsx` — "you're not in an org yet; ask your admin for an invite".
- `supabase/migrations/20260424145000_profile_backfill_and_trigger.sql` — backfill orphans + modify `handle_new_user` if needed.

### Modified

- `src/lib/auth.ts` — `getCurrentUser()` extended with `activeOrg: { id, name, role } | null` and `platformRole`.
- `src/proxy.ts` + `src/lib/supabase/proxy.ts` — active-org cookie validation + redirect logic.
- `src/lib/queries/users.ts` — scope user list to active-org members only.
- `src/components/dashboard-shell.tsx` — render org switcher (flag-gated).
- `src/components/sidebar.tsx` — footer sources org name from `activeOrg.name` when flag=1 (Q&D name intact when flag=0).
- `src/app/dashboard/users/actions.ts` — `inviteUser` rewritten to org-scoped flow.
- `src/app/signup/{page.tsx,actions.ts}` — invite-required flow.

## Pre-Flight

- `COOKIE_SECRET` env var provisioned in Vercel (all environments).
- `NEXT_PUBLIC_MULTI_TENANT=0` set in Vercel production (keep old UX).
- Deploy to preview with `NEXT_PUBLIC_MULTI_TENANT=1` to test new UX.
- On preview:
  - Create second test org via `/admin/organizations/new`.
  - Invite a test email.
  - Accept on a different browser (simulates corporate email opening on another device).
  - Verify switching orgs updates dashboard content.
  - Cookie tamper: set `bf_active_org` manually to an org you're not in; next request resets it.

## Rollback

### L1 — Feature flag flip
Set `NEXT_PUBLIC_MULTI_TENANT=0` in Vercel + redeploy (30s). Org switcher disappears; `/admin/*` returns 404; invite flow reverts to old single-tenant path. All schema work (BF-30/31) stays intact.

### L2 — Code rollback
Vercel rollback to pre-BF-33 deployment. Any invitations created in `organization_invitations` become dead links; affected users get re-invited via old flow. Mitigation: don't send real-world invites (beyond internal testing) until flag stays `=1` for 24h.

Schema rollback is not needed — BF-33 doesn't touch BF-30/31 tables.

## Acceptance Criteria

- [ ] `NEXT_PUBLIC_MULTI_TENANT` env var wired; default `=0` in production.
- [ ] `COOKIE_SECRET` env var provisioned in Vercel.
- [ ] Active-org cookie set on login, validated on every request by proxy.
- [ ] Org switcher dropdown renders in header for users with >1 org or super-admin; hidden for single-org users.
- [ ] `switchOrg` server action validates membership and revalidates layout.
- [ ] `/admin/*` route group guards on `platform_role='super_admin'`.
- [ ] Super-admin can create a new org via `/admin/organizations/new`.
- [ ] Super-admin can invite first owner by email.
- [ ] `inviteUser` server action writes `organization_invitations` + sends invite email with `/invite/{token}` redirect.
- [ ] `/invite/{token}` page validates token, creates membership, marks accepted.
- [ ] Replay attack: revisiting an accepted token returns "already used" error.
- [ ] Expired invitation (past expires_at) rejected with clear error.
- [ ] Email mismatch (wrong user logged in) rejected.
- [ ] Signup restricted — bare `/signup` redirects to informational page.
- [ ] Profile backfill migration runs: any auth.users without profiles get one.
- [ ] Tim logs in as super-admin, sees admin route group, can view any org.
- [ ] Q&D users (single-org) see identical dashboard UX as before (flag=0 baseline).
- [ ] On preview with flag=1: Q&D user added to a second test org can switch between them.
- [ ] Stub `service-audited.ts` committed for BF-34 to fill in.

## Go/No-Go Gate → BF-34

- Feature flag `=1` in production for 24h after code deploy, no runtime errors.
- Andy test: given two test orgs, org switcher works correctly.
- Single-org Q&D users see zero UX change.
- Super-admin can provision a new prospect org end-to-end (create → invite owner → owner accepts → owner logs in to their new org's dashboard).
- `organization_invitations` writes happen only through the new flow; old `auth.admin.inviteUserByEmail`-only path removed.

## Related

- Plan: `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (Phase 4)
- Previous: BF-31 (RLS) and BF-32 (storage) both must be in production.
- Next: BF-34 (role refactor, service-audited client, FK fix, test harness)
