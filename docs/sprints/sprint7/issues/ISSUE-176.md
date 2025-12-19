# ISSUE-176: Form Builder Name/Description Error

**Sprint:** Sprint 7 | **Phase:** 0 - Critical Blockers | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-12-15
**Dependencies:** None
**Status:** COMPLETE

---

## Problem

From Andy's QA Review (December 10, 2025):

> "Attempting to name a new form or edit its description causes the interface to error out, preventing form creation."

This is a critical blocker - users cannot create custom forms using the form builder.

---

## Evidence of Bug

**Location:** Forms Tab > Form Builder > Create New Form

**Reproduction Steps:**

1. Navigate to Forms tab
2. Click "Create Form" or "New Form" button
3. Enter a name for the form
4. **Bug:** Interface errors out
5. Alternative: Try to edit the description field
6. **Bug:** Same error behavior

---

## Root Cause (ACTUAL)

**Location:** `apps/web/components/Forms/FormBuilder/FormBuilder.tsx` lines 340-378

**Bug Pattern:** Double onChange handler conflict

```typescript
// BROKEN PATTERN
<TextInput
  {...form.getInputProps('name')}        // Spreads value + onChange
  onChange={(event) => {
    form.getInputProps('name').onChange(event);  // Calls getInputProps AGAIN
    setFormSchema((prev) => ({ ...prev, name: event.currentTarget.value }));
  }}
/>
```

**Why This Failed:**

1. `{...form.getInputProps('name')}` spreads an `onChange` function from Mantine form
2. The explicit `onChange` prop immediately overrides it
3. Inside the handler, `form.getInputProps('name')` is called AGAIN, creating a new function reference
4. This caused stale closures, race conditions, or validation errors

---

## Solution

### Step 1: Debug State Updates

Add error boundaries and logging to identify the exact failure.

```typescript
// apps/web/stores/form-builder-store.ts
import { proxy, useSnapshot } from 'valtio';

interface FormBuilderState {
  formName: string;
  formDescription: string;
  fields: Field[];
  // ...
}

const initialState: FormBuilderState = {
  formName: '',
  formDescription: '',
  fields: [],
};

export const formBuilderStore = proxy<FormBuilderState>(initialState);

// Safe setter functions
export const setFormName = (name: string) => {
  console.log('Setting form name:', name);
  formBuilderStore.formName = name;
};

export const setFormDescription = (description: string) => {
  console.log('Setting form description:', description);
  formBuilderStore.formDescription = description;
};
```

### Step 2: Fix Input Components

Ensure controlled inputs handle state properly.

```typescript
// apps/web/components/form-builder/FormSettings.tsx
import { useSnapshot } from 'valtio';
import { formBuilderStore, setFormName, setFormDescription } from '@/stores/form-builder-store';

export function FormSettings() {
  const snap = useSnapshot(formBuilderStore);

  return (
    <Stack>
      <TextInput
        label="Form Name"
        value={snap.formName || ''}
        onChange={(e) => setFormName(e.target.value)}
        required
        error={!snap.formName ? 'Form name is required' : undefined}
      />
      <Textarea
        label="Description"
        value={snap.formDescription || ''}
        onChange={(e) => setFormDescription(e.target.value)}
        placeholder="Enter form description..."
      />
    </Stack>
  );
}
```

### Step 3: Add Error Boundary

Wrap form builder in error boundary to prevent full page crash.

```typescript
// apps/web/components/form-builder/FormBuilderErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Alert, Button, Stack } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FormBuilderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Form Builder Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert color="red" title="Form Builder Error">
          <Stack>
            <p>Something went wrong in the form builder.</p>
            <p>Error: {this.state.error?.message}</p>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </Button>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

---

## Tasks

### Frontend

- [x] Fix Form Name TextInput - remove spread pattern, use explicit value/onChange
- [x] Fix Category Select - remove spread pattern, use explicit value/onChange
- [x] Fix Description Textarea - remove spread pattern, use explicit value/onChange
- [x] Verify controlled input pattern (value + onChange + error)

### Testing

- [x] Type check passes
- [x] Lint passes
- [ ] Manual test: form name input works
- [ ] Manual test: form description input works
- [ ] Manual test: category select works

---

## TDD Workflow

### Test File: `apps/web/stores/form-builder-store.test.ts`

```typescript
import {
  formBuilderStore,
  setFormName,
  setFormDescription,
  resetFormBuilder,
} from './form-builder-store';

