# BF-56: Inspector QR never changes; the scanned session expires

**Type:** Inspector portal design change
**Priority:** MEDIUM (posted QR codes on site should not go stale)
**Points:** 3
**Status:** IN PROGRESS
**Sprint:** 4
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Depends On:** BF-62 (Next.js security upgrade), Tim 2026-09-23
**Last Updated:** 2026-09-24T17:23:31Z

## Request (verbatim)

> Make inspection QR Code not expire. Need to see how we make it so that QR Code never changes but the link expires so user must go to site to re-scan code and not just refresh browser.

Two requirements in one: the printed QR must stay valid indefinitely, and access obtained by scanning must lapse so an inspector has to be physically on site to get back in.

## Current state

- `generateQrToken` in the projects server actions inserts a `qr_tokens` row with a random `token` (uuid) and `expires_at` = now + 30 days.
- The token IS the URL: `/inspector/[token]`. `validateToken` in the inspector queries looks the token up with `expires_at > now()`.
- Consequence: when a token expires, the only remedy is generating a new token, which is a new URL and therefore a new QR to print and post. The opposite of what Andy wants.
- Live: 7 unexpired tokens, expiring between 2026-09-30 and 2026-10-09. The three kept projects will go dark within three weeks of go-live unless this changes or someone regenerates.
- Inspector access is deliberately account-free and read-only (established decision). This ticket keeps that.

## Proposed design

Split the identifier from the session.

1. **Stable QR identifier.** A per-project, non-expiring `qr_tokens` row (or a new `expires_at IS NULL` meaning for the existing column, plus a `kind` column: `stable` or `session`). The printed QR encodes `/inspect/[stable-token]`. It never changes unless an admin explicitly revokes and reissues it.
2. **Scan mints a short-lived session.** Hitting `/inspect/[stable-token]` validates the stable token, inserts a session row (`session` kind, `expires_at` = now + N), sets an HttpOnly cookie carrying the session id, and redirects to the portal. The stable URL is not what the browser stays on.
3. **Portal reads the session, not the stable token.** `/inspector/...` requires a valid unexpired session cookie. Refreshing after expiry shows "session expired, re-scan the QR on site".
4. **Signed file URLs already expire** (private buckets, BF-32). Keep their lifetime at or below the session lifetime.
5. **Admin UI.** Project page shows the stable QR, its issue date, a "revoke and reissue" action, and the configured session length.

## The honest limitation

A stable URL can always be typed or bookmarked. Anyone who has it can re-open it without re-scanning. The design above prevents the *refresh* case Andy describes (the browser lands on a session URL, not the stable one, and the session dies), and the stable URL is only ever shown inside a QR image, not as text. It does not prevent a determined user from decoding the QR once. If that matters, the alternative is rotating tokens with automatic reprint, which conflicts with "never changes". Confirm with Andy that the scan-to-session behaviour is what he means.

## Technical Approach (scout, 2026-09-23T13:42:52Z)

**Build vs Use:** BUILD — a Postgres-backed session row plus one Next.js Route Handler (~40 lines of session logic), on the stack already in the repo. No registry standard covers sessions/auth. iron-session and jose (signed stateless cookie) were considered and not chosen: both need a new server secret in every Vercel target and still need a database check per request to make revoke immediate, so they add a dependency without removing the table read. Reopen when: the portal needs sessions that survive without a database round trip (high traffic or offline), or a second anonymous-capability flow appears that would share the mechanism.

### What the code does today (verified 2026-09-23)

