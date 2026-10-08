# BF-74 evidence

**Created:** 2026-10-08

Verify round 1 (headless, 2026-10-08). Nothing here touched production: the database runs were on a throwaway local container, and Microsoft was stubbed.

| File | What it shows |
| --- | --- |
| `01-verify-r1-rehearsal-17-of-17-mutant-3-fail.txt` | Verify's own re-run of the access probe on a throwaway Supabase Postgres 15.8 with the repo migrations applied: 17/17 PASS and nothing left behind. The same run with an extra `GRANT SELECT ... TO authenticated` fails T2 and both T7 checks, so the probe can fail. The migration applies and the rollback file drops the table. |
| `02-verify-r1-codex-static-review.json` | The Codex second review (`gpt-6-astra`, xhigh). Its sandbox could not start on this host, so it reviewed statically: the full `git diff master...HEAD` and the helper definitions were given to it inline. Four findings: C1 to C4 in the story's verify record. |
| `03-verify-r1-c1-old-code-leaks-credentials.txt` | Finding C1: the pre-fix Graph client passed a credential that Microsoft's error text echoed straight into the detail shown in the browser, stored and logged, including a token cut in half by the 300-character cap. After the fix both credentials are scrubbed before the cap. |
