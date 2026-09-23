# BF-56: Inspector QR never changes; the scanned session expires

**Type:** Inspector portal design change
**Priority:** MEDIUM (posted QR codes on site should not go stale)
**Points:** 3
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-23T13:42:52Z

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
   - Decide on `qr_tokens_all`: either tighten writes to `is_org_admin` in this migration (matches the admin-only UI) or correct the AC to say "org members, unchanged". Operator call; see corrections.
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

- [ ] A project's QR code, once generated, resolves to the same URL indefinitely.
- [ ] Scanning it opens the inspector portal without an account.
- [ ] After the session window (12 hours, confirmed by Andy 2026-09-23), refreshing the portal shows an expired message and does not render project data.
- [ ] Re-scanning the same QR after expiry works.
- [ ] Admin can revoke and reissue a project's QR; the old one stops working immediately.
- [ ] Existing 30-day tokens keep working until their expiry (no break for already-printed codes) or are migrated to stable tokens in the same release, decision recorded here.
- [ ] Signed photo and document URLs expire no later than the session.
- [ ] RLS on `qr_tokens` still restricts writes to org admins (BF-36 policy) and the inspector path still uses the service client with token validation.

## Decisions (Andy, 2026-09-23)

- Session length: 12 hours after a scan.
- One QR code per project. Every form type on the project, including Working in Waterways once BF-58 lands, is reachable from that single code. No per-site codes.

## Open questions (resolved)

- Session length. Andy's intent is "must be on site", which suggests hours, not days.
- Should the stable token be per project, or per project per waterway site (relevant once BF-58 lands and projects have multiple inspection locations)?
