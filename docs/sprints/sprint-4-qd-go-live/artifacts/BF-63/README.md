# BF-63 evidence

**Created:** 2026-09-28
**Last Updated:** 2026-09-28T13:33:00Z

AC 4 check on the Vercel preview of `feature/BF-63-submission-revision-history` (`8aa44e7`), 2026-09-28, signed in as Tim (admin). The revision trigger was already live in production (migration `20260928132447`), and previews use the production database, so the check wrote a clearly labelled test record and removed it afterwards with Tim's go.

| File | Shows |
| --- | --- |
| `01-test-submission-after-edit-water-yes.jpg` | The test Working in Waterways submission on RNO 18 (initials `TEST`, equipment "TEST BF-63, delete after check", one generated photo labelled TEST BF-63) after one edit through the app: "Is there water in the waterway?" changed from No to Yes. |

Steps and database read-back:

1. Submitted the form through the app with one photo; the photo uploaded through the form's own control as `1790602206446-gdson4.jpg`. Submission `c9334070-08d1-4ddf-8f0e-2f5585e24406`.
2. Edited it through the app (Save Changes), changing one answer No to Yes.
3. Read back: exactly one revision for the submission (id 6, UPDATE, `changed_by` Tim, `changed_role` authenticated). Its `old_row.data` held the answer No while the live row held Yes, and its photo list held `1790602206446-gdson4.jpg`, whose file exists in the `form-attachments` bucket (1 object). It was the only revision in the table, so no Q&D edit had happened since the apply.
4. Deleted the test submission with Tim's go (`DELETE ... WHERE id = ... AND data->>'initials' = 'TEST'`). Read back: revision id 7, DELETE, no user or role (direct SQL), `old_row.data` holding Yes and the same photo; the submission and its `form_photos` row are gone; the photo file is still in Storage; `form_submissions` back to 30 rows; the table holds 2 revisions, both for this test.

Both revisions and the photo file stay permanently: the history is append-only by design. They are identifiable by `submission_id` `c9334070-08d1-4ddf-8f0e-2f5585e24406` and the TEST markings in `old_row`.
