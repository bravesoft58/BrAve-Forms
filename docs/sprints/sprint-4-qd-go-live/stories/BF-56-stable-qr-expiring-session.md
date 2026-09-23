# BF-56: Inspector QR never changes; the scanned session expires

**Type:** Inspector portal design change
**Priority:** MEDIUM (posted QR codes on site should not go stale)
**Points:** 3
**Status:** NOT STARTED
**Sprint:** 4
**Reported by:** Andy Breen, email "BrAve Forms Update" 2026-09-07 (`docs/reference/BrAve Forms Update.msg`)
**Created:** 2026-09-20
**Last Updated:** 2026-09-23T13:26:20Z

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
