# ISSUE-177: Form Builder Save Conflicting Messages

**Sprint:** Sprint 7 | **Phase:** 0 - Critical Blockers | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-12-15
**Dependencies:** ISSUE-176
**Status:** COMPLETE

---

## Problem

From Andy's QA Review (December 10, 2025):

> "After saving a template, the system shows conflicting messages: 'Bad request' followed by 'Form saved successfully.' The form does not appear in the main Forms list, indicating it did not actually save."

This is a critical blocker - even when the form builder appears to work, forms don't actually save.

---

## Evidence of Bug

**Location:** Forms Tab > Form Builder > Save

**Reproduction Steps:**

1. Navigate to Form Builder
2. Create a form with name and fields
3. Click "Save" or "Save Template"
4. **Bug:** "Bad request" error appears
5. **Bug:** Then "Form saved successfully" appears
6. Navigate to Forms list
7. **Bug:** New form is not in the list

---

## Root Cause Investigation

### Files to Investigate

**Frontend:**

- `apps/web/app/dashboard/forms/builder/page.tsx` - Save button handler
- `apps/web/lib/api/form-templates.ts` - GraphQL mutations
- `apps/web/stores/form-builder-store.ts` - Form data state

**Backend:**

- `apps/backend/src/modules/form-templates/form-templates.resolver.ts` - Save resolver
- `apps/backend/src/modules/form-templates/form-templates.service.ts` - Validation logic
- `apps/backend/src/modules/form-templates/dto/create-form-template.input.ts` - Input DTO

### Likely Causes

1. **Race condition** - Two notifications firing from different code paths
2. **Validation failure** - Backend rejects but frontend shows success anyway
3. **Error handling bug** - Catch block shows success instead of error
4. **Optimistic UI** - Frontend assumes success before confirmation
5. **Missing error propagation** - GraphQL error not properly surfaced

---

## Solution

### Step 1: Fix Error Handling in Save

Ensure errors properly prevent success message.

```typescript
// apps/web/app/dashboard/forms/builder/page.tsx
const handleSave = async () => {
  setIsSaving(true);

  try {
    const formData = {
      name: formBuilderStore.formName,
      description: formBuilderStore.formDescription,
      schema: formBuilderStore.fields,
      category: formBuilderStore.category,
    };

    // Validate before sending
    if (!formData.name?.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Form name is required',
        color: 'red',
      });
      return;
    }

    const result = await createFormTemplate(formData);

    // Only show success if we got a valid result
    if (result?.id) {
      notifications.show({
        title: 'Success',
        message: 'Form template saved successfully',
        color: 'green',
      });
      router.push('/dashboard/forms');
    } else {
      throw new Error('No form ID returned');
    }
  } catch (error) {
    console.error('Save failed:', error);
    notifications.show({
      title: 'Error',
      message: error.message || 'Failed to save form template',
      color: 'red',
    });
    // Do NOT show success message here!
  } finally {
    setIsSaving(false);
  }
};
```

### Step 2: Fix Backend Validation

Ensure backend returns proper errors with helpful messages.

```typescript
// apps/backend/src/modules/form-templates/form-templates.resolver.ts
@Mutation(() => FormTemplate)
@UseGuards(ClerkAuthGuard)
async createFormTemplate(
  @Args('input') input: CreateFormTemplateInput,
  @CurrentUser() user: CurrentUser,
) {
  this.logger.log(`Creating form template: ${input.name}`);

  // Validate input
  if (!input.name?.trim()) {
    throw new BadRequestException('Form name is required');
  }

  if (!input.schema || !Array.isArray(input.schema)) {
    throw new BadRequestException('Form schema is required');
  }

  try {
    const template = await this.formTemplatesService.create({
      ...input,
      orgId: user.orgId,
      createdBy: user.id,
    });

    this.logger.log(`Form template created: ${template.id}`);
    return template;
  } catch (error) {
    this.logger.error(`Failed to create template: ${error.message}`);

    if (error.code === 'P2002') {
      throw new BadRequestException('A form with this name already exists');
    }

    throw new BadRequestException(`Failed to save form: ${error.message}`);
  }
}
```

### Step 3: Fix GraphQL Error Handling

Ensure GraphQL errors are properly caught and surfaced.

```typescript
// apps/web/lib/api/form-templates.ts
export async function createFormTemplate(input: CreateFormTemplateInput) {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CREATE_FORM_TEMPLATE,
      variables: { input },
    }),
  });

  const result = await response.json();

  // Check for GraphQL errors
  if (result.errors && result.errors.length > 0) {
    const errorMessage = result.errors[0].message;
    throw new Error(errorMessage);
  }

  // Check for missing data
  if (!result.data?.createFormTemplate) {
    throw new Error('No data returned from server');
  }

  return result.data.createFormTemplate;
}
```

---

## Tasks

### Backend

- [ ] Add detailed validation in createFormTemplate resolver
- [ ] Return specific error messages for each validation failure
- [ ] Log all create attempts (success and failure)
- [ ] Handle database constraint errors gracefully

### Frontend

- [ ] Remove any duplicate notification calls
- [ ] Ensure success only shows after confirmed save
- [ ] Validate form data before sending to backend
- [ ] Properly catch and display GraphQL errors
- [ ] Add loading state to prevent double-submit

### Testing

- [ ] Write test: save with valid data returns ID
- [ ] Write test: save with missing name returns error
- [ ] Write test: save with empty schema returns error
- [ ] Write test: duplicate name returns error
- [ ] E2E test: full save flow

---

## TDD Workflow

### Test File: `apps/backend/src/modules/form-templates/form-templates.resolver.spec.ts`

