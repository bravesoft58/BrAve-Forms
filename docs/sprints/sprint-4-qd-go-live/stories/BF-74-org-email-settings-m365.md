# BF-74: Organization email settings: send through the customer's Microsoft 365

**Type:** Feature (first outbound application email; admin setup inside the app)
**Priority:** HIGH (blocks BF-72, the sheen/plume alert)
**Points:** 3
**Status:** IN PROGRESS
**Sprint:** 4 (backlog)
**Reported by:** Tim, 2026-10-08, splitting BF-72: Q&D runs Microsoft 365, so the app sends from a Q&D mailbox instead of a third-party email service, and each customer's admin enters their own Microsoft 365 details on a settings page.
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T16:51:43Z

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

- [x] An org admin can save the five fields; the secret is stored encrypted, is never sent back to the browser, and blank-on-save keeps it.
- [x] A non-admin, and an admin of another organization, cannot read or change the settings (server check plus no table grants; proven with a probe like BF-60's). Proven in the rolled-back rehearsal; re-run the probe on production after apply.
- [ ] "Send test email" delivers to the admin from the configured mailbox and records the result; a wrong secret shows a readable error and records the failure. (Code and stubbed tests done; a real send needs the migration applied, `EMAIL_SETTINGS_KEY` in Vercel and Microsoft-side setup.)
- [x] The expiry banner shows from 30 days before the entered date.
- [x] `sendOrgEmail` returns `not_configured` for an organization without settings, and never throws.
- [ ] Migration applied with RLS and explicit grants; `pnpm build`, lint, tests clean; no production file over 300 lines.
- [ ] With Andy's setup done, a test email from Q&D's mailbox arrives in a Q&D inbox (closeout gate).

## Depends on

- Nothing in code. The closeout gate needs Q&D's Microsoft-side setup ([setup sheet](../../../customer-setup/microsoft-365-email-alerts.md)).
- [BF-72](BF-72-sheen-plume-email-alert.md) depends on this story.

## Technical Approach

From the BF-74 scout (Engram Flow fact `8d9f3a52`, 2026-10-08; it was not written into this file, so it is recorded here), spot-checked during /story on 2026-10-08.

- **Graph token and sendMail: BUILD, plain `fetch`.** It is two HTTP calls. `@azure/msal-node` adds a token cache that serverless functions barely use, plus its dependencies.
- **Secret encryption: BUILD on `node:crypto`.** It uses AES-256-GCM. The organization id is bound in as associated data (AAD), so a ciphertext copied onto another organization's row does not decrypt. A `v1:` prefix names the key version, and the 16-byte tag length is fixed. Field-encryption libraries were low-adoption or stale.
- **App-side encryption instead of Supabase Vault.** Vault's plaintext is readable through `vault.decrypted_secrets` by any database superuser, including the Supabase MCP that agents use. App-side encryption splits trust: the key is in Vercel and the ciphertext is in the database.
- **Corrections to the proposal above, applied:**
  - The key column is `org_id` (matching `organization_members`), not `organization_id`.
  - The admin check is `is_org_admin` on the caller's own session client, not `profiles.role`. `users/actions.ts` `requireAdmin` still uses the legacy role.
  - Tests use `Testing/forms` with `node:test` (there is no `pnpm test` script).
- **Graph facts used** [verified 2026-10-08, Microsoft Learn user-sendMail page, updated 2026-06-19]:
  - sendMail returns `202 Accepted`. That means the message is queued, not delivered.
  - It saves to Sent Items by default.
  - App-only calls use `POST /users/{id | userPrincipalName}/sendMail` with `Mail.Send`.
- **Token error codes mapped** [verified 2026-10-08, Microsoft Entra error code reference, updated 2026-06-15]:
  - 90002 / 900023: bad tenant
  - 700016: app not found in the tenant
  - 7000215: invalid secret
  - 7000222: expired secret
  - The code is read from `error_codes`, never from `error_description`.
- **Unverified:** whether an out-of-scope mailbox under RBAC for Applications returns 403 or 404. The code treats 403 as "mailbox not permitted or permission not yet applied" and 404 as "mailbox not found". The first real failed send on Q&D's tenant will show which.

**Build vs Use:** BUILD — Graph client on `fetch` and secret encryption on `node:crypto`; msal-node, field-encryption libraries and Supabase Vault evaluated and rejected (reasons above). Reopen when certificate credentials or a second Microsoft API are needed (msal-node), or when a second encrypted field class appears (evaluate a maintained field-encryption library). [verified 2026-10-08]

## Research Sources

- WebFetch https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0: 202 Accepted (queued, not delivered); Sent Items by default; application `Mail.Send`; request body shape. [verified 2026-10-08]
- WebFetch https://learn.microsoft.com/en-us/entra/identity-platform/reference-error-codes: AADSTS90002 InvalidTenantName, AADSTS700016 app not found in the directory/tenant, AADSTS7000215 invalid client secret, AADSTS7000222 expired client secret keys, AADSTS7000112 app disabled; error JSON has `error`, `error_description`, `error_codes`. [verified 2026-10-08]
- WebSearch "@azure/msal-node ... latest version": a release mirror lists msal-node 5.3.0 (June 2026). The scout recorded 7.0.1. Not reconciled; it does not matter because msal-node is not used. [checked 2026-10-08]
- WebSearch "Supabase Vault vault.decrypted_secrets ...": https://supabase.com/docs/guides/database/vault, which says anyone with access to the view sees the decrypted secrets. [verified 2026-10-08]
- WebSearch on the Graph sendMail limits: secondary sources only (30 messages/min, 10,000 recipients/day per mailbox). Far above BF-72's volume. [checked 2026-10-08]

## Files

| File | What |
|---|---|
| `supabase/migrations/20261008164239_organization_email_settings.sql` (+ `_rollback/`) | The table. RLS on with no policies, nothing granted to `anon`/`authenticated`, `service_role` granted SELECT/INSERT/UPDATE/DELETE. The org FK cascades on delete; `updated_by` is set to null. **Not applied to production.** |
| `src/lib/email/secret-box.ts` | AES-256-GCM encrypt/decrypt bound to the org id. |
| `src/lib/email/graph-mail.ts` | Token plus sendMail on `fetch`; maps errors to reasons; never throws. |
| `src/lib/email/send-mail.ts` | `sendOrgEmail(orgId, { to, subject, text })`, the service BF-72 calls. |
| `src/lib/email/send-result.ts` | Result type, failure reasons, and their plain-words text. |
| `src/lib/queries/email-settings.ts` | `getAdminOrg()` (membership plus `is_org_admin` RPC on the user's session) and `getEmailSettingsView()` (never selects the ciphertext). |
| `src/lib/schemas/email-settings.ts` | Zod schema for the five fields, plus the expiry-warning helpers. |
| `src/app/dashboard/settings/{page,actions,email-settings-form}.tsx?` | The settings section, the save action and the test-email action. The form does not reset itself after a submit (BF-66 pattern); the secret input is cleared after a successful save. |
| `src/app/dashboard/settings/email-setup/page.tsx` + `next.config.ts` | The setup sheet rendered in the app from `docs/customer-setup` (traced into the deployment). |
| `src/components/email-secret-expiry-banner.tsx`, `src/app/dashboard/page.tsx` | The expiry banner on the dashboard home page. |
| `Testing/forms/bf74_email_settings_test.ts` | Unit tests (no network). |
| `Testing/security/bf74_email_settings_probe.sql`, `bf74_rehearsal.py` | Rolled-back access probe and the rehearsal builder. |

## Implementation evidence (/story, 2026-10-08T16:51:43Z)

| # | Check | Result |
|---|---|---|
| 1 | `Testing/forms/bf74_email_settings_test.ts` (Node 24.21.0) | PASS 19/19. Covers: the round-trip; another org's ciphertext or another key fails; tampering with body, tag or IV, and a truncated tag, are refused; the token request sends the secret with special characters intact; token and sendMail error mapping; the detail never contains the secret or the token; `sendOrgEmail` end to end with stubbed Supabase REST and Microsoft (`not_configured` without contacting Microsoft, the decrypted secret reaches the token endpoint, another org's ciphertext sends nothing, never throws); schema; expiry boundaries; static guards. |
| 2 | Regression: bf58_1 16, bf58_2 7, bf65 15, bf66 4, bf70 13, bf70 render 6 | 61 pass, 0 fail |
| 3 | Rehearsal: `python Testing/security/bf74_rehearsal.py` run on a throwaway `public.ecr.aws/supabase/postgres:15.8.1.070` with the repo migrations applied | PASS 17/17. The table, synthetic users and orgs are all absent afterwards. |
| 4 | The same rehearsal with an extra `GRANT SELECT ... TO authenticated` (mutant) | 3 FAIL (T2, T7 admin, T7 member), so the probe can fail |
| 5 | Rollback file on the rehearsal database | Table dropped cleanly |
| 6 | `next build` | Clean; `/dashboard/settings/email-setup` traces the setup sheet |
| 7 | `tsc --noEmit`; eslint on the touched files | 0 errors, 0 warnings |
| 8 | Largest production file | `email-settings-form.tsx` at 150 lines; no file is over 300 |

Rehearsal note: on a bare supabase/postgres image, `auth.uid()` reads only `request.jwt.claim.sub`. The probe sets both claim forms and fails if `auth.uid()` does not match the impersonated user. Without that, the member's "not an admin" check would pass on a null uid.

## Open before closeout (needs Tim)

1. **Apply the migration** with Tim's go (Supabase MCP `apply_migration`). Rename the repo file to the recorded version, then run `Testing/security/bf74_email_settings_probe.sql` on production (it rolls back; all 17 lines should read PASS).
2. **Set `EMAIL_SETTINGS_KEY` in Vercel** to 32 random bytes in base64 (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). Give Preview the **same value** as Production, or no key at all; never a different one. Previews use production data, so on a Preview with a different key the stored secret reads as unreadable, the page tells the admin to paste it again, and saving it there re-encrypts the production row with a key Production cannot read: production email then fails until someone re-pastes on Production (verify round 1, finding C2; the code does not enforce this yet). With no key, a Preview refuses to save, which is safe. Losing the key means every organization re-enters its secret.
3. Andy's Microsoft-side setup, then a real test email (ACs 3 and 7).
