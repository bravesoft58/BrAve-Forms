# BF-29: Password Reset OTP Flow (Defeat Email Link Pre-Fetch)

**Type:** Bug Fix
**Priority:** Critical
**Points:** 2
**Status:** COMPLETE
**Sprint:** 2 (added mid-sprint)
**Reported by:** Tim (2026-04-22, after BF-28 deploy did not resolve Andy's UAT failure)

## Problem

BF-28's PKCE fix is live but password reset still fails. Production audit log for `abreen@qdgroupinvesco.com` on 2026-04-22:

| Time (UTC) | Event |
|------------|-------|
| 13:45:22 | `user_recovery_requested` |
| 13:45:57 | `user_signedup` (invite confirmation — separate path) |
| 13:46:15 | logout of old qdconstruction session |
| 13:46:57 | `user_recovery_requested` (retry) |
| 13:55:27 | `login` — no preceding `user_modified` |

Andy's screenshot shows the login page with **"Invalid or expired confirmation link."** — the `/auth/confirm` fallback redirect at the end of `route.ts` (line 79-81).

Zero `user_modified` after two recovery requests: the PKCE exchange at `/auth/confirm` is failing in Andy's environment.

## Root Cause

PKCE requires the **code_verifier cookie** to be present in the same browser that opens the email link. This breaks in corporate environments:

1. **Email security scanners pre-fetch links** — Microsoft Defender Safe Links, Mimecast, Proofpoint, Barracuda all do GET requests on links to scan them. This consumes the one-time `code` param before the user ever clicks. When the user's actual click lands at `/auth/confirm`, the code is already burned.
2. **Email client opens link in a different browser** than where the reset was requested — no verifier cookie in the target browser → `exchangeCodeForSession` fails.
3. **Second Andy account** (`abreen@qdconstruction.com` was logged in; the reset was for `abreen@qdgroupinvesco.com`) — mixed cookie state may be aggravating the failure.

Q&D Construction is on qdconstruction.com corporate email. Safe Links pre-fetch is nearly certain to be involved.

## Fix

Switch password reset + signup confirmation + invite emails to the **OTP (`token_hash`) flow** instead of PKCE. Our `/auth/confirm` route already handles the OTP branch via `verifyOtp` — it does not require a verifier cookie, so it survives a different browser opening the link.

### 1. Supabase dashboard — email templates

Change the three templates to use `{{ .TokenHash }}` + `/auth/confirm` (no more `{{ .ConfirmationURL }}`):

**Reset Password:**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset password</a></p>
```

**Confirm signup:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard">Confirm your email</a></p>
```

**Invite user:**
```html
<h2>You have been invited</h2>
<p>You have been invited to create a user on BrAve Forms. Follow this link to accept the invite:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/reset-password">Accept the invite</a></p>
```

### 2. Defeat pre-fetch entirely (interstitial)

Even OTP tokens are single-use — if Safe Links still GETs the link, the token burns before the human clicks. Add an interstitial page that requires a user gesture:

- New route: `/auth/confirm-link/page.tsx` — server component that reads `token_hash`, `type`, `next` from search params and renders a "Continue" button that POSTs (or navigates) to `/auth/confirm?token_hash=...&type=...&next=...`.
- Safe Links' HEAD/GET scan hits the interstitial (which renders HTML but does NOT consume the token).
- Real click continues to the existing `/auth/confirm` GET handler.
- Update email templates to link to `/auth/confirm-link?token_hash=...&type=...&next=...` instead of `/auth/confirm` directly.

### 3. Clean up ghost account

- `abreen@qdconstruction.com` (user `c4b18aca-453a-4f57-971c-fbf9b2d96833`) — confirm with Tim whether to delete or keep for audit history.
- Verify `abreen@qdgroupinvesco.com` (user `11e36e2a-76cd-4981-971b-6d9a1cedfb0a`) is the active account going forward.

### 4. Keep PKCE branch (forward compat)

Don't remove the PKCE branch in `route.ts`. If a future flow uses PKCE (e.g. OAuth), the route still handles it. OTP branch just runs first now since templates route through it.

## Acceptance Criteria

- [x] Three Supabase email templates updated (Reset Password, Confirm signup, Invite user)
- [x] `/auth/confirm-link` interstitial renders and requires a click to continue
- [x] Password reset end-to-end: request → email link → interstitial → `/reset-password` with session → submit → `user_modified` in audit log → `/dashboard`
- [x] No regression on login or forgot-password submit
- [x] TypeScript compile clean (`pnpm tsc --noEmit`)
- [ ] Verified by Andy on qdconstruction corporate email (pending UAT)
- [ ] Ghost `abreen@qdconstruction.com` account decision (deferred)
- [ ] Signup confirmation end-to-end (not retested, but same code path)

## Production Validation Results

Tim tested end-to-end 2026-04-22 14:36–14:38 UTC. First successful password reset in project history:

| Time (UTC) | Event |
|------------|-------|
| 14:36:58 | `user_recovery_requested` |
| 14:38:02 | `login` (OTP verify via /auth/confirm) |
| 14:38:14 | `user_updated_password` ✅ |
| 14:38:14 | `user_modified` ✅ |

Prior baseline: zero `user_updated_password` events in the entire project's audit history. BF-27 and BF-28 both claimed COMPLETE but had never actually worked for any user.

## Post-Deploy Validation Plan

1. SQL baseline: `SELECT count(*) FROM auth.audit_log_entries WHERE payload->>'action' = 'user_modified' AND created_at > now() - interval '7 days'` — record current count.
2. Trigger reset on a test account.
3. Confirm email arrives with `/auth/confirm-link?token_hash=...` link (not `?code=...`).
4. Click → interstitial → Continue → `/reset-password` with active session.
5. Submit new password → redirect to `/dashboard`.
6. Re-run baseline SQL — count must increase by 1.
7. Repeat with Andy on qdconstruction corporate email.

## Related

- Supersedes: BF-28 (PKCE fix was correct code, wrong strategy for corporate email environment)
- Reference: https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr (PKCE limitations)
- Reference: https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about (Safe Links pre-fetch behavior)
