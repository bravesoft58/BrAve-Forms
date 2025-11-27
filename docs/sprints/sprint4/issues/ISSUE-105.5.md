# ISSUE-105.5: Web UI Integration and Template Rendering Fixes

**Sprint:** Sprint 4 | **Phase:** Integration Testing | **Priority:** P0
**Time:** 4 hours (spread across sessions) | **Complexity:** Medium
**Created:** 2025-11-26
**Dependencies:** ISSUE-105 (QR Portal Tests), Phase 2 Templates (ISSUE-106 to ISSUE-117)
**Status:** COMPLETE

## Summary

This issue documents the integration work required to make all 21 form templates render correctly in the web UI after the Phase 2 template creation was complete. Multiple bugs were discovered and fixed during integration testing.

## Problems Discovered

### Problem 1: Zod Schema Generation Bug ("s.max is not a function")

**Symptom:** Forms crashed when rendering with error "s.max is not a function"

**Root Cause:** In `FormRenderer.tsx`, the `generateStringSchema` function called `.optional()` before applying validation methods like `.min()`, `.max()`, and `.regex()`. However, `.optional()` returns a `ZodOptional` type which does NOT have these methods.

**Location:** `apps/web/components/Forms/FormRenderer/FormRenderer.tsx:453-493`

**Before (Broken):**
```typescript
function generateStringSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny = z.string();

  if (!field.required) {
    schema = schema.optional();  // Returns ZodOptional - BREAKS subsequent calls
  }

  // These fail because ZodOptional doesn't have these methods
  if (field.validation?.minLength) {
    schema = (schema as z.ZodString).min(field.validation.minLength);
  }
  if (field.validation?.maxLength) {
    schema = (schema as z.ZodString).max(field.validation.maxLength);  // CRASH HERE
  }
  // ...
}
```

**After (Fixed):**
```typescript
function generateStringSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodString = z.string();  // Keep as ZodString type

  // Apply all string validations FIRST (while still a ZodString)
  if (field.required) {
    schema = schema.min(1, `${field.label} is required`);
  }

  if (field.validation?.minLength) {
    schema = schema.min(
      field.validation.minLength,
      field.validation.customMessage || `Minimum ${field.validation.minLength} characters required`
    );
  }

  if (field.validation?.maxLength) {
    schema = schema.max(
      field.validation.maxLength,
      field.validation.customMessage || `Maximum ${field.validation.maxLength} characters allowed`
    );
  }

  if (field.validation?.pattern) {
    schema = schema.regex(
      new RegExp(field.validation.pattern),
      field.validation.customMessage || 'Invalid format'
    );
  }

  // Apply optional LAST (after all validations)
  if (!field.required) {
    return schema.optional();
  }

  return schema;
}
```

### Problem 2: GraphQL Endpoint Configuration (Previous Session)

**Symptom:** "Failed to fetch" errors when loading templates

**Root Cause:** The web container was pointing to port 30101 but backend GraphQL was running on port 4000.

