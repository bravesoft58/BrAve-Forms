# Lessons Learned

### Nested label elements cause unintended checkbox toggling (2026-03-09)
- **Context:** BF-12 NDOT Stormwater form — CSW N/A and Precip N/A inline checkboxes
- **Problem:** Wrapping a `<label>` inside another `<label>` causes clicking the outer label text (e.g., "CSW Tracking #") to toggle the nested checkbox. Invalid HTML, unexpected UX.
- **Fix:** Replace outer `<label>` with a `<div>` using the same CSS classes. Keep inner `<label>` wrapping just the checkbox + "N/A" text.
- **Prevention:** When placing inline checkboxes next to field labels, use a `<div>` or `<span>` wrapper — never nest `<label>` elements.

### Supabase Storage getPublicUrl requires public bucket (2026-03-10)
- **Context:** BF-13 NDOT photo attachment — photos upload but don't display
- **Problem:** Bucket created as `public: false` but code uses `getPublicUrl()` which constructs a `/storage/v1/object/public/` URL. Private buckets reject this endpoint — photos upload fine but `<img src>` tags get 400 errors. Browser `<img>` tags don't send Supabase auth headers.
- **Fix:** Set bucket `public: true` in migration. For this single-tenant app, public bucket is appropriate. File names include timestamps + random strings so URLs aren't guessable.
- **Prevention:** When using `getPublicUrl()`, always verify the bucket is created with `public: true`. For private buckets, use `createSignedUrl()` instead.

### form_photos.file_path should store path not URL (2026-03-10)
- **Context:** BF-13 dual-write to form_photos table
- **Problem:** `file_path` column (documented as "Supabase Storage path") was receiving the full public URL instead of the storage path/filename. Downstream queries that construct URLs from file_path would get double-prefixed.
- **Fix:** Store `p.file_name` instead of `p.url` in the insert.
- **Prevention:** Match the data to the column's documented purpose. If a column says "path", store a path — not a full URL.

### Semantic naming for shared lookup maps (2026-03-10)
- **Context:** BF-14 NDOT stormwater view — `PRECIP_LABELS` used for both precipitation intensity and wind display
- **Problem:** Both fields use the same enum (none/light/moderate/heavy) but naming the lookup `PRECIP_LABELS` is misleading when used for wind. Maintainer would question correctness.
- **Fix:** Renamed to `INTENSITY_LABELS` — accurate for both usages.
- **Prevention:** When a lookup map serves multiple fields, name it after the shared concept (intensity), not the first field that used it (precipitation).

### Dead AuthState fields in Next.js server actions (2026-03-05)
- **Context:** BF-02 Supabase Auth signup action
- **Problem:** `success?: boolean` field defined in AuthState type but never set or read. Dead code shipped.
- **Fix:** Removed the unused field during verify.
- **Prevention:** When defining return types for server actions, only include fields that are actually used by the consuming component.

### Repeated dead `success` field pattern in DocumentActionState (2026-03-10)
- **Context:** BF-17 document-actions.ts — same anti-pattern as BF-02
- **Problem:** `success?: boolean` set in server action returns but never read by DocumentsTab consumer. Dead code shipped again despite the BF-02 lesson existing.
- **Fix:** Removed the field during verify.
- **Prevention:** Before adding optional fields to action state types, verify the consuming component actually reads them.

### Delete operation ordering for storage + DB cleanup (2026-03-10)
- **Context:** BF-17 deleteDocument server action — deletes from Supabase Storage then DB
- **Problem:** Storage-first delete means if DB delete fails, metadata row points to a deleted file (404 downloads). Reverse order is strictly better.
- **Fix:** Reordered to delete DB row first, then storage file. DB failure = fully consistent state. Storage failure = orphaned file (harmless, cleanable).
- **Prevention:** When deleting from two systems (storage + DB), delete the metadata/index first. An orphaned blob is harmless; a dangling reference causes user-facing errors.

### QR modal needs backdrop click and ESC key close (2026-03-10)
- **Context:** BF-19 Inspector QR portal — QrCodeModal overlay
- **Problem:** Modal overlay didn't close when clicking backdrop or pressing Escape. Users expect these standard behaviors.
- **Fix:** Added `onClick` on backdrop div checking `e.target === e.currentTarget`, plus `useEffect` keydown listener for Escape.
- **Prevention:** Every modal overlay should have: (1) X button, (2) backdrop click close, (3) Escape key close. Add all three from the start.

