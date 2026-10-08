# BF-72: Email the project's waterway contact when sheen/plume is answered Yes

**Type:** Feature (the first alert sent through the organization's email settings)
**Priority:** HIGH (a visible sheen is a reportable event under the waterway permit; the contact must hear about it the same day)
**Points:** 2
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** Gracie's handwritten note beside "Visible sheen/plume?" on her 2026-10-07 test submission: "Can I get alerted if someone submits 'yes' here?" Forwarded by Andy Breen 2026-10-08; not in Andy's bullet list. Filed under [docs/reference/WIW-Gracie-comments-2026-10-08.pdf](../../../reference/WIW-Gracie-comments-2026-10-08.pdf).
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T16:14:54Z

## Problem

A crew member can submit a Working in Waterways inspection with sheen/plume = Yes and nobody is told. Gracie finds out when she opens the app.

Decisions (Tim, 2026-10-08):
- **Email only.** Text messaging rejected: another provider, per-message charges, more to run. Reopen when a customer asks and will pay for it.
- **Recipient is the project's waterway contact** (`waterway_contact_email`, added by [BF-70](BF-70-waterways-gracie-small-asks.md), merged `d986c19`).
- **Sent through the organization's own Microsoft 365**, configured by the org admin in the app. That setup and the sending service are [BF-74](BF-74-org-email-settings-m365.md); this story only decides when to send and what to say. (Split from the original 3-SP BF-72 on 2026-10-08.)

## Proposed change

- **Trigger.** In the Working in Waterways create and edit actions, after the row is saved: if `sheen_or_plume.value` is "Yes" and the project has `waterway_contact_email`, call `sendOrgEmail` (BF-74). On edit, send only when the answer changed to Yes (compare with the loaded record), so a comment fix does not re-alert.
- **Content.** Subject: "Sheen/plume reported: {project} / {site} / {date}". Body: project, site, date and time, initials, the sheen comment, a link to the submission, and a line saying the contact should act on it now. No photos; the link covers them.
- **Reliability.** The save never fails because the email failed. Record `alert_sent_at` or `alert_error` on the submission (new columns, with their column grants for whichever client writes them) so the view shows "Contact emailed at ..." or "Email failed: call {name} at {phone}". A retried submit (BF-65 replay) sends once: send only while `alert_sent_at` is null.
- **Not configured.** `sendOrgEmail` returning `not_configured` records that and shows "Email alerts are not set up: call {name}" on the view.
- **Testing.** Unit test on the send-or-not decision (new Yes, edit to Yes, edit keeping Yes, edit away from Yes, no contact, not configured). One real send to Tim from preview, then one to Gracie from production as the closeout gate.

## Acceptance criteria

- [ ] Submitting with sheen/plume = Yes on a project with a waterway contact emails that address within a minute, from the organization's configured mailbox, with the subject and body above and a working link.
- [ ] No contact, or answer No or N/A: no email, no error.
- [ ] Editing a Yes record without changing the answer sends nothing; editing No to Yes sends once.
- [ ] A retried submit (lost reply, resend) sends one email, not two.
- [ ] Email fails or is not configured: the inspection still saves, and the view says so and names the contact to call.
- [ ] Gracie receives a real alert from production and confirms it is what she wanted.

## Depends on

- [BF-70](BF-70-waterways-gracie-small-asks.md) (merged `d986c19`): the waterway contact field.
- [BF-74](BF-74-org-email-settings-m365.md): organization email settings and `sendOrgEmail`.

## Technical Approach

Scouted 2026-10-08 (master `fa61b25`, code graph rebuilt from the same commit). No new dependencies.

**Design correction (blocking the "Proposed change" above):** the alert state must **not** be written onto `form_submissions`. Two triggers fire on every UPDATE of that table:
- `form_submissions_updated_at` bumps `updated_at`, which is the edit version BF-61/BF-65 compare. Writing `alert_sent_at` after a save would make anyone holding the form get "This submission changed since you opened it", including the crew member who just submitted and goes straight to Edit.
- `form_submissions_record_revision` (BF-63) records a revision for any change other than `updated_at`, so every alert would add a history row that is not an edit.

So the alert gets its own table, and the "send once" guard is an insert-claim on it instead of "only while `alert_sent_at` is null".

**Build vs Use**

| Component | Verdict | Source | Reopen when |
| --- | --- | --- | --- |
| Run the send after the response | USE | Next.js `after` from `next/server`, stable since 15.1; runs even when the action calls `redirect`; on Vercel it is kept alive by `waitUntil` for the route's max duration (Next.js docs, updated 2026-09-16, checked 2026-10-08). Repo is on 16.3.6. | n/a |
| Send-once guard | COPY | Insert-claim on a unique key (`INSERT ... ON CONFLICT DO NOTHING RETURNING`), the inbox/outbox dedup pattern; the same idea as BF-65's unique client key | n/a |
| Sending | USE | BF-74 `sendOrgEmail(orgId, { to, subject, text })`; never throws | n/a |
| Decision and message text | BUILD | two pure functions, no library | n/a |

**Migration** `submission_alerts`:
- `submission_id uuid REFERENCES form_submissions(id) ON DELETE CASCADE`, `kind text CHECK (kind IN ('sheen_plume'))`, `PRIMARY KEY (submission_id, kind)`.
- `status text CHECK (status IN ('sending','sent','failed','no_contact','not_configured'))`, `recipient text`, `reason text`, `detail text`, `created_at`, `updated_at`.
- RLS on. `GRANT SELECT TO authenticated` with a SELECT policy `EXISTS (SELECT 1 FROM form_submissions s WHERE s.id = submission_id)`: the submissions policy applies inside the subquery, so a user sees an alert exactly when they can see its inspection. `GRANT SELECT, INSERT, UPDATE TO service_role`. Nothing for `anon`; no INSERT/UPDATE for `authenticated` (a user must not be able to mark an alert "sent"). Per BF-60, every grant is explicit.
- Rehearse on production in a rolled-back block first (BF-70/BF-74 pattern), and probe that a member of another org cannot read a row.

**Code** (all under 300 lines; dependencies flow action -> alert service -> email service):
- `src/lib/alerts/sheen-alert.ts`:
  - `shouldSendSheenAlert(previous, next)`: true when `next.sheen_or_plume.value === "Yes"` and the previous value (none on create) was not "Yes".
  - `buildSheenAlertEmail(...)`: subject "Sheen/plume reported: {project} / {site} / {date}"; body with project, site, date, time, initials, the sheen comment, the contact line, and the link `${NEXT_PUBLIC_SITE_URL || "https://brave-forms.vercel.app"}/dashboard/projects/{id}/forms/working-in-waterways/{submissionId}` (the fallback already used by the users and password actions).
  - `runSheenAlert(submissionId, projectId)`: service client. It claims by inserting `status='sending'`; if no row comes back, another attempt owns it and it stops. It then loads the project's `organization_id`, `name` and `waterway_contact_name/_phone/_email`. With no email it sets `no_contact`. Otherwise it calls `sendOrgEmail` and sets `sent`, `not_configured` or `failed` (with `reason`, `detail`). It never throws; failures are logged.
- `working-in-waterways/actions.ts`: after a successful insert or update, when `shouldSendSheenAlert` is true, call `after(() => runSheenAlert(...))` **before** `redirect` (redirect throws). The create path also runs it on a BF-65 replay: the claim makes that a no-op, and it covers a first attempt that saved but died before scheduling. The update path already loads `existing.data`, so the previous answer is at hand.
- View page: read the alert row (session client) and show one line under the sheen answer: "Contact emailed at {time}" / "Email failed: call {name} at {phone}" / "Email alerts are not set up: call {name}" / "No waterway contact set" / "Sending..." (a row stuck in `sending` after a killed function reads "Email status unknown: call {name}").

**Behaviour to confirm with Tim (AC wording):** the primary key allows one sheen alert per inspection. Yes, then edited to No, then back to Yes does not send a second email. A failed or not-configured alert is not retried automatically; the view tells the reader to call. Retrying would need a claim that may take over a `failed` row, which is a small add if wanted.

**Gotchas:**
- Do not wrap `redirect` in try/catch; call `after` first.
- `after` callbacks cannot rely on the user's session for writes here; use the service client (the session would work in a Server Function, but the alert table is service-written by design).
- BF-60: the new table gets no default grants; the migration grants explicitly, including `service_role`.
- RLS-denied writes return no error through supabase-js. Not an issue for the service client, but probe the SELECT policy with real users.

**Forward conflicts:**
- None on the action file.
- BF-71 (photo download) and BF-75 (Cancel) touch the Waterways view page and form respectively: sequence matters, no collision.
- BF-79 moves a query out of `queries/projects.ts`: benign.

**Size:** 2 SP is tight with the migration, the claim, the view line and the probe. 3 SP is the honest estimate.

## Research Sources

- Next.js `after` API reference (firecrawl_scrape, page updated 2026-09-16, checked 2026-10-08): https://nextjs.org/docs/app/api-reference/functions/after. Runs after the response; executed even when `redirect` or `notFound` is called; stable since v15.1.0; Vercel uses `waitUntil`; duration is the route's max duration.
- Next.js `redirect` reference (firecrawl_search, 2026-10-08): https://nextjs.org/docs/app/api-reference/functions/redirect. Redirect from a Server Action; it throws, so it goes last.
- Vercel, common App Router mistakes (firecrawl_search, 2026-10-08): https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them. Do not call `redirect` inside try/catch.
- Outbox/inbox dedup pattern (firecrawl_search, 2026-10-08): https://milanjovanovic.tech/blog/implementing-the-outbox-pattern and https://thebackenddevelopers.substack.com/p/transactional-inbox-pattern-in-backend. The `INSERT ... ON CONFLICT DO NOTHING RETURNING` claim used here.
- No known `after`-specific bug found for Server Actions (firecrawl_search, 2026-10-08). Results were unrelated server-action issues (for example https://github.com/vercel/next.js/discussions/88767, a React 19 transition race fixed upstream in January 2026).
