# Lessons Learned

### Nested label elements cause unintended checkbox toggling (2026-03-09)
- **Context:** BF-12 NDOT Stormwater form — CSW N/A and Precip N/A inline checkboxes
- **Problem:** Wrapping a `<label>` inside another `<label>` causes clicking the outer label text (e.g., "CSW Tracking #") to toggle the nested checkbox. Invalid HTML, unexpected UX.
- **Fix:** Replace outer `<label>` with a `<div>` using the same CSS classes. Keep inner `<label>` wrapping just the checkbox + "N/A" text.
- **Prevention:** When placing inline checkboxes next to field labels, use a `<div>` or `<span>` wrapper — never nest `<label>` elements.

### Dead AuthState fields in Next.js server actions (2026-03-05)
- **Context:** BF-02 Supabase Auth signup action
- **Problem:** `success?: boolean` field defined in AuthState type but never set or read. Dead code shipped.
- **Fix:** Removed the unused field during verify.
- **Prevention:** When defining return types for server actions, only include fields that are actually used by the consuming component.
