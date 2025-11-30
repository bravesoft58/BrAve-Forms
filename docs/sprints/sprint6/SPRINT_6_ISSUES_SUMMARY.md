# Sprint 6 Issues Summary

**Sprint:** Sprint 6 - Production Backend Integration
**Total Issues:** 7
**Total Hours:** 37h
**Status:** IN PROGRESS
**Created:** 2025-11-30

---

## Quick Reference

| Issue | Title | Phase | Priority | Hours | Status |
|-------|-------|-------|----------|-------|--------|
| [ISSUE-168](issues/ISSUE-168.md) | Form Builder Backend Integration | 0 | P0 | 8h | PENDING |
| [ISSUE-169](issues/ISSUE-169.md) | Form Builder Edit Page | 0 | P0 | 4h | PENDING |
| [ISSUE-170](issues/ISSUE-170.md) | Replace Mock Projects Data | 1 | P1 | 4h | PENDING |
| [ISSUE-171](issues/ISSUE-171.md) | Photo Gallery GraphQL Migration | 1 | P1 | 6h | PENDING |
| [ISSUE-172](issues/ISSUE-172.md) | Photo Pairing Backend | 1 | P1 | 4h | PENDING |
| [ISSUE-173](issues/ISSUE-173.md) | User Preferences Backend | 1 | P1 | 8h | PENDING |
| [ISSUE-174](issues/ISSUE-174.md) | Help/Support Backend | 2 | P2 | 3h | PENDING |

---

## Phase Breakdown

### Phase 0: Critical Production Blockers (12h)
- ISSUE-168: Form Builder Backend Integration (8h)
- ISSUE-169: Form Builder Edit Page (4h)

### Phase 1: MVP Required Features (22h)
- ISSUE-170: Replace Mock Projects Data (4h)
- ISSUE-171: Photo Gallery GraphQL Migration (6h)
- ISSUE-172: Photo Pairing Backend (4h)
- ISSUE-173: User Preferences Backend (8h)

### Phase 2: Important Completeness (3h)
- ISSUE-174: Help/Support Backend (3h)

---

## Dependencies

```
ISSUE-168 (Form Builder Save)
    └── ISSUE-169 (Form Builder Edit) - uses same hooks

ISSUE-170 (Projects) - Independent
ISSUE-171 (Photo Gallery) - Independent
ISSUE-172 (Photo Pairing) - Independent
ISSUE-173 (User Preferences) - Independent
ISSUE-174 (Help/Support) - Independent
```

---

## Files to Create (Summary)

### GraphQL Operations
- `apps/web/lib/graphql/forms.mutations.ts` (ISSUE-168)
- `apps/web/lib/graphql/forms.queries.ts` (ISSUE-168)
- `apps/web/lib/graphql/photos.queries.ts` (ISSUE-171)
- `apps/web/lib/graphql/preferences.mutations.ts` (ISSUE-173)

### Hooks
- `apps/web/hooks/useFormTemplates.ts` (ISSUE-168)
- `apps/web/hooks/useProjects.ts` (ISSUE-170)
- `apps/web/hooks/usePhotos.ts` (ISSUE-171)
- `apps/web/hooks/usePhotoPairing.ts` (ISSUE-172)
- `apps/web/hooks/useUserPreferences.ts` (ISSUE-173)

### Backend (New)
- `packages/database/schema.prisma` - UserPreferences, SupportRequest models
- `apps/backend/src/modules/support/` - New module (ISSUE-174)

---

## Files to Delete (After Verification)

- `apps/web/lib/mock-data/projects.ts`
- `apps/web/lib/mock-data/form-templates.ts` (if redundant)

---

## Completion Tracking

- [ ] 0/7 issues complete (0%)
- [ ] Phase 0: 0/2 (0%)
- [ ] Phase 1: 0/4 (0%)
- [ ] Phase 2: 0/1 (0%)

---

**Note:** Weather monitoring (ISSUE-175) was removed after verification showed it is FULLY FUNCTIONAL with proper 0.25" threshold implementation.
