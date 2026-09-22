# BF-57 evidence

Captured 2026-09-22 on the branch preview `brave-forms-9rbnisvia-embracingai.vercel.app` (commit 53e6298) against the production database, signed in as Tim (super admin). The test submission was created for this run on 17446 - Deodar St and deleted by SQL afterwards; no real inspection was touched.

| File | Shows |
| --- | --- |
| `01-pdf-after-edit-shows-edited-inspector-and-temperature-72.jpg` | Chrome's PDF viewer rendering `/api/forms/<id>/pdf` after the edit was saved: Inspector Name "BF-57 verify test EDITED" and Temperature "72", the two values changed in the edit form. Confirms AC 3's "PDF shows the edited values". |

The other checks (Edit link enabled, edit form hydration, Cancel leaves the row unchanged, 404 on a mismatched project id, RLS refusal for a non-owner member) are recorded as DOM and SQL readouts in the story file, not screenshots.
