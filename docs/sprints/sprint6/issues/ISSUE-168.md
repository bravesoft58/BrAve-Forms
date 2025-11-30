# ISSUE-168: Form Builder Backend Integration (8h)

**Sprint:** Sprint 6 | **Phase:** 0 - Critical Blockers | **Priority:** P0
**Time:** 8 hours | **Complexity:** High
**Created:** 2025-11-30
**Dependencies:** Backend forms.resolver.ts mutations exist
**Status:** COMPLETE

---

## Problem

Form Builder only saves to localStorage via `form-builder-store.ts`. The backend has mutations (`createFormTemplate`, `updateFormTemplate`) ready but the frontend never calls them. Users cannot persist form templates to the database.

---

## Evidence of Gap

- `apps/web/app/dashboard/forms/builder/page.tsx` line 19-26: TODO comment + console.log only
- `apps/web/lib/stores/form-builder-store.ts` line 172: `STORAGE_KEY = 'braveforms_form_builder_draft'`
- Backend mutations exist: `apps/backend/src/modules/forms/forms.resolver.ts` lines 55-111

**Current handleSave implementation:**
```typescript
const handleSave = async (template: Partial<FormTemplate>) => {
  // TODO: Implement GraphQL mutation to save form template
  console.log('Saving new form template:', template);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Fake delay
  router.push('/dashboard/forms');
};
```

---

## Solution

1. Create GraphQL mutation documents
2. Create TanStack Query hooks with mutations
3. Wire builder page to call mutations
4. Add Clerk authentication
5. Handle type conversion (fields[] to schema JSONB)

---

## Tasks

- [ ] Create `apps/web/lib/graphql/forms.mutations.ts`
- [ ] Create `apps/web/lib/graphql/forms.queries.ts`
- [ ] Create `apps/web/hooks/useFormTemplates.ts` with mutations
- [ ] Update `apps/web/app/dashboard/forms/builder/page.tsx` to call createFormTemplate
- [ ] Add Clerk auth: `import { useAuth } from '@clerk/nextjs'`
- [ ] Convert `fields[]` to `schema` JSONB on save
- [ ] Keep localStorage as offline backup (draft saving)
- [ ] Write tests for new hooks (>80% coverage)

---

## Files to Create

- `apps/web/lib/graphql/forms.mutations.ts`
- `apps/web/lib/graphql/forms.queries.ts`
- `apps/web/hooks/useFormTemplates.ts`
- `apps/web/hooks/__tests__/useFormTemplates.test.tsx`

---

## Files to Modify

- `apps/web/app/dashboard/forms/builder/page.tsx`
- `apps/web/lib/stores/form-builder-store.ts` (optional cleanup)

---

## Type Conversion Required

```typescript
// Frontend FormBuilder outputs:
{
  name: string;
  description: string;
  category: string;
  fields: FieldDefinition[];
}

// Backend CreateFormTemplateInput expects:
{
  name: string;
  description?: string;
  category: FormCategory;
  schema: JSON; // JSONB field - wrap fields array
}

// Conversion:
const input = {
  name: template.name,
  description: template.description,
  category: template.category as FormCategory,
  schema: { fields: template.fields }, // Wrap in object
};
```

---

## Backend Reference

From `apps/backend/src/modules/forms/forms.resolver.ts`:

```typescript
@Mutation(() => FormTemplate)
async createFormTemplate(
  @Args('input') input: CreateFormTemplateInput,
  @CurrentUser() user: any
): Promise<FormTemplate> {
  return this.formsService.createFormTemplate({
    orgId: user.orgId,
    name: input.name,
    description: input.description,
    category: input.category,
    schema: input.schema,
    compliance: input.compliance,
    createdBy: user.id,
  });
}
```

---

## GraphQL Operations to Create

```typescript
// forms.mutations.ts
export const CREATE_FORM_TEMPLATE = gql`
  mutation CreateFormTemplate($input: CreateFormTemplateInput!) {
    createFormTemplate(input: $input) {
      id
      name
      description
      category
      schema
      isActive
      createdAt
    }
  }
`;

export const UPDATE_FORM_TEMPLATE = gql`
  mutation UpdateFormTemplate($id: String!, $input: UpdateFormTemplateInput!) {
    updateFormTemplate(id: $id, input: $input) {
      id
      name
      description
      category
      schema
      isActive
      updatedAt
    }
  }
`;
```

---

## Acceptance Criteria

- [ ] Form Builder "Save" creates template in database
- [ ] Template appears in Forms list after save
- [ ] User redirected to forms list after successful save
- [ ] Error toast shown on save failure
- [ ] Loading state shown during save
- [ ] Tests passing (>80% coverage)
- [ ] localStorage used as offline draft backup only
- [ ] Clerk authentication properly configured

---

## Evidence Required

- [ ] Screenshot of form saved to database
- [ ] Screenshot of form appearing in list
- [ ] Test results screenshot (>80% coverage)
- [ ] Code review findings documented

---

## Related Issues

- ISSUE-169: Form Builder Edit Page (loads saved templates)
- ISSUE-162: Similar pattern for form submissions (reference implementation)