### Admin-only UI controls must check role server-side (2026-03-10)
- **Context:** BF-19 — QR code generation button rendered for all users, AC specified admin-only
- **Problem:** `QrCodeModal` rendered unconditionally. The server action has auth (user must be logged in) but any authenticated user could generate tokens.
- **Fix:** Added `user?.role === "admin"` conditional render in the server component.
- **Prevention:** When an AC says "admin only", add the role check where the component is rendered (server component), not just in the action.

### Extract helpers before duplication, not after (2026-03-10)
- **Context:** BF-18 Project Edit — `buildProjectFields` and `deriveFormTypes` extracted for `updateProject` but `createProject` kept inline duplicates of the same logic.
- **Problem:** 21 field mappings duplicated between `createProject` (inline) and `buildProjectFields` (helper). Adding a field requires updating two places.
- **Fix:** Refactored `createProject` to use `buildProjectFields` (with spread + `created_by`) and `deriveFormTypes`.
- **Prevention:** When extracting a helper for a new function, immediately refactor the original function to use it too. Don't leave the old inline version behind.

### Schema NOT NULL adds need a write-path audit, not just a backfill (2026-04-29)
- **Context:** BF-36 hotfix — BF-30 added `projects.organization_id NOT NULL` with backfill, but the `createProject` server action wasn't updated to populate it. Every new-project insert errored in production for Andy.
- **Problem:** When BF-30 introduced the column it was framed as "schema + backfill". The migration succeeded, all existing rows got values, all gates passed — but nobody walked the code paths that INSERT into the table. A migration that makes a column NOT NULL is a schema *and* code change.
- **Fix:** BF-36 added a single membership lookup (`organization_members → org_id`) and threaded it into the insert; paired with an RLS hotfix on `qr_tokens` that was a latent admin gap predating BF-30.
- **Prevention:** When a migration adds a NOT NULL column to a table, before merging the migration: (1) `grep` for every `.from('<table>').insert` call site, (2) confirm each one populates the new column, (3) document the audit in the story. Backfill ≠ done. The story-level checklist for "Phase 1 schema" stories should require a "Code paths audited" line item.

### TODO(TICKET-ID) is the right way to mark deliberate seams (2026-04-29)
- **Context:** BF-36 createProject has a `TODO(BF-33)` comment marking the membership lookup as the interim form of `getActiveOrg()` once cookie-driven org context lands.
- **Problem:** Generic `TODO` comments are a Tier 1 verify blocker because they signal incomplete work. But there's a real distinction between "incomplete code" and "complete code with a documented next-step".
- **Fix:** Use the `TODO(<TICKET-ID>):` format whenever a working implementation has a planned successor. Verify treats this as a -0.5 finding rather than a blocker, because the work is tracked, not abandoned.
- **Prevention:** If you must add a TODO to merging code, always include the ticket ID in parens. Plain `TODO`/`FIXME` should be reserved for "fix this before shipping".

### useEffect that signs URLs must not re-attempt on every parent re-render (2026-04-30)
- **Context:** BF-32 PhotoAttachment.tsx — render-time signed URL preview map keyed by file_name, populated in a useEffect that depends on `[photos, storagePath, previewUrls]`.
- **Problem:** Caption typing calls `onPhotosChange(photos.map(...))` on every keystroke, producing a new `photos` array reference. The useEffect re-runs, recomputes `missing` (filters out already-signed names), and tries to re-sign anything that previously failed. On a sustained 401/RLS failure the sign attempt fires once per keystroke. Functionally fine on the happy path but a noisy network footprint when something is wrong.
- **Fix (deferred — minor finding, not a verify blocker):** keep a Set of already-attempted-and-failed `file_name`s alongside `previewUrls`. Filter `missing` against both maps. One sign attempt per file_name per session, success or fail.
- **Prevention:** When a useEffect populates a cache from async work, derive `missing` against BOTH the success cache AND a parallel "tried" set. Don't rely on success-only state to gate retries — failures repeat forever otherwise.

