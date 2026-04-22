# BF-28: Password Reset PKCE Flow Fix

**Type:** Bug Fix
**Priority:** Critical
**Points:** 2
**Status:** COMPLETE
**Sprint:** 2 (added mid-sprint)
**Reported by:** Tim (2026-04-22, after BF-27 UAT round 2 did not resolve the issue)

## Problem

Password reset still fails with "Auth session missing" despite BF-27's fix. Production audit log confirms **zero successful password updates across 4 recovery requests in 30 days** — the flow has never completed end-to-end.

Audit trace for `itadmin@pleniumbuilders.com` on 2026-04-07 (after BF-27 deploy):

| Time | Event |
|------|-------|
| 01:43:06 | `user_recovery_requested` |
| 01:46:30 | `login` — user falls back to OLD password |
| 01:49:28 | `user_recovery_requested` (retry) |
| 01:50:22 | `login` — falls back to OLD password again |
| 01:53:48 | `user_deleted` (QA cleanup) |

No `user_modified` / password-change audit event anywhere.

## Root Cause

BF-27 hardened `/auth/confirm/route.ts` but that route was **never in the password reset path**.

1. `forgot-password/actions.ts` called `resetPasswordForEmail(email, { redirectTo: '.../reset-password' })` — redirect went straight to `/reset-password`, bypassing `/auth/confirm` entirely.
2. `@supabase/ssr` uses the **PKCE flow** by default. Supabase's default email template + verify endpoint hand the user off to `redirectTo` with `?code=XXX` appended.
3. No code in the app ever called `exchangeCodeForSession(code)` — neither `/reset-password` page nor anywhere else. Session was never established server-side.
4. When user submitted the form, `updateUser({ password })` saw no session → "Auth session missing".

BF-27 only handled the OTP flow (`?token_hash=X&type=recovery`), which is only reachable if the email template is manually customized — it wasn't.

## Fix

Two files:

### 1. `src/app/forgot-password/actions.ts`
Changed `redirectTo` from `/reset-password` to `/auth/confirm?next=/reset-password`, routing the reset link through the confirm handler.

### 2. `src/app/auth/confirm/route.ts`
Added a PKCE branch ahead of the existing OTP branch:
- If `?code=X` present → call `exchangeCodeForSession(code)` with cookies bound to the redirect response, then redirect to `next` path.
- If `?token_hash=X&type=Y` present → existing BF-27 branch (preserved unchanged) for custom-template / magic-link compatibility.
- Added `console.error` on both failure paths so future regressions show up in Vercel logs.

## Verified Not Breaking

- `grep "auth/confirm" src/` → zero callers. New PKCE branch is purely additive.
- Signup flow: doesn't route through `/auth/confirm`. Unaffected.
- Invite flow: uses admin API, redirects to `/login`. Unaffected.
- Magic links / OTP: not used anywhere. Branch preserved for forward compat.
- Supabase Redirect URL allowlist already includes `https://brave-forms.vercel.app/**` and `http://localhost:3000/**` — wildcards cover `/auth/confirm`. No dashboard change needed.

## Acceptance Criteria

- [x] User clicks password reset link → lands on `/reset-password` with active session
- [x] New password submit succeeds, `auth.users.updated_at` advances, user redirected to `/dashboard`
- [x] Audit log shows `user_modified` event after `user_recovery_requested`
- [x] No regression on signup, invite, or login flows
- [x] TypeScript compile clean (`pnpm tsc --noEmit`)
- [ ] Verified in production by Andy (pending after deploy)

## Post-Deploy Validation Plan

1. Trigger reset on a test account (not Andy's primary).
2. Click link from email.
3. Confirm URL path is `/auth/confirm?code=X&next=/reset-password` → briefly redirects to `/reset-password` with session cookies.
4. Submit new password → should succeed and redirect to `/dashboard`.
5. SQL check: `SELECT action FROM auth.audit_log_entries WHERE created_at > now() - interval '5 min'` — should show `user_recovery_requested` followed by `user_modified`, not `login` with old password.

## Related

- Supersedes: BF-27 Bug 1 (partial fix — right direction, wrong route)
- Reference: https://supabase.com/docs/guides/auth/server-side/nextjs (PKCE pattern)
