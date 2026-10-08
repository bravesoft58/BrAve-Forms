# BF-74: Organization email settings: send through the customer's Microsoft 365

**Type:** Feature (first outbound application email; admin setup inside the app)
**Priority:** HIGH (blocks BF-72, the sheen/plume alert)
**Points:** 3
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** Tim, 2026-10-08, splitting BF-72: Q&D runs Microsoft 365, so the app sends from a Q&D mailbox instead of a third-party email service, and each customer's admin enters their own Microsoft 365 details on a settings page.
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T16:14:54Z

## Problem

The app sends no application email; Supabase sends only its own sign-in and invite mail. BF-72 needs to email the project's waterway contact. Tim's decisions (2026-10-08):

- **Send through the customer's own Microsoft 365**, from a dedicated mailbox on their domain, using Microsoft Graph `sendMail`. No outside email service, no DNS work, and the mail comes from the customer's own domain.
- **Each organization configures it in the app**, as an org-admin activity, so the next customer does the same without a code change or a Vercel setting.
- **Not SMTP with a username and password.** Exchange Online turns off Basic authentication for SMTP AUTH by default from the end of December 2026 (Microsoft Exchange Team blog and office365itpros, checked 2026-10-08).

The Microsoft-side setup (shared mailbox, app registration, mailbox-scoped permission) is done by the customer's IT admin and cannot be done from the app. The steps are in [docs/customer-setup/microsoft-365-email-alerts.md](../../../customer-setup/microsoft-365-email-alerts.md).

## Proposed change

### Storage
- New table `organization_email_settings`, one row per organization: `organization_id` (PK, FK), `provider` (text, `'microsoft365'` for now), `tenant_id`, `client_id`, `sender_mailbox`, `client_secret_ciphertext`, `client_secret_expires_on` (date, entered by the admin), `last_test_at`, `last_test_ok`, `last_test_error`, `updated_by`, `updated_at`.
- **The client secret is a credential into the customer's company email.** Encrypt it in the app (AES-256-GCM, Node `crypto`) with a key held only in Vercel (`EMAIL_SETTINGS_KEY`), so a database read alone does not reveal it. Never return it to a browser: the page shows "set" and the expiry date only. Scout compares this with Supabase Vault and records why one was chosen.
- RLS on; **no grants to `anon` or `authenticated`**. The settings actions check `is_org_admin` for the caller's organization and use the service client. Per BF-60, the migration grants `service_role` explicitly.

### Settings page (`/dashboard/settings`, org admins only)
- Replace the placeholder with an "Email alerts (Microsoft 365)" section: tenant ID, client ID, sender mailbox, client secret (write-only; blank on save keeps the stored one), secret expiry date. A link to the setup sheet.
- **Send test email** button: sends to the signed-in admin's own address and records `last_test_*`. Errors from Microsoft are shown in plain words (wrong tenant or client ID, bad or expired secret, mailbox not in scope, permission not yet applied: allow up to 2 hours).
- **Expiry warning:** from 30 days before `client_secret_expires_on`, org admins see a banner on the dashboard.

### Sending service
- `src/lib/email/send-mail.ts` (service layer): `sendOrgEmail(orgId, { to, subject, text })` returns a result object `{ ok: true } | { ok: false, reason }`; it never throws to the caller. It reads the settings with the service client, decrypts the secret, gets an app-only token from `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` (client credentials, scope `https://graph.microsoft.com/.default`), and posts to `/v1.0/users/{sender_mailbox}/sendMail`. No organization configured: `{ ok: false, reason: "not_configured" }`.
- One small function behind which a second provider can be added later; no provider abstraction beyond that until a second customer needs one.
- Scout checks whether a maintained library is worth using (for example `@azure/msal-node` for the token, or plain `fetch`), and current Graph `sendMail` limits.

## Acceptance criteria

- [ ] An org admin can save the five fields; the secret is stored encrypted, is never sent back to the browser, and blank-on-save keeps it.
- [ ] A non-admin, and an admin of another organization, cannot read or change the settings (server check plus no table grants; proven with a probe like BF-60's).
- [ ] "Send test email" delivers to the admin from the configured mailbox and records the result; a wrong secret shows a readable error and records the failure.
- [ ] The expiry banner shows from 30 days before the entered date.
- [ ] `sendOrgEmail` returns `not_configured` for an organization without settings, and never throws.
- [ ] Migration applied with RLS and explicit grants; `pnpm build`, lint, tests clean; no production file over 300 lines.
- [ ] With Andy's setup done, a test email from Q&D's mailbox arrives in a Q&D inbox (closeout gate).

## Depends on

- Nothing in code. The closeout gate needs Q&D's Microsoft-side setup ([setup sheet](../../../customer-setup/microsoft-365-email-alerts.md)).
- [BF-72](BF-72-sheen-plume-email-alert.md) depends on this story.