### Verify tracks dead public API exports as Lens 6 findings, not blockers (2026-04-30)
- **Context:** BF-32 `signed-urls.ts` exports `signFileUrlServer`, `signFileUrlService` (single, service-role), and `signFileUrlsService` (batch, service-role). The story AC explicitly listed all three. Implementation only used `signFileUrlServer` (admin paths) and `signFileUrlsService` (inspector batch). The single-form `signFileUrlService` ended up with zero call sites.
- **Problem:** "Exported but unused" is a real interface-width violation — anyone importing the helper module is reading dead surface area. But it was specified in the AC, so deletion would diverge from the contract.
- **Fix:** Verify treats it as a Lens 6 finding (-0.5 from 10.0) without auto-deleting. The decision to keep or remove is a design call for the human reviewer post-merge.
- **Prevention:** When listing helper functions in a story AC, distinguish "must exist" from "must be called from N places". For BF-32 the latter would have caught this — only the actually-used helpers belong in the AC.

### RLS rewrites that collapse a tier silently hide data — count rows under impersonation before AND after (2026-04-30)
- **Context:** BF-31 rewrote every public-table RLS policy to scope through `organization_members` and replaced the legacy `is_admin()` short-circuit with `is_super_admin()`. The story spec table at line 68 dropped the org-admin tier from project-level data (`form_submissions`, `form_photos`, `project_documents`, `project_permits`, `project_form_requirements`) — those policies became `is_super_admin() OR project_id = ANY(get_user_project_ids())`. The migration applied cleanly, all in-scope advisors closed, isolation tests passed.
- **Problem:** Verify caught a measurable production data hide event: 3 of 3 Q&D org admins lost visibility to records they previously saw via the `is_admin()` short-circuit. Andy went from 14 to 7 submissions, Claude Test from 14 to 6, **Gracie from 14 to 0**. Only Tim (the sole `super_admin`) retained global view. The phrase "rewrite to scope through org membership" reads like a 1:1 substitution but is actually a tier collapse: pre-RLS, `profiles.role='admin'` was BOTH "manage org" AND "see all project data"; post-RLS those are two separate tiers (`is_org_admin(org)` and `project_users` membership) and the spec inadvertently kept only the latter for project-level reads. Asymmetric: `qr_tokens_all`, `project_documents_delete`, `permits_insert/update/delete`, and `form_requirements_insert/update/delete` already had the `is_org_admin` clause, but the SELECT (and submissions/photos/documents INSERT-UPDATE) policies didn't.
- **Fix:** Additive migration `20260430140000_admin_org_access.sql` adds `OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))` to the 9 affected policies. Pattern matches the BF-31 mutation policies that were already correct. Post-fix verification: orphan still 0/everything (isolation preserved), plain member still 0 project-level + 6 org projects (BF-31 design intact), Andy/Gracie/Claude all see 14/14 submissions, super_admin unchanged.
- **Prevention:** When an RLS rewrite collapses or splits a tier (e.g. `is_admin` → `is_super_admin` + `is_org_admin`), produce a tier-by-tier visibility matrix BEFORE writing the migration: for each (table × admin tier) cell, list the policy clauses that grant access. Any cell that goes from "granted" to "denied" is a behavioral regression and must be either explicitly accepted with documented UAT impact or carry a forward clause. Don't trust prose — count rows under impersonation (`set_config('request.jwt.claims', ...) + SET LOCAL ROLE authenticated`) before AND after on production data, for every (admin tier × table) combination, not just the orphan-isolation case. The orphan check proves no leaks; the per-tier count proves no silent hides.