```typescript
describe('FormTemplatesResolver', () => {
  describe('createFormTemplate', () => {
    it('should create template with valid input', async () => {
      const input = {
        name: 'Test Form',
        description: 'A test form',
        schema: [{ type: 'text', label: 'Name', required: true }],
        category: 'CUSTOM',
      };

      const result = await resolver.createFormTemplate(input, mockUser);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Form');
    });

    it('should throw error for missing name', async () => {
      const input = {
        name: '',
        schema: [{ type: 'text', label: 'Name' }],
      };

      await expect(resolver.createFormTemplate(input, mockUser)).rejects.toThrow(
        'Form name is required'
      );
    });

    it('should throw error for missing schema', async () => {
      const input = {
        name: 'Test Form',
        schema: null,
      };

      await expect(resolver.createFormTemplate(input, mockUser)).rejects.toThrow(
        'Form schema is required'
      );
    });

    it('should throw error for duplicate name in same org', async () => {
      const input = { name: 'Existing Form', schema: [] };

      // First create should succeed
      await resolver.createFormTemplate(input, mockUser);

      // Second create should fail
      await expect(resolver.createFormTemplate(input, mockUser)).rejects.toThrow('already exists');
    });
  });
});
```

### Test File: `apps/web/app/dashboard/forms/builder/page.test.tsx`

```typescript
describe('Form Builder Save', () => {
  it('should show success only when save succeeds', async () => {
    mockCreateTemplate.mockResolvedValue({ id: '123', name: 'Test' });

    render(<FormBuilderPage />);

    // Fill form
    await userEvent.type(screen.getByLabelText(/form name/i), 'Test Form');

    // Save
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // Should show success
    expect(await screen.findByText(/saved successfully/i)).toBeInTheDocument();

    // Should NOT show error
    expect(screen.queryByText(/bad request/i)).not.toBeInTheDocument();
  });

  it('should show error only when save fails', async () => {
    mockCreateTemplate.mockRejectedValue(new Error('Validation failed'));

    render(<FormBuilderPage />);

    await userEvent.type(screen.getByLabelText(/form name/i), 'Test Form');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // Should show error
    expect(await screen.findByText(/validation failed/i)).toBeInTheDocument();

    // Should NOT show success
    expect(screen.queryByText(/saved successfully/i)).not.toBeInTheDocument();
  });

  it('should not show both error and success', async () => {
    // This is the bug we're fixing
    mockCreateTemplate.mockRejectedValue(new Error('Bad request'));

    render(<FormBuilderPage />);

    await userEvent.type(screen.getByLabelText(/form name/i), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/bad request/i);
      const successMessages = screen.queryAllByText(/saved successfully/i);

      // Should not have both
      expect(errorMessages.length > 0 && successMessages.length > 0).toBe(false);
    });
  });
});
```

---

## Acceptance Criteria

- [ ] Save shows ONLY success OR error, never both
- [ ] Form appears in list after successful save
- [ ] Clear error message shown on failure
- [ ] Backend validates all required fields
- [ ] Duplicate names prevented with helpful error
- [ ] Tests passing
- [ ] Coverage >80% for save logic

---

## Evidence Required

- [ ] Screenshot of conflicting messages (current bug)
- [ ] Screenshot of single success message (after fix)
- [ ] Screenshot of form appearing in list
- [ ] Console/network log showing successful mutation
- [ ] Test results output

---

## Root Cause (ACTUAL)

**Bug Pattern:** Duplicate notification handling in two locations

**Location 1:** `apps/web/components/Forms/FormBuilder/FormBuilder.tsx` (lines 276-288)

```typescript
// FormBuilder showed its own success/error notifications
await onSave(templateData);
notifications.show({ title: 'Form Saved', ... });  // Success
// catch block also showed error notification
```

**Location 2:** `apps/web/app/dashboard/forms/builder/page.tsx` (lines 41-55)

```typescript
// Parent page ALSO showed success/error notifications
await createTemplate(input);
notifications.show({ title: 'Form Template Created', ... });  // Success
// catch block also showed error notification
```

**Why This Caused "Bad Request" + "Form Saved":**

Before ISSUE-176 fix:

1. Backend threw validation error ("Bad Request")
2. page.tsx caught error and showed "Error Saving Template" notification
3. **But page.tsx didn't re-throw** - so `onSave` returned normally to FormBuilder
4. FormBuilder thought save succeeded and showed "Form Saved" notification

After ISSUE-176 fix (current behavior):

1. Backend succeeds
2. page.tsx shows "Form Template Created" notification
3. FormBuilder shows "Form Saved" notification
4. **Result: Two success notifications** (still a bug, just different symptom)

---

## Solution Applied

**File:** `apps/web/components/Forms/FormBuilder/FormBuilder.tsx`

**Fix:** Removed duplicate notifications from FormBuilder. Parent pages now handle all post-save feedback.

```typescript
// BEFORE (lines 274-290)
await onSave(templateData);
notifications.show({
  title: 'Form Saved',
  message: 'Form template saved successfully',
  color: 'green',
});
// catch also showed error notification

// AFTER (lines 274-282)
// ISSUE-177 fix: Let parent page handle success/error notifications
// to avoid duplicate notification messages
await onSave(templateData);
// catch only logs error - parent handles notification
```

**Rationale:**

- FormBuilder is a reusable component used by multiple pages
- Each page has context-aware notifications (form name, navigation after save)
- Single source of truth for user feedback prevents duplicates

---

## Verification

Test the following scenarios:

1. **Save succeeds:** Only ONE "Form Template Created" notification appears
2. **Save fails:** Only ONE error notification appears
3. **Validation error:** FormBuilder shows validation feedback (kept - not duplicate)

---

## Related Issues

- ISSUE-176: Form Builder Name/Description Error
- ISSUE-179: Form Builder Drag-and-Drop Not Working
- ISSUE-180: Field Property Inheritance Bug
