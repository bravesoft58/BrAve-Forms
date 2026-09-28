# BF-60 evidence

**Last Updated:** 2026-09-28T19:41:10Z

| File | What it shows |
|---|---|
| `01-rehearsal-roundtrip-44-of-44.txt` | Rolled-back rehearsal on production: migration spliced into `Testing/security/bf60_grants_probe.sql`, then the rollback. Each case shows the live pre-BF-60 outcome ("before", the hole) and the migrated one ("after"). Visibility is identical for every table and tier, and the rollback restores the grant state exactly. 44 of 44, nothing persisted. |
| `03-production-after-apply-43-of-43.txt` | The migration applied (version 20260928194436), then the probe run against live production: every case and catalog check passes. Also the BF-59 suite after apply (13 of 13) and the security advisor delta. |
| `02-bf59-suite-tightened-baseline-13-of-13.txt` | The BF-59 suite with T10 (now includes PUBLIC) and T12 (exact WITH CHECK) tightened, run on production before apply: 13 of 13. |

To reproduce the rehearsal: `python Testing/security/bf60_rehearsal.py --roundtrip out.sql`, then run `out.sql` as postgres. After apply, run `Testing/security/bf60_grants_probe.sql` as is. Its "before" and "after" columns then both describe the applied state.
