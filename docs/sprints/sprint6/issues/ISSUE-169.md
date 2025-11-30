# ISSUE-169: Form Builder Edit Page (4h)

**Sprint:** Sprint 6 | **Phase:** 0 - Critical Blockers | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-11-30
**Dependencies:** ISSUE-168 (Form Builder Backend Integration)
**Status:** COMPLETE

---

## Problem

Edit page at `/builder/[id]` has placeholder template loader that returns null. Users cannot edit existing form templates because:
1. Template is not loaded from backend
2. Update mutation is not wired
3. Version conflicts are not handled

---

## Evidence of Gap

- `apps/web/app/dashboard/forms/builder/[id]/page.tsx` - Placeholder loader returns null
- No GraphQL query to fetch template by ID
- No TanStack Query hook for fetching single template

---

## Solution

1. Load template from backend via `formTemplate(id)` query
2. Populate form-builder-store with loaded data
3. Wire `updateFormTemplate` mutation on save
4. Handle version conflicts (optimistic locking)

---

## Tasks

- [ ] Add `formTemplate(id)` query to `apps/web/lib/graphql/forms.queries.ts`
- [ ] Add `useFormTemplate(id)` hook to `apps/web/hooks/useFormTemplates.ts`
- [ ] Update `apps/web/app/dashboard/forms/builder/[id]/page.tsx` to load template
- [ ] Populate form-builder-store with fetched template data
- [ ] Wire `updateFormTemplate` mutation on save
- [ ] Handle loading and error states
- [ ] Add version conflict detection
- [ ] Write tests for edit functionality

---

## Files to Modify

- `apps/web/lib/graphql/forms.queries.ts` - Add formTemplate query
- `apps/web/hooks/useFormTemplates.ts` - Add useFormTemplate hook
- `apps/web/app/dashboard/forms/builder/[id]/page.tsx` - Wire to backend

---

## GraphQL Operations to Add

```typescript
// forms.queries.ts
export const GET_FORM_TEMPLATE = gql`
  query FormTemplate($id: String!) {
    formTemplate(id: $id) {
      id
      name
      description
      category
      schema
      isActive
      version
      createdAt
      updatedAt
    }
  }
`;
```

---

## Hook Implementation

```typescript
// In useFormTemplates.ts
export function useFormTemplate(id: string | null) {
  return useQuery({
    queryKey: ['formTemplate', id],
    queryFn: () => (id ? getFormTemplate(id) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFormTemplateInput }) =>
      updateFormTemplate(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['formTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['formTemplate', variables.id] });
    },
  });
}
```

---

## Edit Page Flow

1. Extract template ID from URL params
2. Fetch template via `useFormTemplate(id)`
3. Show loading skeleton while fetching
4. Populate form-builder-store with template data
5. User edits form
6. On save, call `updateFormTemplate` mutation
7. Handle success: redirect to forms list
8. Handle error: show toast with message

---

## Version Conflict Handling

```typescript
// Check if template was modified since fetch
if (serverVersion !== localVersion) {
  // Show conflict dialog
  // Options: Overwrite, Merge, Cancel
}
```

---

## Acceptance Criteria

- [ ] Edit page loads existing template from backend
- [ ] Template data populates Form Builder UI
- [ ] Changes save via updateFormTemplate mutation
- [ ] Success redirects to forms list
- [ ] Error shows toast message
- [ ] Loading state shown during fetch
- [ ] Version conflicts detected and handled
- [ ] Tests passing (>80% coverage)

---

## Evidence Required

- [ ] Screenshot of edit page loading template
- [ ] Screenshot of saved changes appearing in list
- [ ] Test results screenshot
- [ ] Code review findings documented

---

## Related Issues

- ISSUE-168: Form Builder Backend Integration (required dependency)
- ISSUE-162: Similar TanStack Query patterns (reference)
