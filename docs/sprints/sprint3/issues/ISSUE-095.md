# ISSUE-095: Conditional Display Logic

**Sprint:** Sprint 3 | **Phase:** 4 - Dynamic Form Renderer | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Status:** COMPLETE
**Completed:** 2025-11-17
**Evidence:** docs/sprints/sprint3/PHASE_4_COMPLETION_REPORT.md
**Dependencies:** ISSUE-094 (all field types exist)

## What You'll Do

Implement show/hide logic for form fields based on other field values using React Hook Form's watch functionality and conditional rendering.

## Prerequisites

- [ ] ISSUE-080 complete (all 15 field types exist)
- [ ] Web app accessible at http://localhost:30102
- [ ] Code editor open to apps/web/components/Forms/FormRenderer
- [ ] React Hook Form installed

## Step-by-Step Instructions

### Step 1: Create Conditional Logic Hook (45 min)

Create `FormRenderer/useConditionalLogic.ts`:

```typescript
import { useMemo } from 'react';
import { FormField, ConditionalLogic } from './types';

/**
 * Evaluate conditional logic for field visibility
 *
 * @param field - Field with optional conditional logic
 * @param formValues - Current form values from React Hook Form watch()
 * @returns Whether field should be visible
 */
export function useConditionalLogic(
  field: FormField,
  formValues: Record<string, any>
): { isVisible: boolean } {
  const isVisible = useMemo(() => {
    // No conditional logic - always visible
    if (!field.conditional?.showIf) {
      return true;
    }

    const { showIf } = field.conditional;
    const targetValue = formValues[showIf.field];

    // Evaluate condition based on operator
    switch (showIf.operator) {
      case 'equals':
        return targetValue === showIf.value;

      case 'notEquals':
        return targetValue !== showIf.value;

      case 'contains':
        if (typeof targetValue === 'string') {
          return targetValue.includes(showIf.value);
        }
        if (Array.isArray(targetValue)) {
          return targetValue.includes(showIf.value);
        }
        return false;

      case 'greaterThan':
        return Number(targetValue) > Number(showIf.value);

      case 'lessThan':
        return Number(targetValue) < Number(showIf.value);

      default:
        console.warn(`Unknown conditional operator: ${showIf.operator}`);
        return true;
    }
  }, [field.conditional, formValues]);

  return { isVisible };
}
```

### Step 2: Update FormRenderer to Use Conditional Logic (30 min)

Edit `FormRenderer.tsx`:

```typescript
import { useConditionalLogic } from './useConditionalLogic';

export function FormRenderer({ template, onSubmit, initialValues, readOnly }: FormRendererProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  // Watch all form values for conditional logic
  const formValues = watch();

  // ... rest of component

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="form-renderer">
      <div className="form-fields">
        {template.fields.map((field) => {
          const error = errors[field.id] as FieldError;

          // Evaluate conditional logic
          const { isVisible } = useConditionalLogic(field, formValues);

          // Hide field if condition not met
          if (!isVisible) {
            return null;
          }

          // Render field (switch statement from ISSUE-080)
          switch (field.type) {
            case 'text':
              return <TextField key={field.id} field={field} register={register} error={error} disabled={readOnly} />;
            // ... other field types
          }
        })}
      </div>
    </form>
  );
}
```

### Step 3: Update ConditionalLogic Interface (10 min)

Verify `types.ts` has correct interface (from ISSUE-079):

```typescript
/**
 * Conditional Display Logic
 */
export interface ConditionalLogic {
  showIf?: {
    field: string; // ID of field to watch
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any; // Value to compare against
  };
}
```

### Step 4: Create Example Templates with Conditional Logic (20 min)

Create `apps/web/app/test-form/page.tsx` example:

```typescript
const conditionalTemplate: FormTemplate = {
  id: 'template_conditional',
  title: 'Safety Inspection with Conditional Fields',
  version: 1,
  fields: [
    {
      id: 'has_hazards',
      type: 'radio',
      label: 'Are there any safety hazards?',
      required: true,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      id: 'hazard_description',
      type: 'textarea',
      label: 'Describe the hazards',
      placeholder: 'Provide detailed description',
      required: true,
      conditional: {
        showIf: {
          field: 'has_hazards',
          operator: 'equals',
          value: 'yes',
        },
      },
    },
    {
      id: 'hazard_severity',
      type: 'select',
      label: 'Hazard Severity',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      conditional: {
        showIf: {
          field: 'has_hazards',
          operator: 'equals',
          value: 'yes',
        },
      },
    },
    {
      id: 'immediate_action',
      type: 'textarea',
      label: 'Immediate Action Required',
      placeholder: 'Describe action taken',
      required: true,
      conditional: {
        showIf: {
          field: 'hazard_severity',
          operator: 'equals',
          value: 'high',
        },
      },
    },
  ],
};
```

Test manually:

1. Select "No" for hazards - hazard fields hidden
2. Select "Yes" - hazard description and severity appear
3. Select "High" severity - immediate action field appears
4. Select "Low" severity - immediate action field hidden

