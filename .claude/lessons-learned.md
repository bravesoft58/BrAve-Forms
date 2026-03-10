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