### Security negative-tests over a real API must be non-destructive, or they become the exploit (BF-59, 2026-09-20)
- **Context:** BF-59 shipped two negative suites proving an ordinary user cannot self-promote via `profiles.role` / `platform_role`. The SQL suite wraps every mutating probe in a nested block plus a marker exception so nothing persists, which makes it safe on production. The REST suite issues real committed PATCHes over PostgREST.
- **Problem:** The REST suite recorded FAIL and continued when a forbidden PATCH succeeded, but never reverted. Against an unpatched or regressed target the probes would permanently set `platform_role = 'super_admin'`, `role = 'admin'`, and change the email. The detector itself leaves an account promoted. Found by the Codex adversarial review in verify round 1 (confidence 1.0, reproduced with an API stub); the single-reviewer pass had not flagged it. A committed HTTP write has no client-side transaction to roll back, unlike the SQL path.
- **Fix:** Best-effort revert-on-breach: on any non-rejected forbidden probe the script restores the field to its pre-probe value and prints a CRITICAL breach line. Docstring restricts targets to production after apply, or a disposable isolated project.
- **Prevention:** A test that performs the very mutation it forbids MUST be non-destructive by construction: rollback-protected SQL (nested block plus marker raise), a disposable isolated target with throwaway users, or a guaranteed revert. Never aim a privilege-escalation probe at production without one. Prefer the rollback-protected SQL path for production checks.

### A no-op UPDATE never exercises a trigger's IS DISTINCT FROM branch (BF-59, 2026-09-20)
- **Context:** BF-59's SQL suite T08 asserts a `service_role` request can still change `profiles.role`, proving legitimate user-management writes keep working past the new guard trigger.
- **Problem:** T08 ran `UPDATE profiles SET role = role`. The guard's condition (`NEW.role IS DISTINCT FROM OLD.role OR ...`) was false, so the exemption branch never executed. T08 would have passed even if the trigger wrongly rejected every real service-role write. Found by the Codex adversarial review in verify round 1.
- **Fix:** T08 now flips the value (`CASE WHEN role = 'user' THEN 'admin' ELSE 'user' END`) inside the rolled-back probe and asserts one row changed. Re-run on the local copy and production; the probe leaves `user -> user`.
- **Prevention:** For any test of an exemption inside an `IS DISTINCT FROM` guard, change the value and assert the change (then roll it back). A same-value write is a tautology, not a test.

### An irreversible-deletion script must fail closed on arguments and on partial failure (BF-54, 2026-09-21)
- **Context:** BF-54's Storage cleanup script deleted the objects left behind by seven removed projects (the DB cascade does not reach the buckets).
- **Problem:** The first version checked `"--dry-run" in sys.argv`, so any other argument (`--help`, a `--dryrun` typo) ran the real delete; a failed list call was skipped silently and a failed DELETE still printed DONE with exit 0, so a partial cleanup looked complete. Found by the Codex adversarial review in verify round 1 after the deletion had already run correctly.
- **Fix:** argparse with an explicit `--execute` flag (dry run is the default, unknown arguments rejected before anything runs); list and delete failures print and exit 1; a post-delete re-list must be empty.
- **Prevention:** Any script that deletes data: default to dry run, require an explicit execute flag, reject unknown arguments, treat every API failure as an error, and verify the end state by re-reading it. "It ran fine once" is not a safety property.
- **Round-2 addendum (argparse abbreviation trap):** `argparse` matches unambiguous prefixes by default, so with `--execute` defined, `--exec`, `--ex` and even `--e` all reach delete mode. Pass `allow_abbrev=False` on every parser that guards a destructive action, and pin the contract with a no-network test that asserts each abbreviation exits 2 (`bf54_args_test.py`). Codex caught this after the round-1 fix claimed "a typo can never fall through".

### Build evidence must be taken on the tree you commit, not the tree you had a minute earlier (BF-57, 2026-09-22)
- **Context:** BF-57 ran lint, `tsc --noEmit` and `next build` (all clean), then added `Testing/forms/bf57_ndep_edit_readiness.ts`, a Node type-stripping script that imports the app schema with an explicit `.ts` extension, and committed everything with the story stating "build clean".
- **Problem:** `tsconfig.json` includes `**/*.ts` with only `node_modules` excluded, so the new script entered the Next build's type-check and failed it (`An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled`). The committed tree never built. Verify round 1 reproduced it and scored the story FAIL 5.0, mostly for the false evidence rather than the defect. Every earlier `Testing/` script was `.py`, `.sql` or `.mjs`, which the build never type-checks, so the trap was new.
- **Fix:** `"exclude": ["node_modules", "Testing"]` in `tsconfig.json`; the script keeps its `.ts` import because Node needs it. Build, typecheck and the script re-run on the committed tree.
- **Prevention:** The evidence block in a story describes the commit, so run the gates as the last step before `git commit`, after every file is in place, and re-run them after any later edit. Any `.ts` file added outside `src/` lands in the app's type-check unless `tsconfig` excludes its directory.

