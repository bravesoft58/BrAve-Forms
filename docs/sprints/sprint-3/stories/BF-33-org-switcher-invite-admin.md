# BF-33: Org Switcher, Invite Flow, Super-Admin Routes

**Type:** Feature / UX
**Priority:** HIGH (carries a P0 sub-path — new-org admin create-project, folded from BF-46)
**Points:** 8 (5 + 3 folded from BF-46; the two stories' provisioning scope overlaps, so it may land under 8)
**Status:** IN PROGRESS — Slice 1 (P0 create-project unblock, folded BF-46) COMPLETE & MERGED to master (PR #31; Andy UAT ✓ 2026-06-09). Slices 2–5 NOT STARTED.
**Sprint:** 3
**Depends on:** BF-31
**Last Updated:** 2026-06-09T17:44:29Z
**Folds in:** BF-46 (P0 new-tenant create-project flash) — superseded 2026-06-08; see "Create-Project Path for New-Org Admins" below.

## Problem

The schema and RLS support multi-tenant, but the app has no UI to actually use it. Need:
- Active-org context (which org is the user currently viewing).
- A switcher UI for users in >1 org.
- Invite flow that scopes to a *chosen* org. Today `inviteUser` already promotes `profiles.role` and syncs `organization_members` into the *inviting admin's first* org (BF-38, `dashboard/users/actions.ts:117-147`) — but it can't target a chosen org, and there is no org-minting path at all.
- Super-admin route group for Tim/Andy to provision prospect orgs (read-only elsewhere).
- Route guards for all of the above.
- **Provision a new org's first admin so they can actually create projects (P0, folded from BF-46).** Today provisioning leaves the admin with `profiles.role='user'`, which the create-project path blocks *before the form renders* — "the screen just flashes."

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
- `src/app/admin/organizations/new/page.tsx` + `actions.ts` — create org form. Takes name + owner email. If email matches existing user, add as owner immediately **and set `profiles.role='admin'`** (else the owner can't create projects — see BF-46 fold). If new email, create `organization_invitations` + `auth.admin.inviteUserByEmail` with `redirectTo=/invite/{token}`.
- `src/app/admin/organizations/[id]/page.tsx` — org detail: members list, audit log view, invite button.

Super-admin reads (all in `/admin/*`) go through `createServiceClient()` (BF-34 adds the audited wrapper).

### Invite flow rewrite

- `src/app/dashboard/users/actions.ts::inviteUser` — rewrite:
  1. Requires `requireOrgAdmin(activeOrgId)`.
  2. Inserts `organization_invitations` row (token = `gen_random_uuid()`, 14-day expires_at).
  3. Calls `auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/invite/${token}` })`.

  > **Regression guard (BF-38):** today's `inviteUser` already promotes `profiles.role` and upserts `organization_members` via `syncOrgMemberRole` (`dashboard/users/actions.ts:117-147`) at send-time. This rewrite defers membership + role to `/invite/[token]` acceptance — acceptance MUST insert the `organization_members` row *and* set `profiles.role` (see "Create-Project Path for New-Org Admins" below), or invitees lose the org-scoped RLS access BF-38 fixed. Relocate `syncOrgMemberRole`'s behavior into acceptance; don't drop it.
- `src/app/invite/[token]/page.tsx` (new):
  1. Validates token (exists, not expired, not already accepted) via service client.
  2. If no session, redirect to `/login?invite_token=...` (login page preserves token).
  3. If session and email matches invitation.email, insert `organization_members(org_id, user_id, role)` **and, for `owner`/`admin` invites, set `profiles.role='admin'` in the same transaction** (else the new admin hits the create-project flash — see "Create-Project Path for New-Org Admins" / BF-46), mark `accepted_at`, redirect to `/dashboard`.
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

## Create-Project Path for New-Org Admins (P0 — folded from BF-46)

> **Folded from BF-46 (superseded 2026-06-08).** Andy's multi-tenant test: a freshly-provisioned admin (`adminbreen@pleniumbuilders.com`) could log in and was correctly isolated, but **could not create a project — "the screen just flashes."** It belongs here because it is a *latent defect in BF-33's own provisioning/invite flow*, not a standalone bug.

### Root cause (prod-verified 2026-06-08)

`getCurrentUser()` derives `role` from `profiles.role` (`src/lib/auth.ts:22`; default `'user'`). Prod confirmed `adminbreen`: `profiles.role='user'`, `org_id=NULL` (orphan — no membership, no org). Three gates key on `profiles.role`, all firing before any create:
- `src/app/dashboard/projects/new/page.tsx:8` — `if (user.role !== "admin") redirect("/dashboard/projects")`, **before the form renders** = the flash.
- `src/app/dashboard/projects/actions.ts:23` — a second admin gate, rejects before the org-membership query runs.
- The **New Project button** (`projects/page.tsx:20-26,34-39`) renders for everyone with no gate, so non-admins can always click into the redirect.

The membership/RLS paths (BF-46's original hypothesis) are unreachable for this user. The error banner already exists (`project-form.tsx:125-129`) and the RLS error is already mapped (`actions.ts:70-74`) — neither was the problem.

**Why this is a BF-33 defect:** a new org's first owner is minted by the super-admin create-org route (doesn't exist yet) and accepted via `/invite/[token]` (also new) — neither sets `profiles.role`, and `handle_new_user` defaults it to `'user'`. So **a new org's first owner/admin — plus any user provisioned outside the existing `inviteUser`-as-admin path (self-signup, or invited as `user`, like `adminbreen`) — reproduces this exact flash** unless BF-33 sets `profiles.role` for them. (An admin invited through *today's* `inviteUser` already gets `role='admin'` + a membership in the inviting admin's org via BF-38's `syncOrgMemberRole`, so that path does **not** flash — but it can't mint a new org, which is the actual gap.) Fixing it here closes the bug at its source rather than papering over one user.

### Fix

1. **Provision `profiles.role='admin'` for org owners/admins** — in the super-admin create-org route (when adding an owner) and in `/invite/[token]` acceptance (for `owner`/`admin` invites), in the same transaction as the `organization_members` insert. Interim until BF-34 re-keys the gates off `profiles.role` and BF-35 drops the column — document the coupling.
2. **Backfill `adminbreen` / Plenium so Andy can retest immediately** (orphan — create the org first):
   ```sql
   -- 1. create the Plenium org (via /admin/organizations/new once it lands, or manual MCP)
   -- 2. promote the profile (WITHOUT this, the flash persists):
   update profiles set role = 'admin' where id = '<adminbreen_user_id>';
   -- 3. link membership (idempotent):
   insert into organization_members (org_id, user_id, role)
   values ('<plenium_org_id>', '<adminbreen_user_id>', 'admin')
   on conflict (org_id, user_id) do update set role = 'admin';
   ```
3. **Loud failure for genuine non-admins:** hide/disable the New Project button for non-admins (`projects/page.tsx:20-26,34-39`), **or** remove the `new/page.tsx:8` redirect so the existing form banner can render the action error. Pick one — the page redirect currently makes an on-screen error impossible.
4. **Harden error mapping (low-risk):** prefer `error.code === '42501'` over the message substring (keep the substring as fallback), applied to both `createProject` and `updateProject:228`; add `role="alert"` + scroll-into-view to the existing banner (`project-form.tsx:125-129`).

### Ship order — land this slice first

Steps 1-3 are **not** gated behind `NEXT_PUBLIC_MULTI_TENANT` and do **not** need BF-32. This is a small, flag-independent fix that should ship **ahead of** the org-switcher UI to unblock Andy's second-prospect UAT immediately; the switcher/invite-flow remainder follows under the flag.

### Acceptance (folded from BF-46)

- [x] Root cause confirmed against prod — `profiles.role='user'` page redirect, not membership/RLS. *(Done in validation 2026-06-08.)*
- [ ] Provisioning an org owner/admin yields `profiles.role='admin'` + `organization_members(role IN ('owner','admin'))` + the org, atomically. *(DEFERRED to Slice 4 — durable super-admin create-org route. Slice 1 substituted a manual MCP backfill for adminbreen/Plenium.)*
- [ ] `/invite/[token]` acceptance sets `profiles.role='admin'` for owner/admin invites (closes the latent flash for all future provisioned admins). *(DEFERRED to Slice 5 — invite-flow rewrite.)*
- [x] `adminbreen@pleniumbuilders.com` backfilled (org + profile promote + membership) and can create a project end-to-end in Plenium; isolation still holds both ways. *(Backfill applied 2026-06-08 via MCP; Andy UAT confirmed create + both-way isolation 2026-06-09.)*
- [x] A genuine non-admin gets a clear outcome (button hidden/disabled, or a rendered error) — never a silent flash. *(New Project links gated behind `isAdmin` in `projects/page.tsx`; `/verify` 9.7/10.)*
- [x] `42501` mapping hardened on create + update; banner gets `role="alert"` + scroll-into-view. *(`actions.ts` createProject/updateProject; `project-form.tsx`.)*
- [x] No regression to Q&D create-project. *(Andy isolation test 2026-06-09; admin create path unchanged.)*

### Browser test (folded from BF-46)

Vercel preview + a disposable second org (clean up after).
1. **Repro (pre-fix):** provision a test admin the incomplete way (`profiles.role='user'`, no membership) → New Project → confirm the redirect-flash before any form renders (no `createProject` call in the network log).
2. **Post-fix happy path:** provisioned admin (profile promoted + membership) creates a project → redirects to the project → appears in that org's list.
3. **Isolation re-check:** a Q&D user can't see the test project; the test admin can't see Q&D projects.
4. **Non-admin UX:** genuine non-admin → button hidden/disabled or a rendered error (no flash).
5. **DB verify + cleanup:** correct `organization_id` on the new rows; delete the throwaway org/user/project after.

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
- `src/app/dashboard/projects/new/page.tsx` — non-admin handling (gate the button or drop the redirect) so the create path fails loudly, not silently. *(P0, folded from BF-46.)*
- `src/app/dashboard/projects/page.tsx` — gate the New Project button for non-admins. *(P0, folded from BF-46.)*
- `src/app/dashboard/projects/actions.ts` — harden RLS-error mapping (`42501`) on `createProject`/`updateProject`. *(P0, folded from BF-46.)*
- `src/components/projects/project-form.tsx` — `role="alert"` + scroll-into-view on the existing error banner. *(P0, folded from BF-46.)*

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
- Super-admin can provision a new prospect org end-to-end (create → invite owner → owner accepts → owner logs in → **owner creates a project in their new org** — the BF-46 P0).
- `organization_invitations` writes happen only through the new flow; old `auth.admin.inviteUserByEmail`-only path removed.

## Related

- Plan: `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (Phase 4)
- Previous: BF-31 (RLS) and BF-32 (storage) both must be in production.
- Next: BF-34 (role refactor, service-audited client, FK fix, test harness)