- `QrCodeModal` calls `generateQrToken` on every open, and each call inserts a new 30-day `qr_tokens` row. That is why the code "changes": every modal open is a new URL. Production has 8 rows across 2 projects (NDOT 4541 7 Bridges 6, Microsoft NVE 2), 7 unexpired, last expiry 2026-10-09. 17446 Deodar St has none.
- `/inspector/[token]` is a Server Component page. `validateToken` checks `expires_at > now()` with the service client and the page renders `getPortalData` directly. There is no session; the token URL itself is the access.
- `generateQrToken` has no role check; only the button render is admin-gated (`user?.role === "admin"` on the project page).
- `qr_tokens_all` (BF-42, `20260504160000_org_scoped_visibility.sql`) is `FOR ALL TO authenticated` for **any org member**, not org admins. The story's last AC assumes an admin-only BF-36 policy that no longer exists.
- Signed file URLs in the portal use a 3600 s TTL (`signFileUrlsService` default), already below a 12 h session, so the signed-URL AC is met as-is. Consequence to accept: images and document links in an open portal tab go stale after an hour until the page is refreshed, and a refresh re-signs while the session is valid.
- The portal renders all five shipped form types (`FormDetail` switch). BF-58 adds its renderer there; nothing in BF-56 needs to change for "all forms from one QR".

### Recommended design (refines "Proposed design" above)

1. **Migration.**
   - `qr_tokens`: make `expires_at` nullable (NULL = stable, never expires), add `revoked_at timestamptz`. Partial unique index `(project_id) WHERE expires_at IS NULL AND revoked_at IS NULL` so a project has at most one active stable code.
   - New table `inspector_sessions (id uuid pk default gen_random_uuid(), qr_token_id uuid not null references qr_tokens(id) on delete cascade, created_at timestamptz not null default now(), expires_at timestamptz not null)`. RLS enabled with no policies; revoke anon/authenticated table privileges explicitly (BF-60 direction). Only the service client touches it. Prefer this over a `kind` column on `qr_tokens`, which would put session rows under the org-member-readable `qr_tokens_all` policy.
   - Tighten `qr_tokens` writes to org admins (and super admin) in this migration; reads stay org-scoped. Decided by Tim 2026-09-23.
2. **Scan endpoint** `src/app/inspector/[token]/route.ts` (GET), replacing today's page at the same path. Validate: token exists, `revoked_at IS NULL`, and `expires_at IS NULL OR expires_at > now()`. Insert an `inspector_sessions` row with `expires_at = now() + 12 h`, set cookie `inspector_session=<session id>` (`httpOnly`, `secure`, `sameSite: "lax"`, `path: "/inspector"`, `maxAge: 43200`) on a `NextResponse.redirect` to `/inspector`. Invalid or revoked token: redirect to `/inspector?e=invalid` (or render a static message) without setting a cookie. Keeping the `/inspector/[token]` URL shape means every QR already printed keeps working as a scan entry until its own 30-day expiry, with no reprint forced on release day.
3. **Portal page** `src/app/inspector/page.tsx`: read the cookie with `await cookies()`, load the session joined to its token, require `session.expires_at > now()`, `token.revoked_at IS NULL`, and token not expired. On any failure render "Session expired, scan the QR code on site again" and no project data. Enforce this in the page, not in `proxy.ts` (see the Next.js advisories below).
4. **Admin side.** Replace "insert on every open" with get-or-create of the project's one stable token. Add `revokeAndReissueQrToken(projectId)` that stamps `revoked_at` on the active stable token and creates a new one; sessions die with it because the portal re-checks the token on every load. Put an admin check inside both server actions, not only around the button (lessons-learned: admin-only UI must check role server-side).
5. **Session length.** 12 h per Andy. Keep it one named constant; the ticket said "configured session length" in the admin UI, but a display of the constant is enough unless Andy asks to change it.

### Gotchas to carry into /story

