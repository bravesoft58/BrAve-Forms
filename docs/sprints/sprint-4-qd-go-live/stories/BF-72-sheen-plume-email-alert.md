# BF-72: Email the project's waterway contact when sheen/plume is answered Yes

**Type:** Feature (first outbound email from the app)
**Priority:** HIGH (a visible sheen is a reportable event under the waterway permit; the contact must hear about it the same day)
**Points:** 3
**Status:** NOT STARTED
**Sprint:** 4 (backlog)
**Reported by:** Gracie's handwritten note beside "Visible sheen/plume?" on her 2026-10-07 test submission: "Can I get alerted if someone submits 'yes' here?" Forwarded by Andy Breen 2026-10-08; not in Andy's bullet list. Filed under [docs/reference/WIW-Gracie-comments-2026-10-08.pdf](../../../reference/WIW-Gracie-comments-2026-10-08.pdf).
**Created:** 2026-10-08
**Last Updated:** 2026-10-08T14:35:51Z

## Problem

A crew member can submit a Working in Waterways inspection with sheen/plume = Yes and nobody is told. Gracie finds out when she opens the app. The app sends no email today: Supabase only sends its own sign-in and invite mail, through a rate-limited mailer meant for auth, not application messages.

Decisions already made (Tim, 2026-10-08):
- **Email only.** Text messaging rejected: a second provider, per-message charges, and more to keep running. Reopen when a customer asks and will pay for it.
- **Recipient is the project's waterway contact** ([BF-70](BF-70-waterways-gracie-small-asks.md) adds the field). No separate alert setting.

## Proposed change

- **Provider.** One transactional email service with a plain HTTP API; scout picks. Candidates include Resend and Postmark. Free-tier and pricing claims are unverified as of 2026-10-08 and must be checked with a date at scout time, along with sending-domain requirements. One API key in Vercel; a sending address on a domain Tim controls, with SPF and DKIM set so the mail is not filtered. [BF-65](BF-65-submission-idempotency.md) named "a second non-database side effect per submit (email, webhook)" as its reopen trigger; this is that.
- **Trigger.** In the Working in Waterways create and edit actions, after the row is saved: if `sheen_or_plume.value` is "Yes" and the project has `waterway_contact_email`, send one email. On edit, send only when the answer changed to Yes (compare with the loaded version the edit already carries), so a comment fix does not re-alert.
- **Content.** Subject: "Sheen/plume reported: {project} / {site} / {date}". Body: project, site, date and time, initials, the sheen comment, a link to the submission, and the hint that the contact should act on it. No photos in the mail; the link covers it.
- **Reliability.** The save must never fail because the email failed: send after the write, catch and log the failure, and record `alert_sent_at` (or an `alert_error`) on the submission so the view can show "Contact emailed at ..." or "Email failed; call {name}". A retry of the submit (BF-65 replay) must not send twice: key the send on the submission id and the idempotency check, or on `alert_sent_at` being null.
- **Where it runs.** Server action in Vercel, not a database trigger: the secret stays in Vercel, the project contact lookup is already there, and nothing new runs inside Postgres. A database trigger plus `pg_net` is the alternative if the action path proves unreliable; note in scout why one was chosen.
- **Testing.** A unit test on the "send or not" decision (new Yes, edit to Yes, edit keeping Yes, edit away from Yes, no contact set). One real send to Tim from preview, then one to Gracie from production as the closeout gate.

## Acceptance criteria

- [ ] Submitting a waterways inspection with sheen/plume = Yes on a project with a waterway contact emails that address within a minute, with the subject and body above and a working link.
- [ ] No contact set, or answer No or N/A: no email, no error.
- [ ] Editing a Yes record without changing the answer sends nothing; editing No to Yes sends once.
- [ ] A retried submit (lost reply, resend) sends one email, not two.
- [ ] Provider outage: the inspection still saves; the view shows the email failed and names the contact to call.
- [ ] API key is in Vercel env only; nothing in the repo; sending domain has SPF and DKIM.
- [ ] Gracie receives a real alert from production and confirms it is what she wanted.

## Depends on

- [BF-70](BF-70-waterways-gracie-small-asks.md) (waterway contact field). Build after it merges.
