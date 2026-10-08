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
