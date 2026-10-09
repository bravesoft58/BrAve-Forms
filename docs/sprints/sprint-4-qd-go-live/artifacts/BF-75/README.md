# BF-75 verify evidence

**Created:** 2026-10-09

Round 1 of the zero-trust verify, run headless on `8254d0d` against `master`. Codex was the second reviewer (gpt-6-astra, xhigh, from `~/.codex/config.toml`).

| File | What it shows |
|---|---|
| `01-verify-r1-codex-review-needs-attention.json` | Codex adversarial review of `8254d0d` against `master`. Verdict needs-attention, two findings: edits typed into the uncontrolled project form before hydration become the "clean" baseline (verify C1, Codex label high, adjudicated medium, filed), and photos still compressing or uploading are invisible to the discard check (verify C2, medium, filed). Codex read the diff from GitHub; its sandbox could not run the local tests. |
| `02-verify-r1-test-suite-node24.txt` | Every `Testing/forms` unit test file run by verify on Node 24.21.0: 120 pass, 0 fail across 11 files (bf75 9/9 plus 111 regression). The three read-only production-database probes (bf57, bf58_1 NDOT photo readiness, bf73 filter probe) were not run: they SELECT from the live project with the service-role key and this story changes no data. [observed 2026-10-09] |
| `03-verify-r1-next-build-node24.txt` | `next build` (16.3.6, Turbopack) on Node 24.21.0 over the committed tree: compiled, TypeScript passed, 19 static pages generated, exit 0. [observed 2026-10-09] |

Why C1 is medium and not high: the prompt is skipped only when every edit happens in the pre-hydration window and nothing changes after it, on the one uncontrolled form (project create/edit, admin use). Any edit after hydration re-arms the prompt, and master had no Cancel on that form at all. The structural fix is BF-67 (lock fields until hydrated), already sequenced with this story.

What is still unproven by execution: the on-screen flow (untouched form leaves straight away, a change asks, Keep editing keeps values, Discard leaves). It was traced in code for all eight forms, but the repo has no DOM test harness, so the story's browser check on preview or production after merge remains the only planned execution evidence (verify V1).

The adjudicated findings and the verdict are recorded by `verify_stamp.py` in the verify ledger, not here.

## Verify cycle 2, round 1 (2026-10-09, on `3e821aa`)

After the round-1 PASS, C1 was fixed by building BF-67 (the hydration lock) on this branch and C2 by the pending-upload marker. The ledger treats the next verify as a new cycle: round 1 again, full and blind, against `master`.

| File | What it shows |
|---|---|
| `04-verify-c2r1-codex-review-approve.json` | Codex adversarial review of `3e821aa` against `master` (gpt-6-astra, xhigh) [observed 2026-10-09]. Verdict approve, no findings; it reports that C1 and C2 are addressed. It read the diff through GitHub because its sandbox could not run commands, so it ran no tests. |
| `05-verify-c2r1-test-suite-node24.txt` | Every `Testing/forms` unit file on Node 24.21.0: 126 pass, 0 fail across 11 files (bf75 13/13, bf66 6/6). The three read-only production-database probes were not run (no `.env.local` in this worktree). [observed 2026-10-09] |
| `06-verify-c2r1-mutation-check.txt` | Five mutants, each applied, its guarding test run, then restored from git. The hydration lock, the upload marker and the in-flight check are guarded (killed). Inverting Cancel's ask/leave choice and wiring Discard to Keep editing survive: `FormCancel`'s click path is unexecuted (verify V1, low). |
| `07-verify-c2r1-tsc-lint-build-node24.txt` | `tsc --noEmit` exit 0, ESLint 0 errors (the 12 pre-existing warnings), `next build` (16.3.6) exit 0 with 19 static pages. [observed 2026-10-09] |

Still unproven by execution: the on-screen flow, and BF-67's "fields cannot be changed before hydration" with script loading delayed. Both are in the story's browser check.

## Browser check (2026-10-09T16:00:30Z, preview of `3e821aa`)

Run with Claude in Chrome on the protected preview `brave-forms-83v4hg70r-embracingai.vercel.app` (a Vercel share link for access; Tim signed in to BrAve Forms himself). Project: 17254 NDOT 4541 7 Bridges. Nothing was submitted; the NDOT tab showed 3 submissions before and after.