### Every derived credential expires at the minimum of ALL upstream deadlines, computed at issue time (BF-56, 2026-09-24)
- **Context:** BF-56 grants inspector access through three derived artifacts: a session row, a session cookie, and signed Storage URLs for photos and documents. Access is supposed to end at the session end, and legacy 30-day QR tokens have their own expiry too.
- **Problem:** Verify took two rounds to get this right. Round 1: the signed URLs used a flat 3600 s TTL, so they outlived the session by up to an hour. Round 2: the fix capped the TTL to the session but ignored the legacy token's own expiry, so a token scanned 90 s before it expired minted a 12 h session and cookie plus 3600 s links. The fix also computed the relative TTL once, before several async queries, so elapsed time pushed links past the deadline. Every check in the portal itself was correct (it re-checked the token on each load); the leaks were all in artifacts that live outside the page.
- **Fix:** One absolute deadline, `accessUntil = min(session end, token expires_at)`. It is stored in the session row and used for the cookie Max-Age, and each signed-URL batch computes `min(3600, accessUntil - now)` at the moment it signs. Under 1 s left, nothing is signed and the page says expired. e2e regressions cover a 120 s session and a 90 s legacy token.
- **Prevention:** When a feature issues anything that outlives the request (cookies, signed URLs, tokens, cache entries), list every upstream expiry that should bound it, pass an absolute timestamp rather than a relative TTL, and derive each lifetime from it at issue time. Test at the boundary, with a deadline seconds away, not only with the default 12 h, where every short lifetime passes by accident.

### Export a live history table only after its writer is stopped (BF-63, 2026-09-28)
- **Context:** BF-63 added `form_submission_revisions`, an append-only table written by a trigger on every changing edit or delete of `form_submissions`. Its rollback drops the trigger, the function and the table, and told the operator to export the history first.
- **Problem:** "Export first" ran a plain `SELECT` while the trigger was still live. A `SELECT` takes only an ACCESS SHARE lock and does not block writes, so a form edit committing between the export and the `DROP TABLE` would write a revision that is missing from the export and then destroyed. Found by the Codex adversarial review in verify round 1 (confidence 0.97). The forward migration was clean; only the manual teardown guidance was wrong.
- **Fix:** The rollback is ordered in three steps: drop the trigger (the table is now frozen), export if the history must be kept, then drop the function and table.
- **Prevention:** Any teardown that tells an operator to "export first" must first stop whatever writes the data (trigger, job, app path), or lock the table against writes for the export, so the snapshot is complete. Order the steps in the file, not only in prose.

### Every consumer must support every format the uploader accepts, and fail loudly when it cannot (BF-58.2, 2026-09-28)
- **Context:** BF-58.2 added a second photo PDF (Working in Waterways) next to NDOT's. Photos go through PhotoAttachment into the `form-attachments` bucket and are drawn by `@react-pdf/renderer`.
- **Problem:** The picker's `accept` list, the bucket's allowed MIME types and the compression step all let WebP through, but react-pdf draws only JPEG and PNG. A WebP photo, or any photo whose fetch fails, is left out of the PDF with no notice while the route returns 200 and the caption still prints: a compliance record that looks complete but is missing evidence. Found by verify and Codex independently (C1) in both BF-58.2 rounds; the same gap has existed in the NDOT PDF since BF-32. BF-58.2's own tests used JPEG and a missing URL, so they could not see it.
- **Fix:** Filed as BF-68 (convert or refuse WebP at upload; check each photo server-side and print a visible notice for any that cannot be included). BF-58.2 shipped with the gap documented, since the normal phone path (JPEG) was verified on real devices.
- **Prevention:** When adding a consumer of uploaded files (PDF, thumbnail, export), list what the upload path accepts and prove the consumer handles each type, with a test per type. A consumer that can skip an input must say so in its output; a count check (items in the record = items rendered + notices) is the cheap guard.

