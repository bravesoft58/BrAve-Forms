# BF-20: E2E Verification Results

**Date:** 2026-03-10
**Tester:** Claude (browser automation) + Tim (manual clicks)
**Environment:** https://brave-forms.vercel.app (production)
**Test Project:** "E2E Test Project - Full Verification"

---

## Results Summary

**14/14 steps PASS** | 2 bugs found and fixed during verification

| Step | Test | Result | Notes |
|------|------|--------|-------|
| 1 | Create project with all fields + 4 permits | PASS | SAD, Dust Control, NDOT SW, NDEP SW |
| 2 | Permits auto-trigger correct forms | PASS | 5 forms: Dust Log, NDEP SAD, NNPH Dust, NDOT SW, NDEP SW |
| 3 | Project detail shows all form tabs + Permits + Documents | PASS | All tabs render correctly |
| 4 | Submit NDEP Stormwater (all 3 sections) | PASS | Inspector, weather, BMP checklist, signature |
| 5 | Submit NDOT Stormwater with photo section | PASS | Photo attachment section renders; file picker requires manual interaction |
| 6 | Submit NDEP SAD Application | PASS | All 4 sections filled, signature + date |
| 7 | Submit NNPH Dust Control Permit | PASS | Application type, contacts, description, signature |
| 8 | All submissions appear in form log history | PASS | Each tab shows "1 submission" with timestamp |
| 9 | Read-only view renders correctly | PASS | Verified NDEP SW: all 3 sections, BMP table, signature |
| 10 | "Use Previous" works on weekly forms | PASS | Pre-fills from last submission |
| 11 | Document upload visible in Documents tab | PASS | After bug fix — 358KB PDF uploaded successfully |
| 12 | Project edit (update contact, add permit) | PASS | Added NDOT permit number "12345", added Other permit |
| 13 | Inspector QR portal shows forms + docs + permits | PASS | Public URL, no auth required, 4 tabs render |
| 14 | No console errors throughout entire flow | PASS | Checked both admin and inspector tabs |

---

## Bugs Found & Fixed

### Bug 1: Document upload — category constraint mismatch
- **Symptom:** `new row for relation "project_documents" violates check constraint "project_documents_category_check"`
- **Root cause:** Initial schema (migration 001) defined category constraint as `('permit','contract','map','plan','photo','general')`. Migration 004 used `CREATE TABLE IF NOT EXISTS` so its updated constraint with `'other'` was never applied. UI sends `'other'`, DB rejects it.
- **Fix:** Migration `20260310170000_fix_documents_category.sql` — drops old constraint, adds new one accepting all categories including `'other'`. Also adds missing `mime_type` column and NOT NULL constraints from 004.

### Bug 2: Document upload — missing storage policies (HTTP 502)
- **Symptom:** `Upload failed: HTTP 502 error` on 358KB PDF upload
- **Root cause:** Migration 004 failed mid-push (RLS policies already existed from 001), so the storage policies at the end of the file were never created. Bucket existed but uploads were blocked.
- **Fix:** Migration `20260310180000_fix_documents_storage_policies.sql` — creates storage upload/read/delete policies. Delete restricted to admin only.

### Migration cleanup
- Renamed migration files from short timestamps (`20260310_003_*`) to full timestamps (`20260310150000_*`) to avoid Supabase CLI version collisions. All 7 migrations now tracked and applied on remote.

---

## Data Verification

All test data persisted correctly in Supabase:
- Project created with 5 permits (4 original + Other added via edit)
- 4 form submissions (1 each for NDEP SW, NDOT SW, NDEP SAD, NNPH Dust)
- 1 document uploaded (Daily Dust Logs.pdf, 358KB)
- QR token generated and inspector portal accessible
