# BF-66 evidence

**Created:** 2026-09-25
**Last Updated:** 2026-09-25T17:20:38Z

Signed-in browser pass on the Vercel preview of `feature/BF-66-form-reset` at `ba20a46`, 2026-09-25, as Tim (admin). Previews use the production database, so every submit was built to be rejected by the server. Each was confirmed rejected: the page did not redirect and showed "Please fix the errors below". Afterwards production was checked: RNO 18's superintendent phone unchanged, no new submissions, and the real dust log `b1e9831b` still has 1 entry.

Method per form: move every dropdown (and radio group) away from its default, force a server rejection, record what the screen shows, submit with the form's own button (by label, never the header Log out), and compare the screen after the rejection. The rejection was forced by clearing a required field, or, for forms with no required field (NDEP SAD, NNPH), by setting one choice field in the hidden data payload to `BOGUS` just before the click.

| File | Form | Rejected by | Kept on screen after the rejection |
| --- | --- | --- | --- |
| `01-dust-log-new-rejected-values-kept.jpg` | Daily Dust Log, new | Time cleared ("Time is required") | 4 dropdowns (N, Powdery, Dry, N) |
| (no screenshot) | NDEP Weekly Stormwater, new | `weather` = BOGUS | 50 dropdowns and 25 text fields, checked twice; the screenshot tool was blocked on this page both times by another browser extension (password manager overlay) |
| `03-ndep-sad-rejected-values-kept.jpg` | NDEP SAD, new | `application_type` = BOGUS | 3 ticked checkboxes, the dropdown, 55 text fields |
| `04-nnph-rejected-checkboxes-radios-kept.jpg` | NNPH Dust Permit, new | `application_type` = BOGUS | 2 dust-control checkboxes ticked with real mouse clicks (matching the sent data), three Yes answers |
| `05-ndot-rejected-values-kept.jpg` | NDOT Weekly Stormwater, new (NDOT 4541) | `weather` = BOGUS | 42 dropdowns |
| `06-waterways-rejected-site-and-answers-kept.jpg` | Working in Waterways, new | No initials, no photo | Site "Eastern Drainage" and No / Fail / Pass / N/A, matching the sent data |
| `07-dust-log-append-rejected-values-kept.jpg` | Daily Dust Log, add entries to an existing log | New row's time cleared | 4 dropdowns; nothing appended |
| `08-project-form-rejected-typed-phone-kept.jpg` | Project setup, edit RNO 18 | Superintendent phone "123" ("Invalid US phone number") | The typed "123" (saved value 7753026359, which the old reset restored), 4 ticked permits, both waterway site rows |

A scripted `.click()` on the NNPH checkboxes did not tick them; real mouse clicks did, and Tim confirmed the checkboxes work by hand. The scripted-click result was a tooling artifact, not a bug.

The before-fix behaviour (blank controls after a rejected submit) was recorded on the BF-58.1 preview: `artifacts/BF-58.1/03-RED-form-reset-clears-select-and-radios.jpg`.
