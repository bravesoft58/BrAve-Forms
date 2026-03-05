# Lessons Learned

### Dead AuthState fields in Next.js server actions (2026-03-05)
- **Context:** BF-02 Supabase Auth signup action
- **Problem:** `success?: boolean` field defined in AuthState type but never set or read. Dead code shipped.
- **Fix:** Removed the unused field during verify.
- **Prevention:** When defining return types for server actions, only include fields that are actually used by the consuming component.