### An idempotency key is only as good as the retry it survives, and a replay check must compare content (BF-65, 2026-09-28)
- **Context:** BF-65 added a per-submit key so that a save whose reply is lost, then retried, cannot create a duplicate inspection. The key lived in the mounted form, and the server treated a repeated key as "already saved".
- **Problem, part 1:** on the preview, a simulated lost reply made `useActionState` throw, and Next replaced the page with "This page couldn't load". That unmounted the form and its key, so the user's only way forward (Reload) would have submitted a duplicate: the exact case the story targeted. The unit tests could not see this, because they exercised the server helper, not the browser's failure path. The app has no `error.tsx`.
- **Problem, part 2:** once the form stayed up, the dust-log append retry was content-blind. It skipped the write whenever the key was present, so an entry corrected between the lost reply and the resend was silently dropped and reported as saved. Codex caught this (verify round 1, C1, high). The create and edit paths already compared content.
- **Fix:** `keepFormOnLostReply` returns a thrown reply to the form as a message (with `unstable_rethrow` so Next's redirect still works), which keeps the key alive. `appendRetryState` treats a retry as a replay only when the saved entries equal the ones being sent, and refuses it otherwise. Both were proven on the preview by patching `window.fetch` to discard one reply after the server finished.
- **Prevention:** For any retry-safety feature, test the real failure in the browser: discard the reply after the server commits, then retry. That confirms the retry path keeps its key. A replay check must compare the stored content with the resent content, never just the key's presence: same content is success, different content is a visible refusal.

### A Server Action's redirect page renders before its after() work runs; show "pending", not "nothing happened" (BF-72, 2026-10-08)
- **Context:** BF-72 sends the sheen/plume alert email from `after()` in the Waterways create and edit actions, then redirects to the inspection page, which shows the alert status.
- **Problem:** Next.js renders the redirect target inside the action's own request, before the `after()` callbacks run [verified 2026-10-08, next 16.3.6 `server/app-render/action-handler.js`, `createRedirectRenderResult`]. So every No-to-Yes edit landed on a page with no alert row yet, which read "No alert email was recorded ... Call {name}" while the email was on its way, and the open page never updated. Found by verify round 1 (C2, raised by both reviewers).
- **Fix:** a just-saved Yes with no alert row reads as pending (dated from the save that scheduled the work), and a small client component refreshes the page until the alert reaches a final status (`1f678ec`). Mutation-checked: disabling the pending rule fails the test.
- **Prevention:** Any page that shows the result of background work started by the request that led to it needs a "not started yet" state, and has to refresh until the result is final. In the first minutes after the save, "no row" must never read as "failed". Also schedule `after()` before `redirect()`, which throws.

### A schema-scoped default-privilege revoke cannot remove PUBLIC EXECUTE on functions; test the effect, not the catalog (BF-60, 2026-09-28)
- **Context:** BF-60 changed the default privileges so that future tables, sequences and functions grant nothing to the API roles. The functions part used `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role, PUBLIC`. Probe C7 checked that `pg_default_acl` no longer named those roles, and passed.
- **Problem:** PostgreSQL grants PUBLIC EXECUTE on every new function as a built-in global default. Per-schema default privileges can only add to the global setting, never remove from it, so the `IN SCHEMA` revoke of PUBLIC did nothing. A function created afterwards in `public` was still callable by `anon` and `authenticated` through PUBLIC, which is the advisor 0028 hole the story set out to close. The catalog looked clean because the built-in default is not stored anywhere. Codex caught it (verify round 1, C1, high); it was reproduced on production in a rolled-back test. Supabase's own guide shows the schema-scoped form.
- **Fix:** corrective migration `20260928202957`, `ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` with no `IN SCHEMA`, rehearsed with its rollback and applied. Probe C10 now creates a real function, table and sequence in a rolled-back block and asks `has_function_privilege` / `has_table_privilege` / `has_sequence_privilege` for each API role. Verify round 2 PASS 9.4.
- **Prevention:** To stop new functions defaulting to PUBLIC EXECUTE, revoke globally (omit `IN SCHEMA`) and remember that the change reaches every schema the role creates functions in. Any check that "defaults grant nothing" must create the object and test who can use it. A catalog row is a proxy, and PostgreSQL's built-in defaults never appear in it. Inside a PL/pgSQL loop that creates and rolls back objects, look them up with `to_regprocedure()` / `to_regclass()` at run time, not a `'...'::regproc` constant, which is fixed in the cached plan.
