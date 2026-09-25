# BF-58.1 evidence

**Created:** 2026-09-25
**Last Updated:** 2026-09-25T15:28:47Z

Signed-in browser pass on the Vercel previews of `feature/BF-58.1-waterways-form-core`, 2026-09-25, as Tim (admin), against production data (previews use the production database). Project: 17446 - RNO 18 Main Campus.

| File | What it shows |
| --- | --- |
| `01-no-sites-empty-state.jpg` | Before any sites existed: the new-form page shows the "no waterway sites yet" message and the admin's "Add waterway sites" link instead of an unusable form. |
| `02-project-setup-two-sites.jpg` | Project setup: the Waterway sites editor under the Waterway NDEP permit, with Western Drainage and Eastern Drainage entered. Saved; production then held both sites and the project still carried the working_in_waterways requirement. |
| `03-RED-form-reset-clears-select-and-radios.jpg` | Bug found on the first preview (commit `b4e9782`): after a rejected submit, the Site select and radio answers show blank while the hidden draft still sent "Western Drainage" / "Yes". Cause: React 19 resets a `<form action={fn}>` after the action. |
| `04-GREEN-answers-kept-after-rejected-submit.jpg` | Same steps on the fixed preview (commit `dbdd97b`): after the photo-rule rejection, the site and all four answers stay on screen. |
| `05-submitted-list-in-project-tab.jpg` | The Working in Waterways tab on RNO 18 after a successful submit with one photo: one submission listed, New Entry button present, no placeholder. |
| `06-view-page-fields-and-photo.jpg` | View page: site, date, Pacific time, initials, the four answers with comments, equipment text and the signed photo. |
| `07-view-actions-no-pdf-button.jpg` | View page actions: Back and Edit only; the Download PDF button is hidden for this type until BF-58.2. |
| `08-inspector-text-summary.jpg` | Inspector portal via RNO 18's stable QR code: the interim text summary after an edit (site now Eastern Drainage, sheen N/A), "1 photo attached", no raw JSON. |

Server-side results recorded without screenshots:
- A blank submit returned field errors for site, initials, all four answers and photos. A submit complete except the photo returned only "Attach at least one photo". Neither wrote a row.
- The edit (site to Eastern Drainage, sheen to N/A) saved; production showed the new values and exactly one `form_photos` row.

Clean-up, 2026-09-25: the test submission `55bef235` (initials BF58TEST) was deleted by id, and its photo `1790349990072-os94c7.jpg` was removed from `form-attachments` (re-list empty). Left in place on purpose: the two RNO 18 sites (real), and RNO 18's new stable inspector QR code, created by opening the Inspector QR modal on the preview. Open the modal once in production before printing it, as with Deodar St.
