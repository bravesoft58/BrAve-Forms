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

### RLS rewrites that collapse a tier silently hide data — count rows under impersonation before AND after (2026-04-30)
- **Context:** BF-31 rewrote every public-table RLS policy to scope through `organization_members` and replaced the legacy `is_admin()` short-circuit with `is_super_admin()`. The story spec table at line 68 dropped the org-admin tier from project-level data (`form_submissions`, `form_photos`, `project_documents`, `project_permits`, `project_form_requirements`) — those policies became `is_super_admin() OR project_id = ANY(get_user_project_ids())`. The migration applied cleanly, all in-scope advisors closed, isolation tests passed.
- **Problem:** Verify caught a measurable production data hide event: 3 of 3 Q&D org admins lost visibility to records they previously saw via the `is_admin()` short-circuit. Andy went from 14 to 7 submissions, Claude Test from 14 to 6, **Gracie from 14 to 0**. Only Tim (the sole `super_admin`) retained global view. The phrase "rewrite to scope through org membership" reads like a 1:1 substitution but is actually a tier collapse: pre-RLS, `profiles.role='admin'` was BOTH "manage org" AND "see all project data"; post-RLS those are two separate tiers (`is_org_admin(org)` and `project_users` membership) and the spec inadvertently kept only the latter for project-level reads. Asymmetric: `qr_tokens_all`, `project_documents_delete`, `permits_insert/update/delete`, and `form_requirements_insert/update/delete` already had the `is_org_admin` clause, but the SELECT (and submissions/photos/documents INSERT-UPDATE) policies didn't.
- **Fix:** Additive migration `20260430140000_admin_org_access.sql` adds `OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))` to the 9 affected policies. Pattern matches the BF-31 mutation policies that were already correct. Post-fix verification: orphan still 0/everything (isolation preserved), plain member still 0 project-level + 6 org projects (BF-31 design intact), Andy/Gracie/Claude all see 14/14 submissions, super_admin unchanged.
- **Prevention:** When an RLS rewrite collapses or splits a tier (e.g. `is_admin` → `is_super_admin` + `is_org_admin`), produce a tier-by-tier visibility matrix BEFORE writing the migration: for each (table × admin tier) cell, list the policy clauses that grant access. Any cell that goes from "granted" to "denied" is a behavioral regression and must be either explicitly accepted with documented UAT impact or carry a forward clause. Don't trust prose — count rows under impersonation (`set_config('request.jwt.claims', ...) + SET LOCAL ROLE authenticated`) before AND after on production data, for every (admin tier × table) combination, not just the orphan-isolation case. The orphan check proves no leaks; the per-tier count proves no silent hides.
