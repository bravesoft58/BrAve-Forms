# Sprint 4: Q&D Go-Live Request

**Status:** NOT STARTED
**Created:** 2026-09-20
**Last Updated:** 2026-09-20T19:30:55Z
**Source:** Andy Breen (IT Director, Q&D) email "BrAve Forms Update", 2026-09-07, with attachment `WIW Daily Form.pdf`. Both filed under [docs/reference/](../../reference/).

## Why this sprint

Andy's message opens: "Q&D is ready to start using the BrAve Forms App." It lists five things Q&D needs before or during first production use. Each is tracked as its own ticket below so it can be scoped, built, verified, and closed independently.

Pre-change safety: a full production snapshot (database schema, data, roles, and all 19 Storage objects) was taken on 2026-09-20 before any of this work. It lives under the gitignored `backups/2026-09-20T192106Z-pre-launch-tweaks/` folder with a README, checksums, and restore notes.

Launch context: the [Q&D readiness assessment](../../release/QD-GO-LIVE-READINESS-2026-09-08.md) still recommends holding for the security and record-integrity gates. The profile role self-promotion flaw it identifies is NOT on Andy's list and is not ticketed here; it is tracked in the readiness document.

## Stories

| Story | Title | SP (est.) | Priority | Andy's item | Status |
| --- | --- | --- | --- | --- | --- |
| [BF-54](stories/BF-54-cleanup-test-projects.md) | Remove test projects, keep the three live Q&D projects | 1 | HIGH | Clean up test projects | NOT STARTED |
| [BF-55](stories/BF-55-cleanup-users.md) | Remove or deactivate test users | 1 | HIGH | Cleanup users | NOT STARTED |
| [BF-56](stories/BF-56-stable-qr-expiring-session.md) | Inspector QR never changes; the scanned session expires | 3 | MEDIUM | Make inspection QR Code not expire | NOT STARTED |
| [BF-57](stories/BF-57-ndep-stormwater-edit.md) | NDEP Weekly Stormwater: enable Edit on submitted forms | 2 | HIGH | Edit button grayed out | NOT STARTED |
| [BF-58](stories/BF-58-working-in-waterways-form.md) | Working in Waters of the State daily inspection form | 5 | HIGH | Add Working In Waterways forms | NOT STARTED |
| **Total** | | **12** | | | **0/12 SP done** |

Points are first-pass estimates made while filing the tickets, not scoped estimates. Re-estimate during `/sprint-plan` or `/story` pre-flight.

## Order and dependencies

1. BF-54 and BF-55 are data operations against production, independent of code. Run them first, from the backup-verified state, in that order (projects before users, because user deletion is blocked by records the user created).
2. BF-57 is a self-contained code change with an existing pattern to copy (NDOT edit).
3. BF-58 is the largest item and the only new form. It reuses the shared photo attachment and form-actions components.
4. BF-56 is a design change to the inspector portal; confirm the design with Andy before building (see the ticket's open question).

## Open questions for Andy

- BF-55: drich@qdconstruction.com and abreen@qdgroupinvesco.com are not on the keep list. Confirm they go.
- BF-56: a stable QR URL can always be reloaded. The ticket proposes a scan-to-short-lived-session design; confirm the expiry window.
- BF-58: how sites (waterway locations) are configured per project, and whether the form is required daily like the dust log.

## Execution

Follow the shared workflow: `/story` per ticket, `/verify` before PR, human-gated merge via `/closeout`. Data operations (BF-54, BF-55) are executed by hand against production with the pre-change backup in place and are recorded in the ticket, not deployed.
