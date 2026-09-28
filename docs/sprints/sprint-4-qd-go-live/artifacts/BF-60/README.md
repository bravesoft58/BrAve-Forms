# BF-60 evidence

**Last Updated:** 2026-09-28T20:31:46Z

| File | What it shows |
|---|---|
| `01-rehearsal-roundtrip-44-of-44.txt` | Rolled-back rehearsal on production: migration spliced into `Testing/security/bf60_grants_probe.sql`, then the rollback. Each case shows the live pre-BF-60 outcome ("before", the hole) and the migrated one ("after"). Visibility is identical for every table and tier, and the rollback restores the grant state exactly. 44 of 44, nothing persisted. |
| `02-bf59-suite-tightened-baseline-13-of-13.txt` | The BF-59 suite with T10 (now includes PUBLIC) and T12 (exact WITH CHECK) tightened, run on production before apply: 13 of 13. |
| `03-production-after-apply-43-of-43.txt` | The migration applied (version 20260928194436), then the probe run against live production: every case and catalog check passes. Also the BF-59 suite after apply (13 of 13) and the security advisor delta. |
| `04-app-waterways-submit-with-photo.jpg` | App regression on production after apply: a TEST Working in Waterways inspection with a generated photo, submitted as Tim on RNO 18. The DB row is filed under Tim with a client key and one photo row. |
| `05-app-waterways-edit-saved.jpg` | The same TEST record edited and saved (column-level UPDATE on `data`, `form_date`). The photo row was deleted and re-inserted, and one revision row was recorded. |
| `06-app-document-upload.jpg` | `TEST-BF-60-doc.png` uploaded on RNO 18 Documents; the row is filed under Tim (`uploaded_by` binding). |
| `07-app-project-edit-saved.jpg` | RNO 18 Edit Project saved unchanged. `updated_at` moved; the row content hash (excluding `updated_at`), permits and form requirements are identical before and after. |
| `08-app-role-change-roundtrip.jpg` | Users page: Claude Test demoted to user, then promoted back to admin. The final DB state is profile admin, org member admin. |
| `09-verify-r1-c1-correction.txt` | Verify round 1 finding C1: the schema-scoped function revoke was a no-op. Reproduced on production, the correction (20260928202957, global revoke) rehearsed with its rollback, applied, then the full probe (now with the effective-privilege check C10) run against live production: 44 of 44. |

App regression on production (2026-09-28, after apply):

| Check | Result |
|---|---|
| Sign-in | PASS: dashboard and project pages load as Tim |
| Form submit with photo | PASS (04) |
| Form edit | PASS (05) |
| Photo upload | PASS (04, one `form_photos` row) |
| Document upload | PASS (06) |
| Project edit | PASS (07) |
| Role change | PASS (08, round trip) |
| Invite | Not run in the browser. It would send a real invitation email, and the invite path uses only the service client, whose grants BF-60 does not touch. |
| QR reissue | Not run in the browser. It would retire the project's live QR code. Covered by probe case A07 on live production after apply: `reissue_inspector_qr` as an org admin succeeds, rolled back. |
| Database log sweep | From apply (19:44:30Z) to the end of the pass, the only `permission denied` / 42501 log lines are the probes' own; no app request was refused. |

Cleanup on Tim's go: submission `35da08b1`, its photo row and document `52864c15` were deleted and re-read as gone (production now 30 submissions). The two revision rows (UPDATE from the edit, DELETE from the cleanup) stay by design, as with BF-63. The two Storage files (`form-attachments/.../working-in-waterways/1790625015926-6hxvi3.png`, `project-documents/.../1790625083156-shdzcs.png`, both small generated PNGs) remain: Supabase refuses direct SQL deletes from storage tables ("Use the Storage API instead"). This matches the BF-58.2 and BF-63 test photos.

To reproduce the rehearsal: `python Testing/security/bf60_rehearsal.py --roundtrip out.sql`, then run `out.sql` as postgres. After apply, run `Testing/security/bf60_grants_probe.sql` as is. Its "before" and "after" columns then both describe the applied state.