- `cookies().set()` works only in a Route Handler, Server Action or Server Function, never during Server Component render. So the scan must be a Route Handler; it cannot stay a page.
- `await cookies()` in Next.js 16 (async API). Set the cookie on the redirect response object in the handler rather than relying on a write followed by `redirect()`.
- Link previewers and mail scanners (iMessage, Slack, Outlook) prefetch GET URLs. A scan that only mints a session row is safe against that; the stable token must never become single-use, or a prefetch would burn it.
- Next.js 16.1.6 (repo pin) is inside the affected range of two proxy/middleware bypass advisories: CVE-2026-44573 (fixed 16.2.5) and CVE-2026-64642 / GHSA-6gpp-xcg3-4w24 (all `>=16.0.0 <16.2.11`, Turbopack + single locale, fixed 16.2.11). Current docs are at 16.3.6. BF-56 must not use `proxy.ts` as its access gate. The upgrade itself belongs to the dependency readiness gate, not this story. [verified 2026-09-23]
- Supabase signed URLs need `expiresIn` in seconds; the batch call preserves input order (already relied on). No change needed.
- `react-qr-code` in the repo is `^2.0.18`; 2.2.0 is current on npm. No change required for this story. [verified 2026-09-23]

### Feasibility

3 SP is at the upper edge: one migration, a route handler, a moved portal page, query refactor, and two admin actions plus modal changes, about 250 lines of app code. Doable without a split if the admin UI stays minimal (show the code, issue date, and a "revoke and reissue" button). If the policy tightening is added, count it inside the migration, not as a separate story.

### Decision to record before build (AC 6)

Recommended: legacy 30-day tokens keep working as scan entries until they expire (the route accepts `expires_at > now()`), and each project gets one stable token that the admin prints once. No bulk migration of existing rows. The alternative, promoting one existing token per project to stable, would bless whichever code happens to be printed, and on the NDOT project there are five candidates.

## Research Sources

- firecrawl_scrape https://nextjs.org/docs/app/api-reference/functions/cookies → docs at 16.3.6; `.set` only in Server Functions, Route Handlers, Server Actions; not during Server Component rendering; supports httpOnly/secure/sameSite/maxAge/path.
- firecrawl_search "Next.js 16 cookies set in route handler redirect" → https://github.com/vercel/next.js/issues/81570 and https://github.com/vercel/next.js/issues/51875 → cookies cannot be modified outside Server Actions or Route Handlers.
- firecrawl_scrape https://qasimcode.com/blog/2026-04-30-nextjs-16-cookies-set-redirect-fix → in Next.js 16 `cookies()` is async; an un-awaited write before `redirect()` is lost.
- firecrawl_search "iron-session vs jose signed cookie session Next.js App Router 2026" → https://github.com/vvo/iron-session/issues/594 → iron-session sessions must be written from a route handler or middleware in App Router; https://www.authgear.com/post/nextjs-session-management/ → stateful vs stateless trade-offs, jose signing.
- firecrawl_search "anonymous magic link capability URL exchange for session cookie" → https://www.sndr.sh/use-cases/magic-links → prefetchers (Outlook Safe Links, Slack, iMessage) hit GET links; never auto-consume a one-time token on GET.
- firecrawl_search "link preview prefetch GET request consumes one-time token" → https://obie.medium.com/prefetching-breaks-magic-link-password-less-login-systems-unless-you-take-precautions-a4c011a3e165 → same finding, GET should be safe and idempotent.
- firecrawl_search "Next.js 16.1 security advisory CVE 2026" → https://www.sentinelone.com/vulnerability-database/cve-2026-44573/ → auth bypass, fixed 16.2.5; https://nextjs.org/blog/july-2026-security-release and https://github.com/advisories/GHSA-6gpp-xcg3-4w24 → proxy bypass with Turbopack + single locale, affected `>=16.0.0 <16.2.11`, fixed 16.2.11. [verified 2026-09-23]
- firecrawl_search "iOS camera QR code opens Safari vs in-app browser cookies" → https://apple.stackexchange.com/questions/256444/ios-qr-code-scanner-that-can-open-urls-in-the-default-browser → the iOS camera opens scanned URLs in Safari, so the session cookie lands in the browser the inspector keeps using.
- firecrawl_search "QR code static URL short-lived session" → https://www.wwpass.com/blog/qr-code-login-without-the-risk-enterprise-patterns-quishing-defenses → static QR codes are long-lived bearer credentials; supports keeping the scan as an entry point only and bounding access by a server-side session. [verified 2026-09-23]
- firecrawl_search "react-qr-code npm latest version 2026" → https://www.npmjs.com/package/react-qr-code → 2.2.0 current. [verified 2026-09-23]
- firecrawl_search "supabase storage createSignedUrls expiresIn" → https://supabase.com/docs/reference/javascript/file-buckets-createsignedurls → `expiresIn` is required, in seconds.
- Not run: Phase 2g literature search. The story has no algorithm or model component; it is plumbing on established patterns.

