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

## Pending entry for `.claude/lessons-learned.md`

Verify Phase 8.1 could not write this: the headless run is not permitted to edit files under `.claude/`. Paste it at the end of that file in an attended session.

```markdown
### A FormData snapshot sees only what has already reached a named field; two kinds of change never do (BF-75, 2026-10-09)
- **Context:** BF-75's Cancel asks "Discard your changes?" when `new FormData(form)` differs from a baseline taken once the page is `ready`. That correctly catches typed, select, radio and button-driven changes, because every state-backed form rewrites its hidden JSON field on each render.
- **Problem:** Codex found two changes the snapshot cannot see (verify round 1, C1 and C2, both medium). First, the project form's inputs are uncontrolled and enabled in the server HTML. React keeps text typed before hydration (`initInput` skips the value assignment while hydrating) [verified 2026-10-09 against installed react-dom 19.2.3], so that text was already in the baseline and Cancel then left without asking. Second, `PhotoAttachment` adds photos to the draft only after the whole compress-and-upload batch finishes, and its file input has no name, so Cancel during an upload saw no change. Neither is a regression (master had no prompt anywhere), but both bypass the guard the story added.
- **Fix:** filed, not fixed in this story. C1 closes with BF-67 (lock fields until hydrated). C2 needs `PhotoAttachment` to report in-flight work so Cancel treats it as a change.
- **Prevention:** Before trusting a "has anything changed?" check built from a DOM snapshot, list everything that can change the form without a named field changing yet: edits made before hydration (take the baseline from server defaults or lock the fields until ready), async work still in flight (uploads, pickers, fetches), and named empty `<input type="file">` controls, whose empty File gets a new `lastModified` on every `FormData` call. On a client-side navigation `ready` is already true on the first render and React runs a child's effects before its parent's, so a baseline taken in a child effect comes before any parent mount effect.
```
