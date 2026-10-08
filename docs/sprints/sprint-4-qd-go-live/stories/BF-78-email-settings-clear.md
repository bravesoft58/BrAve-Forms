# BF-78: Let an org admin clear the email settings

**Type:** Feature gap (BF-74 follow-up; the setup sheet promises it)
**Priority:** MEDIUM (offboarding only, but a dead configuration nags every admin forever)
**Points:** 1
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** BF-74 `/verify` round 1 (finding V1, verify, medium), filed at closeout 2026-10-08
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T17:34:52Z

## Problem

The setup sheet (`docs/customer-setup/microsoft-365-email-alerts.md`, "To remove access") tells the admin to delete the Entra app and then clear the settings in BrAve Forms. The Settings page can only save and test. A removed configuration keeps its ciphertext, every alert attempt fails and logs, and from 30 days before the entered expiry every org admin sees the expiry banner permanently.

## Proposed change

- A "Remove email settings" button in the settings section, with an inline confirmation in the same style as BF-75 ("Remove the Microsoft 365 settings? Alerts will stop until they are entered again. [Keep] [Remove]").
- The action checks `is_org_admin` on the caller's session, then deletes the organization's row through the service client (DELETE is already granted to `service_role` by the BF-74 migration). Afterwards the page shows the empty form and `sendOrgEmail` returns `not_configured`, which BF-72 already reports as "Email alerts are not set up".

## Acceptance criteria

- [ ] An org admin can remove the settings after confirming; the row and its ciphertext are gone, and the expiry banner disappears.
- [ ] A non-admin cannot remove them (server check).
- [ ] After removal, `sendOrgEmail` returns `not_configured`.
- [ ] `pnpm build`, lint, tests clean.

## Depends on

- [BF-74](BF-74-org-email-settings-m365.md) (merged `66ec348`). Share the confirmation component with [BF-75](BF-75-cancel-on-every-form.md) if that lands first.