## Acceptance criteria

- [x] A project's QR code, once generated, resolves to the same URL indefinitely.
- [x] Scanning it opens the inspector portal without an account.
- [x] After the session window (12 hours, confirmed by Andy 2026-09-23), refreshing the portal shows an expired message and does not render project data.
- [x] Re-scanning the same QR after expiry works.
- [x] Admin can revoke and reissue a project's QR; the old one stops working immediately. The revoke itself (the old code refused, open sessions ended on their next load) was proven by the e2e script, and the database side by probe T8 and T9. The modal's button was not clicked on a live project (Tim, 2026-09-24); see the validation table.
- [x] Existing 30-day tokens keep working as scan entries until their own expiry (no break for already-printed codes); each project gets one new stable code that the admin prints once. No bulk migration of existing rows. (Tim, 2026-09-23)
- [x] Signed photo and document URLs expire no later than the session.
- [x] RLS on `qr_tokens` restricts INSERT, UPDATE and DELETE to org admins and super admins (tightened from the BF-42 org-member policy), proven by a rolled-back impersonation probe (member refused, org admin allowed); the QR server actions also check admin role server-side; the inspector path still uses the service client with token validation. (Tim, 2026-09-23)

## Implementation (2026-09-24)

**Build vs Use:** BUILD, per the scout's verdict above. There are no new dependencies.