**Files Modified:**
- `apps/web/Dockerfile` - Added build-time ARG/ENV for NEXT_PUBLIC_GRAPHQL_ENDPOINT
- `docker-compose.yml` - Set correct GraphQL endpoint (http://localhost:4000/graphql)

### Problem 3: GraphQL Query Fields (Previous Session)

**Symptom:** GraphQL errors for non-existent fields

**Root Cause:** The frontend queries requested fields (`isSystemTemplate`, `offlineCapable`) that don't exist in the backend schema.

**Files Modified:**
- `apps/web/lib/api/forms.ts` - Removed non-existent fields from queries

### Problem 4: GraphQL ID Type Mismatch (Previous Session)

**Symptom:** Type validation errors for template ID parameter

**Root Cause:** Query used `ID!` type but backend expects `String!`

**Files Modified:**
- `apps/web/lib/api/forms.ts` - Changed `$id: ID!` to `$id: String!`

### Problem 5: Authentication Hook (Previous Session)

**Symptom:** Authentication failing in dashboard pages

**Root Cause:** Using Clerk's `useAuth` directly instead of the app's `useAppAuth` provider

**Files Modified:**
- `apps/web/app/dashboard/forms/page.tsx` - Changed from `useAuth` to `useAppAuth`

## Files Modified

| File | Change Description |
|------|-------------------|
| `apps/web/components/Forms/FormRenderer/FormRenderer.tsx` | Fixed Zod schema generation order - apply validations before optional |
| `apps/web/lib/api/forms.ts` | Removed non-existent fields, fixed ID type |
| `apps/web/Dockerfile` | Added GraphQL endpoint build-time configuration |
| `docker-compose.yml` | Fixed GraphQL endpoint environment variable |
| `apps/web/app/dashboard/forms/page.tsx` | Fixed auth hook import |

## Testing Evidence

### Templates Loading (21 Total)

All 21 form templates successfully load on the Forms page:
- 6 original templates (Daily Log, Weekly Inspection, etc.)
- 9 Q&D Agency templates from Phase 2 (ISSUE-106 to ISSUE-114)
- 6 additional Nevada templates (NDOT, NDEP, TMWA, etc.)

### Template Rendering Tests

**Simple Template Test:**
- Daily Log Template renders all fields correctly
- Date, weather, personnel fields functional
- Notes textarea operational

**Complex Template Test (NDOT SWPPP - 100+ fields):**
- All sections render without error
- Multi-page sections navigate correctly
- Conditional logic fields show/hide properly
- Signature capture field renders
- Auto-save draft working (shows "Draft saved at X:XX:XX PM")

### Screenshots Captured

- `.playwright-mcp/ndot-swppp-form-working.png` - Bottom of NDOT SWPPP form showing signature field
- `.playwright-mcp/ndot-swppp-form-top.png` - Top of NDOT SWPPP form showing header and fields

## Known Minor Issues (Non-Blocking)

These issues exist but do not block functionality:

1. **Unsupported Field Types:** `tel` and `email` types show "Unsupported field type" message
   - **Workaround:** These field types fall back to text display
   - **Fix:** Add case statements in FormRenderer switch for tel/email types (Sprint 5)

2. **Repeater Fields:** Show placeholder text instead of full repeater functionality
   - **Status:** Repeater implementation deferred to Sprint 5

3. **Draft Loading Loop:** Excessive console logs during draft load
   - **Impact:** Performance only, does not affect functionality
   - **Fix:** Add debouncing to draft load callback (Sprint 5)

## Quality Gates Passed

- [x] Templates load without error (21/21)
- [x] Simple forms render correctly
- [x] Complex forms (100+ fields) render correctly
- [x] Auto-save draft functional
- [x] Category filtering works
- [x] Template search works
- [x] No Zod schema errors
- [x] No GraphQL errors

## Time Breakdown

| Task | Time |
|------|------|
| Bug investigation (Zod schema) | 1h |
| Fix implementation | 30m |
| Docker rebuild and deploy | 30m |
| Integration testing with Playwright | 1h |
| Evidence collection | 30m |
| Documentation | 30m |
| **Total** | **4h** |

## Related Issues

- **ISSUE-105:** QR Portal Tests (prerequisite)
- **ISSUE-106 to ISSUE-117:** Phase 2 Q&D Agency Templates (templates being tested)
- **ISSUE-119:** Template Rendering Tests (formal test suite)

## Lessons Learned

1. **Zod Method Chaining:** Always apply string validations before calling `.optional()`. The method returns a different type that loses string-specific methods.

2. **Build-Time vs Runtime ENV:** Next.js `NEXT_PUBLIC_*` variables are baked in at build time. Docker containers need build ARGs to pass these values.

3. **GraphQL Schema Sync:** Keep frontend queries in sync with backend schema. Non-existent fields cause silent failures.

## Acceptance Criteria - COMPLETE

- [x] All 21 templates load on Forms page
- [x] Simple templates render without error
- [x] Complex templates (NDOT SWPPP) render all 100+ fields
- [x] Zod validation works for all field types
- [x] Auto-save draft functional
- [x] No JavaScript errors in console (critical ones)
- [x] Evidence screenshots collected

## Next Steps

1. **ISSUE-118:** QR Portal E2E Tests - Comprehensive E2E testing
2. **ISSUE-119:** Template Rendering Tests - Formal test coverage for all 21 templates
3. **Sprint 5:** Fix minor issues (tel/email types, repeater fields, draft loop)
