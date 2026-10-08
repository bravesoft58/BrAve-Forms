# BF-76: Only Production may write the email settings secret

**Type:** Hardening (BF-74 follow-up; a Preview deployment can break production email)
**Priority:** MEDIUM (needs a Preview given its own key plus a save there; today Preview has no key, which is safe)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-74 `/verify` round 1 (finding C2, Codex and verify, medium), filed at closeout 2026-10-08
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T17:34:52Z

## Problem

Preview deployments read and write the production database. The client secret in `organization_email_settings` is encrypted with `EMAIL_SETTINGS_KEY`, which lives in Vercel. If a Preview is ever given a different key, opening Settings there reports the secret as unreadable and tells the admin to paste it again; saving re-encrypts the production row with the Preview key, and Production stops sending email until someone re-pastes on Production.

At closeout (2026-10-08) the key was set on Production only, so a Preview refuses to save. Only an instruction protects that; the code does not.

## Proposed change

- The save and test actions refuse to write the secret unless `VERCEL_ENV === "production"` (local development keeps working against a local or non-production database only; decide the dev rule at scout). On a Preview the settings section is read-only with a short note.
- Alternative for scout to weigh: store a short key fingerprint (an HMAC of a fixed label under the key) beside the ciphertext and refuse to overwrite a row written under a different key. This also protects a future second environment.

## Acceptance criteria

- [ ] On a Preview deployment, with or without a key, the secret cannot be saved and the page says why.
- [ ] Production saves and tests as before.
- [ ] Unit test on the environment guard; `pnpm build`, lint, tests clean.

## Depends on

- [BF-74](BF-74-org-email-settings-m365.md) (merged `66ec348`).