| File | Change |
| --- | --- |
| `supabase/migrations/20260924162749_inspector_stable_qr_sessions.sql` (+ `_rollback/`) | Stable tokens (`expires_at` NULL) and `revoked_at`; one active stable token per project; `inspector_sessions` (RLS on, no policies, grants revoked); `qr_tokens` writes limited to org admins and super admins. Applied to production 2026-09-24 as version `20260924163446` (Tim's go). |
| `src/lib/inspector/constants.ts` | Session hours (12), cookie name and path; safe to import on the client. |
| `src/lib/inspector/session.ts` | `openSessionForToken` and `getSessionProjectId`, using the service client. Token rule: not revoked, and `expires_at` NULL or in the future. |
| `src/app/inspector/[token]/route.ts` | GET handler that replaces the old page at the same URL. Mints a session, sets an httpOnly, secure, lax cookie scoped to `/inspector` for 43200 s, and returns 303 to `/inspector`. A bad scan goes to `?link=invalid` and clears the cookie. |
| `src/app/inspector/page.tsx` | Portal gated on the session. The token is re-checked on every load, so a revoke takes effect on the next request. |
| `src/app/dashboard/projects/qr-actions.ts` | `getOrCreateStableQrToken` and `revokeAndReissueQrToken`, both with a server-side admin check. Revoke covers stable and legacy tokens, and detects an RLS-refused update. Split out of `actions.ts`, which would otherwise pass 300 lines. |
| `src/components/inspector/QrCodeModal.tsx` | Stable code, issue date, and revoke confirmed inline in the page (no browser dialog). |
| `src/lib/queries/inspector.ts` | `validateToken` removed (superseded by `session.ts`). |

Decision made during the build: revoke-and-reissue revokes every active token on the project, including legacy 30-day codes. An admin who revokes means "cut access", and a surviving legacy code would quietly defeat that. Consequence: revoking on a project with posted legacy codes kills those codes too.

Signed URLs: the portal signs photo and document URLs for 3600 s (`signFileUrlsService` default), which is under the 12 h session. No change was needed.

## Comprehensive Validation (2026-09-24T17:23:31Z)

Two suites: `Testing/security/bf56_qr_rls_probe.sql` (10 checks, rolled back) and `Testing/security/bf56_session_e2e.mjs` (17 checks, its own test rows only). All pass.

| # | Check | Result | Key finding |
|---|---|---|---|
| 1 | Probe against pre-migration production (RED) | FAIL as expected | A plain member could INSERT, and could UPDATE and DELETE 7 `qr_tokens` rows on the NDOT project. This is the gap the policy closes. Rolled back. |
| 2 | Migration and probe rehearsal in one rolled-back block | PASS 10/10 | Production confirmed unchanged afterwards (no `inspector_sessions`, still `qr_tokens_all`, `expires_at` NOT NULL). |
| 3 | Probe against production after applying the migration | PASS 10/10 | Member reads 6 NDOT tokens but INSERT gets 42501 and UPDATE/DELETE touch 0 of them. Org admin can insert, a second stable token gets 23505, revoke hits exactly 1 row, reissue works. `authenticated` and `anon` get 42501 on `inspector_sessions`. |
| 4 | e2e on `next start` (:3156) against production | PASS 17/17 | The cookie carries HttpOnly, Secure, SameSite=lax, Path=/inspector and Max-Age=43200. The session row is bound to the scanned token and expires in 12.000 h. The portal renders the scanned project's name. No cookie, a forged cookie, or an expired session all show "Session Expired" with no project data. Re-scan gives a new session while the token stays unchanged. Revoke ends the open session on the next load. A revoked scan goes to `link=invalid` and clears the cookie. A live legacy token works and an expired one is refused. Malformed and unknown tokens are refused. Cleanup left 0 test tokens and 0 test sessions. |
| 5 | Preview `dpl_2yRBMPbohLB4fwNTWy2Kxxqr4qmS`, signed in as Tim | PASS | The Deodar St modal showed stable token `e7de7102…`. After a page reload the modal showed the same token. The database holds 1 stable row. The scan landed on `/inspector` with the Deodar St portal. Evidence in [artifacts/BF-56](../artifacts/BF-56/README.md). |
| 6 | Revoke button in the modal | NOT CLICKED | Tim, 2026-09-24: clicking it on a live project would also revoke that project's 30-day code. The action's database and route effects are covered by #3 and #4. |
| 7 | Supabase security advisor after the migration | PASS | The only new item is INFO `rls_enabled_no_policy` on `inspector_sessions`, which is intended because only the service client touches it. Other items predate this story. |
| 8 | tsc, eslint, next build (Node 24, pnpm 10.34.5) | PASS | tsc is clean; eslint shows 0 errors and the 9 pre-existing warnings; the build lists `/inspector` and `/inspector/[token]` as dynamic. |

Operational notes:
- The modal builds the QR link from the host it is opened on (`NEXT_PUBLIC_SITE_URL`, else `window.location.origin`). Admins should print codes from production. The token is what stays stable.
- Production now has one stable code: 17446 Deodar St, token `e7de7102…`, created during check #5.

## Decisions (Tim, 2026-09-23)

- Only admins manage QR codes: the database policy and the server actions both enforce it, not just the button.
- Already-printed 30-day codes keep working until they expire; one new stable code per project, printed once.
- Upgrade Next.js first, as its own ticket (BF-62), so BF-56 is built and verified on a patched framework.

## Decisions (Andy, 2026-09-23)

- Session length: 12 hours after a scan.
- One QR code per project. Every form type on the project, including Working in Waterways once BF-58 lands, is reachable from that single code. No per-site codes.

## Open questions (resolved)

- Session length. Andy's intent is "must be on site", which suggests hours, not days.
- Should the stable token be per project, or per project per waterway site (relevant once BF-58 lands and projects have multiple inspection locations)?