**Screenshot:** Save conditional behavior to `evidence/ISSUE-081/test-results/conditional-hide-show.png`

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `__tests__/useConditionalLogic.test.ts`:

```typescript
import { renderHook } from '@testing-library/react';
import { useConditionalLogic } from '../useConditionalLogic';
import { FormField } from '../types';

describe('useConditionalLogic', () => {
  it('should return visible when no conditional logic', () => {
    const field: FormField = {
      id: 'field1',
      type: 'text',
      label: 'Field 1',
    };

    const { result } = renderHook(() => useConditionalLogic(field, {}));

    expect(result.current.isVisible).toBe(true);
  });

  it('should evaluate equals operator correctly', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'field1',
          operator: 'equals',
          value: 'yes',
        },
      },
    };

    // Field1 value is 'yes' - should be visible
    const { result: result1 } = renderHook(() => useConditionalLogic(field, { field1: 'yes' }));
    expect(result1.current.isVisible).toBe(true);

    // Field1 value is 'no' - should be hidden
    const { result: result2 } = renderHook(() => useConditionalLogic(field, { field1: 'no' }));
    expect(result2.current.isVisible).toBe(false);
  });

  it('should evaluate notEquals operator correctly', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'field1',
          operator: 'notEquals',
          value: 'no',
        },
      },
    };

    const { result } = renderHook(() => useConditionalLogic(field, { field1: 'yes' }));

    expect(result.current.isVisible).toBe(true);
  });

  it('should evaluate greaterThan operator correctly', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'count',
          operator: 'greaterThan',
          value: 5,
        },
      },
    };

    const { result: result1 } = renderHook(() => useConditionalLogic(field, { count: 10 }));
    expect(result1.current.isVisible).toBe(true);

    const { result: result2 } = renderHook(() => useConditionalLogic(field, { count: 3 }));
    expect(result2.current.isVisible).toBe(false);
  });

  it('should evaluate contains operator for strings', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'description',
          operator: 'contains',
          value: 'hazard',
        },
      },
    };

    const { result } = renderHook(() =>
      useConditionalLogic(field, { description: 'Contains hazard text' })
    );

    expect(result.current.isVisible).toBe(true);
  });
});
```

Run tests (should FAIL - red phase):

```bash
pnpm test useConditionalLogic.test.ts
```

Expected: Tests fail (hook not implemented yet)

**Screenshot:** Save failing test to `evidence/ISSUE-081/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement useConditionalLogic.ts as shown in Step 1.

Run tests again:

```bash
pnpm test useConditionalLogic.test.ts
```

Expected: All tests pass (5/5 passing)

**Screenshot:** Save passing tests to `evidence/ISSUE-081/test-results/green-phase.png`

## Files to Create/Modify

**Create:**

- apps/web/components/Forms/FormRenderer/useConditionalLogic.ts
- apps/web/components/Forms/FormRenderer/**tests**/useConditionalLogic.test.ts

**Modify:**

- apps/web/components/Forms/FormRenderer/FormRenderer.tsx (add conditional logic evaluation)
- apps/web/app/test-form/page.tsx (add conditional example)

## Verification Checklist

- [ ] useConditionalLogic hook created
- [ ] All 5 operators implemented (equals, notEquals, contains, greaterThan, lessThan)
- [ ] FormRenderer evaluates conditional logic
- [ ] Hidden fields return null (not rendered)
- [ ] Tests pass (5/5 passing)
- [ ] Manual test shows dynamic hide/show
- [ ] Build succeeds
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-081/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (5/5 tests passing)
  - conditional-hide-show.png (manual test with hazards yes/no)
- code/
  - use-conditional-logic.png (useConditionalLogic.ts)
  - form-renderer-conditional.png (FormRenderer.tsx with conditional check)

## Troubleshooting

**Problem:** Fields not hiding when condition changes

- **Cause:** formValues not updated (watch() not working)
- **Solution:** Verify watch() called at component level, not inside loop

**Problem:** Conditional logic evaluates incorrectly for numbers

- **Cause:** String comparison instead of number comparison
- **Solution:** Use Number() conversion for greaterThan/lessThan

**Problem:** Hidden field values persist in form submission

- **Cause:** React Hook Form retains values for hidden fields
- **Solution:** Expected behavior - validate server-side, or reset field when hidden

## Success Criteria

- [ ] useConditionalLogic hook evaluates all 5 operators correctly
- [ ] Fields hide/show based on other field values
- [ ] React Hook Form watch() provides real-time form values
- [ ] Conditional logic works for nested conditions
- [ ] Tests pass (5/5 passing)
- [ ] Manual test demonstrates dynamic behavior
- [ ] Build succeeds

## Time Estimate

**2 hours total:**

- Create conditional logic hook: 45 min
- Update FormRenderer: 30 min
- Update types: 10 min
- Create example templates: 20 min
- Write tests: 15 min

## Next Issue

**ISSUE-082:** Computed Fields (2h)

- Prerequisites: This issue complete (conditional logic working)
- Uses: FormRenderer watch() for real-time values
- Adds: Auto-calculate SUM, COUNT, AVERAGE, template variables