| File | What it shows |
|---|---|
| `08-browser-untouched-cancel-lands-on-ndot-tab.jpg` | New NDOT entry, untouched: Cancel went straight to `?tab=ndot_weekly_stormwater`, no prompt. |
| `09-browser-changed-form-cancel-asks-discard.jpg` | After typing in Additional Comments, Cancel showed "Discard your changes? [Keep editing] [Discard]", with focus on Keep editing. |
| `10-browser-keep-editing-keeps-comment.jpg` | Keep editing closed the prompt; the comment was still there and Cancel was back. |
| `11-browser-discard-leaves-nothing-saved.jpg` | Discard went to the NDOT tab; still 3 submissions. |
| `12-browser-cancel-during-photo-upload-asks.jpg` | A page script pressed Cancel the moment `data-form-pending-work` appeared on the photo section (upload in flight). The prompt appeared and the page stayed; the photo then finished (1/10). Discard afterwards left the uploaded file unreferenced in Storage (the Q&D logo PNG, under the NDOT 4541 attachments path), as already accepted for removed photos. |

Also observed, no screenshot:
- **Hydration lock (BF-67 AC1):** the server HTML of all eight form pages (NDOT, NDEP stormwater, Waterways, dust log new, NDEP SAD, NNPH, project new, project edit) has the form's `<fieldset>` with `disabled`; after load the inspection form's fieldset is enabled. The append-entries dust log page was not fetched (needs an existing log id). Delaying script load itself was not simulated: the extension cannot throttle the network.
- **Destinations:** untouched dust log new entry Cancel went to `?tab=daily_dust_log` (was browser Back); untouched project edit Cancel went to the project page.

### Pending `.claude/lessons-learned.md` updates (cycle 2)

The headless verify was again refused write access to `.claude/`. In an attended session, paste the round-1 entry above with its **Fix:** line replaced by the first block below, then add the second entry.

```markdown
- **Fix:** C1 by building BF-67 on the BF-75 branch: one `<fieldset disabled={!ready}>` around every form body, so nothing is editable before the baseline is taken. C2 by `PhotoAttachment` setting `PENDING_WORK_ATTR` on its section while uploading; `FormCancel` asks whenever the form contains it. Verify cycle 2 round 1 PASS 9.1, both fixes mutation-checked.
```

```markdown
### Source-text tests guard wiring, not behaviour; mutate the click path to see what they miss (BF-75, 2026-10-09)
- **Context:** BF-75's `bf75_cancel_test.ts` unit-tests the snapshot comparison with real `FormData` and checks `FormCancel` with regexes over its source, because the repo has no DOM harness.
- **Problem:** Verify cycle 2 mutated the code. Removing the hydration lock, dropping the upload marker and ignoring in-flight work each failed a test. Inverting `if (ask)` and pointing Discard at "Keep editing" both left the whole suite green. A regex that finds `needsDiscardCheck(...)` in the source proves the call exists, not what the component does with the answer.
- **Fix:** none in this story (verify V1, low). The click path is correct by code trace, and the story's browser check is the execution evidence.
- **Prevention:** For each client component, run the two or three mutations that would hurt a user most (invert the decision, swap the handlers) before calling its tests sufficient. If they survive, either move the decision into a pure function the test can call, or add a DOM harness (jsdom or a browser run) once a second component needs one.
```

## Pending entry for `.claude/lessons-learned.md`

Verify Phase 8.1 could not write this: the headless run is not permitted to edit files under `.claude/`. Paste it at the end of that file in an attended session.

```markdown
### A FormData snapshot sees only what has already reached a named field; two kinds of change never do (BF-75, 2026-10-09)
- **Context:** BF-75's Cancel asks "Discard your changes?" when `new FormData(form)` differs from a baseline taken once the page is `ready`. That correctly catches typed, select, radio and button-driven changes, because every state-backed form rewrites its hidden JSON field on each render.
- **Problem:** Codex found two changes the snapshot cannot see (verify round 1, C1 and C2, both medium). First, the project form's inputs are uncontrolled and enabled in the server HTML. React keeps text typed before hydration (`initInput` skips the value assignment while hydrating) [verified 2026-10-09 against installed react-dom 19.2.3], so that text was already in the baseline and Cancel then left without asking. Second, `PhotoAttachment` adds photos to the draft only after the whole compress-and-upload batch finishes, and its file input has no name, so Cancel during an upload saw no change. Neither is a regression (master had no prompt anywhere), but both bypass the guard the story added.
- **Fix:** filed, not fixed in this story. C1 closes with BF-67 (lock fields until hydrated). C2 needs `PhotoAttachment` to report in-flight work so Cancel treats it as a change.
- **Prevention:** Before trusting a "has anything changed?" check built from a DOM snapshot, list everything that can change the form without a named field changing yet: edits made before hydration (take the baseline from server defaults or lock the fields until ready), async work still in flight (uploads, pickers, fetches), and named empty `<input type="file">` controls, whose empty File gets a new `lastModified` on every `FormData` call. On a client-side navigation `ready` is already true on the first render and React runs a child's effects before its parent's, so a baseline taken in a child effect comes before any parent mount effect.
```