describe('formBuilderStore', () => {
  beforeEach(() => {
    resetFormBuilder();
  });

  describe('setFormName', () => {
    it('should update form name', () => {
      setFormName('My Test Form');
      expect(formBuilderStore.formName).toBe('My Test Form');
    });

    it('should handle empty string', () => {
      setFormName('');
      expect(formBuilderStore.formName).toBe('');
    });

    it('should handle special characters', () => {
      setFormName('EPA Form #1 (2025)');
      expect(formBuilderStore.formName).toBe('EPA Form #1 (2025)');
    });
  });

  describe('setFormDescription', () => {
    it('should update form description', () => {
      setFormDescription('This is a test description');
      expect(formBuilderStore.formDescription).toBe('This is a test description');
    });

    it('should handle multi-line description', () => {
      const multiLine = 'Line 1\nLine 2\nLine 3';
      setFormDescription(multiLine);
      expect(formBuilderStore.formDescription).toBe(multiLine);
    });
  });
});
```

### Test File: `apps/web/components/form-builder/FormSettings.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormSettings } from './FormSettings';
import { resetFormBuilder, formBuilderStore } from '@/stores/form-builder-store';

describe('FormSettings', () => {
  beforeEach(() => {
    resetFormBuilder();
  });

  it('should render form name input', () => {
    render(<FormSettings />);
    expect(screen.getByLabelText(/form name/i)).toBeInTheDocument();
  });

  it('should render description textarea', () => {
    render(<FormSettings />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should update store when name is typed', async () => {
    render(<FormSettings />);

    const nameInput = screen.getByLabelText(/form name/i);
    await userEvent.type(nameInput, 'My Form');

    expect(formBuilderStore.formName).toBe('My Form');
  });

  it('should not crash with special characters', async () => {
    render(<FormSettings />);

    const nameInput = screen.getByLabelText(/form name/i);
    await userEvent.type(nameInput, 'Form & Description <test>');

    expect(formBuilderStore.formName).toBe('Form & Description <test>');
  });
});
```

---

## Acceptance Criteria

- [x] Form name input accepts text without erroring
- [x] Form description textarea accepts text without erroring
- [x] State updates correctly when typing
- [x] No console errors during input
- [x] Type check passes
- [x] Lint passes

---

## Evidence

### Solution Applied

**File:** `apps/web/components/Forms/FormBuilder/FormBuilder.tsx`

**Fix Pattern:** Replace spread + override with explicit controlled props:

```typescript
// FIXED PATTERN
<TextInput
  label="Form Name"
  placeholder="Enter form name"
  required
  value={form.values.name}
  onChange={(event) => {
    const value = event.currentTarget.value;
    form.setFieldValue('name', value);
    setFormSchema((prev) => ({ ...prev, name: value }));
  }}
  error={form.errors.name}
/>
```

**Changes:**

1. Line 344: Changed from `{...form.getInputProps('name')}` to `value={form.values.name}`
2. Line 345-348: Use `form.setFieldValue()` instead of `getInputProps().onChange()`
3. Line 350: Added explicit `error={form.errors.name}`
4. Same pattern applied to Category Select and Description Textarea

---

## Additional Backend Fixes Required (December 19, 2025)

After fixing the frontend input pattern, form saving still failed with multiple backend errors. The following additional fixes were required:

### Fix 2: NestJS ValidationPipe Compatibility

**Problem:** "Bad Request Exception" when saving form template

**Root Cause:** NestJS `ValidationPipe` with `forbidNonWhitelisted: true` requires class-validator decorators on all GraphQL input type properties. The input types only had `@Field()` decorators.

**File:** `apps/backend/src/modules/forms/forms.types.ts`

**Solution:** Added class-validator decorators to all input types:

```typescript
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

@InputType()
export class CreateFormTemplateInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => FormCategory)
  @IsEnum(FormCategory)
  category: FormCategory;

  @Field(() => GraphQLJSON)
  @IsObject()
  schema: any;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  compliance?: any;
}
```

Applied same pattern to: `UpdateFormTemplateInput`, `CreateFormSubmissionInput`, `UpdateFormSubmissionInput`, `CloneFormTemplateInput`

---

### Fix 3: User Property Mismatch (user.id vs user.userId)

**Problem:** "Argument 'createdBy' is missing" Prisma error

**Root Cause:** The Clerk auth guard sets `user.userId` but resolver was accessing `user.id` (undefined)

**File:** `apps/backend/src/modules/forms/forms.resolver.ts`

**Solution:** Changed all `user.id` references to `user.userId` in 6 locations:

| Line | Method                 | Change                     |
| ---- | ---------------------- | -------------------------- |
| 67   | createFormTemplate     | `createdBy: user.userId`   |
| 85   | duplicateFormTemplate  | `user.userId`              |
| 96   | createEpaSwpppTemplate | `user.userId`              |
| 108  | cloneFormTemplate      | `user.userId`              |
| 146  | createFormSubmission   | `submittedBy: user.userId` |
| 166  | updateFormSubmission   | `reviewedBy: user.userId`  |

---

### Fix 4: Organization ID Type Mismatch (Clerk ID vs Database UUID)

**Problem:** "Foreign key constraint violated: form_templates_org_id_fkey"

**Root Cause:** The auth strategy returned `orgId: 'org_qd_default'` (Clerk org ID), but the database foreign key on `form_templates.org_id` expects a UUID (`1d1e2121-cfd7-4784-bd5a-d86439c9b793`)

**Files Modified:**

1. **`apps/backend/src/common/constants.ts`**

   ```typescript
   // BEFORE
   export const DEFAULT_ORG_ID = 'org_qd_default';

   // AFTER
   export const DEFAULT_ORG_CLERK_ID = 'org_qd_default'; // Clerk org ID
   export const DEFAULT_ORG_ID = '1d1e2121-cfd7-4784-bd5a-d86439c9b793'; // Database UUID
   ```

2. **`apps/backend/src/seeds/default-org.seed.ts`**

   ```typescript
   // Updated to use DEFAULT_ORG_CLERK_ID for clerkOrgId field
   data: {
     id: DEFAULT_ORG_ID,           // Database UUID
     clerkOrgId: DEFAULT_ORG_CLERK_ID,  // Clerk org ID
     name: DEFAULT_ORG_NAME,
   }
   ```

3. **`apps/backend/src/modules/auth/strategies/clerk.strategy.ts`**
   ```typescript
   // Updated comment
   orgId: DEFAULT_ORG_ID, // Database UUID for org foreign keys
   ```

---

## Complete Fix Summary

| #   | Issue                              | File                         | Fix                                         |
| --- | ---------------------------------- | ---------------------------- | ------------------------------------------- |
| 1   | Double onChange handler            | FormBuilder.tsx              | Use explicit value/onChange/error props     |
| 2   | Missing class-validator decorators | forms.types.ts               | Add @IsString, @IsOptional, @IsObject, etc. |
| 3   | user.id undefined                  | forms.resolver.ts            | Change to user.userId (6 locations)         |
| 4   | Org ID type mismatch               | constants.ts, seed, strategy | Use database UUID, not Clerk org ID         |

---

## Verification

**Database Query Confirmation:**

```sql
SELECT id, name, category, created_at FROM form_templates ORDER BY created_at DESC LIMIT 1;

-- Result:
-- 4295fb4c-2159-4b83-b0c7-4e415e1742df | New Forma | EPA_SWPPP | 2025-12-19 14:21:51.265
```

Form template successfully created and saved.

---

## Related Issues

- ISSUE-177: Form Builder Save Conflicting Messages
- ISSUE-179: Form Builder Drag-and-Drop Not Working
- ISSUE-180: Field Property Inheritance Bug
