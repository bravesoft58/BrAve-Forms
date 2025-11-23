# ISSUE-096: Computed Fields

**Sprint:** Sprint 3 | **Phase:** 4 - Dynamic Form Renderer | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Status:** COMPLETE
**Completed:** 2025-11-17
**Evidence:** docs/sprints/sprint3/PHASE_4_COMPLETION_REPORT.md
**Dependencies:** ISSUE-095 (conditional logic working)

## What You'll Do

Implement computed fields that auto-calculate values using formulas (SUM, COUNT, AVERAGE) and template variables (currentDate, currentTime, userName) with real-time updates.

## Prerequisites

- [ ] ISSUE-081 complete (conditional logic working)
- [ ] Web app accessible at http://localhost:30102
- [ ] Code editor open to apps/web/components/Forms/FormRenderer
- [ ] React Hook Form watch() working

## Step-by-Step Instructions

### Step 1: Create Computed Fields Hook (1 hour)

Create `FormRenderer/useComputedFields.ts`:

```typescript
import { useMemo } from 'react';
import { FormField } from './types';

/**
 * Evaluate computed field formulas
 *
 * Supports:
 * - SUM(field1, field2, ...)
 * - COUNT(field1, field2, ...)
 * - AVERAGE(field1, field2, ...)
 * - Template variables: {{currentDate}}, {{currentTime}}, {{userName}}
 *
 * @param field - Field with computedValue formula
 * @param formValues - Current form values from React Hook Form watch()
 * @param userName - Current user name (from auth context)
 * @returns Computed value
 */
export function useComputedFields(
  field: FormField,
  formValues: Record<string, any>,
  userName?: string
): any {
  const computedValue = useMemo(() => {
    if (!field.computedValue) {
      return undefined;
    }

    const formula = field.computedValue.trim();

    // SUM formula: SUM(field1, field2, field3)
    if (formula.startsWith('SUM(')) {
      const fieldIds = extractFieldIds(formula);
      const values = fieldIds.map((id) => Number(formValues[id] || 0));
      return values.reduce((acc, val) => acc + val, 0);
    }

    // COUNT formula: COUNT(field1, field2, field3)
    if (formula.startsWith('COUNT(')) {
      const fieldIds = extractFieldIds(formula);
      const values = fieldIds.map((id) => formValues[id]);
      return values.filter((v) => v !== undefined && v !== null && v !== '').length;
    }

    // AVERAGE formula: AVERAGE(field1, field2, field3)
    if (formula.startsWith('AVERAGE(')) {
      const fieldIds = extractFieldIds(formula);
      const values = fieldIds.map((id) => Number(formValues[id] || 0));
      const sum = values.reduce((acc, val) => acc + val, 0);
      return values.length > 0 ? sum / values.length : 0;
    }

    // Template variables: {{currentDate}}, {{currentTime}}, {{userName}}
    if (formula.includes('{{')) {
      let result = formula;

      result = result.replace(/\{\{currentDate\}\}/g, formatCurrentDate());
      result = result.replace(/\{\{currentTime\}\}/g, formatCurrentTime());
      result = result.replace(/\{\{userName\}\}/g, userName || 'Unknown User');

      return result;
    }

    // Unknown formula - return as-is
    console.warn(`Unknown computed formula: ${formula}`);
    return formula;
  }, [field.computedValue, formValues, userName]);

  return computedValue;
}

/**
 * Extract field IDs from formula
 * Example: "SUM(field1, field2, field3)" => ["field1", "field2", "field3"]
 */
function extractFieldIds(formula: string): string[] {
  const match = formula.match(/\(([^)]+)\)/);
  if (!match) return [];

  return match[1].split(',').map((id) => id.trim());
}

/**
 * Format current date as YYYY-MM-DD
 */
function formatCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format current time as HH:MM
 */
function formatCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
```

### Step 2: Update FormRenderer to Use Computed Fields (20 min)

Edit `FormRenderer.tsx`:

```typescript
import { useComputedFields } from './useComputedFields';

export function FormRenderer({ template, onSubmit, initialValues, readOnly }: FormRendererProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  const formValues = watch();

  // TODO: Get userName from auth context
  const userName = 'John Doe'; // Placeholder for Sprint 3

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="form-renderer">
      <div className="form-fields">
        {template.fields.map((field) => {
          const error = errors[field.id] as FieldError;
          const { isVisible } = useConditionalLogic(field, formValues);

          if (!isVisible) return null;

          // Compute value for computed fields
          const computedValue = field.type === 'computed'
            ? useComputedFields(field, formValues, userName)
            : undefined;

          switch (field.type) {
            // ... other field types
            case 'computed':
              return (
                <ComputedField
                  key={field.id}
                  field={field}
                  error={error}
                  computedValue={computedValue}
                />
              );
            default:
              return <div key={field.id}>Unsupported field type: {field.type}</div>;
          }
        })}
      </div>
    </form>
  );
}
```

### Step 3: Update ComputedField Component (15 min)

Edit `Fields/ComputedField.tsx` (from ISSUE-080):

```typescript
import React, { useEffect } from 'react';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';
import { FieldError } from 'react-hook-form';

interface ComputedFieldProps {
  field: FormField;
  error?: FieldError;
  computedValue?: any;
  setValue?: (name: string, value: any) => void; // From React Hook Form
}

export function ComputedField({ field, error, computedValue, setValue }: ComputedFieldProps) {
  // Update form value when computed value changes
  useEffect(() => {
    if (setValue && computedValue !== undefined) {
      setValue(field.id, computedValue);
    }
  }, [computedValue, field.id, setValue]);

  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={false}
      error={error}
    >
      <input
        id={field.id}
        type="text"
        value={computedValue || ''}
        disabled={true}
        style={{
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '10px',
          width: '100%',
          fontFamily: 'monospace',
        }}
      />
      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
        Formula: {field.computedValue}
      </p>
    </FieldWrapper>
  );
}
```

### Step 4: Create Example Templates with Computed Fields (20 min)

Update `apps/web/app/test-form/page.tsx`:

```typescript
const computedTemplate: FormTemplate = {
  id: 'template_computed',
  title: 'Material Quantity Calculator',
  version: 1,
  fields: [
    {
      id: 'length',
      type: 'number',
      label: 'Length (ft)',
      placeholder: '0',
      required: true,
      defaultValue: 0,
    },
    {
      id: 'width',
      type: 'number',
      label: 'Width (ft)',
      placeholder: '0',
      required: true,
      defaultValue: 0,
    },
    {
      id: 'height',
      type: 'number',
      label: 'Height (ft)',
      placeholder: '0',
      required: true,
      defaultValue: 0,
    },
    {
      id: 'total_linear',
      type: 'computed',
      label: 'Total Linear Feet',
      computedValue: 'SUM(length, width, height)',
    },
    {
      id: 'total_area',
      type: 'computed',
      label: 'Total Square Feet (approx)',
      computedValue: 'AVERAGE(length, width)', // Simplified
    },
    {
      id: 'field_count',
      type: 'computed',
      label: 'Completed Fields',
      computedValue: 'COUNT(length, width, height)',
    },
    {
      id: 'inspection_date',
      type: 'computed',
      label: 'Inspection Date',
      computedValue: '{{currentDate}}',
    },
    {
      id: 'inspection_time',
      type: 'computed',
      label: 'Inspection Time',
      computedValue: '{{currentTime}}',
    },
    {
      id: 'inspector',
      type: 'computed',
      label: 'Inspector',
      computedValue: '{{userName}}',
    },
  ],
};
```

Test manually:

1. Navigate to http://localhost:30102/test-form
2. Enter Length: 10
3. Enter Width: 5
4. Enter Height: 8
5. Verify computed fields update:
   - Total Linear Feet: 23 (10 + 5 + 8)
   - Total Square Feet: 7.5 (average of 10 and 5)
   - Completed Fields: 3 (all filled)
   - Inspection Date: 2025-10-23
   - Inspection Time: 14:30 (current time)
   - Inspector: John Doe

**Screenshot:** Save computed fields to `evidence/ISSUE-082/test-results/computed-calculations.png`

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `__tests__/useComputedFields.test.ts`:

```typescript
import { renderHook } from '@testing-library/react';
import { useComputedFields } from '../useComputedFields';
import { FormField } from '../types';

describe('useComputedFields', () => {
  it('should calculate SUM formula correctly', () => {
    const field: FormField = {
      id: 'total',
      type: 'computed',
      label: 'Total',
      computedValue: 'SUM(field1, field2, field3)',
    };

    const formValues = {
      field1: 10,
      field2: 20,
      field3: 30,
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(60);
  });

  it('should calculate COUNT formula correctly', () => {
    const field: FormField = {
      id: 'count',
      type: 'computed',
      label: 'Count',
      computedValue: 'COUNT(field1, field2, field3, field4)',
    };

    const formValues = {
      field1: 'value1',
      field2: 'value2',
      field3: '', // Empty - not counted
      field4: null, // Null - not counted
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(2);
  });

  it('should calculate AVERAGE formula correctly', () => {
    const field: FormField = {
      id: 'average',
      type: 'computed',
      label: 'Average',
      computedValue: 'AVERAGE(field1, field2, field3)',
    };

    const formValues = {
      field1: 10,
      field2: 20,
      field3: 30,
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(20);
  });

  it('should replace {{currentDate}} template variable', () => {
    const field: FormField = {
      id: 'date',
      type: 'computed',
      label: 'Date',
      computedValue: '{{currentDate}}',
    };

    const { result } = renderHook(() => useComputedFields(field, {}));

    // Should match YYYY-MM-DD format
    expect(result.current).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should replace {{currentTime}} template variable', () => {
    const field: FormField = {
      id: 'time',
      type: 'computed',
      label: 'Time',
      computedValue: '{{currentTime}}',
    };

    const { result } = renderHook(() => useComputedFields(field, {}));

    // Should match HH:MM format
    expect(result.current).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should replace {{userName}} template variable', () => {
    const field: FormField = {
      id: 'user',
      type: 'computed',
      label: 'User',
      computedValue: 'Completed by {{userName}}',
    };

    const { result } = renderHook(() => useComputedFields(field, {}, 'John Doe'));

    expect(result.current).toBe('Completed by John Doe');
  });
});
```

Run tests (should FAIL - red phase):

```bash
pnpm test useComputedFields.test.ts
```

Expected: Tests fail (hook not implemented yet)

**Screenshot:** Save failing test to `evidence/ISSUE-082/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement useComputedFields.ts as shown in Step 1.

Run tests again:

```bash
pnpm test useComputedFields.test.ts
```

Expected: All tests pass (6/6 passing)

**Screenshot:** Save passing tests to `evidence/ISSUE-082/test-results/green-phase.png`

## Files to Create/Modify

**Create:**

- apps/web/components/Forms/FormRenderer/useComputedFields.ts
- apps/web/components/Forms/FormRenderer/**tests**/useComputedFields.test.ts

**Modify:**

- apps/web/components/Forms/FormRenderer/FormRenderer.tsx (add computed fields evaluation)
- apps/web/components/Forms/FormRenderer/Fields/ComputedField.tsx (update with setValue)
- apps/web/app/test-form/page.tsx (add computed example)

## Verification Checklist

- [ ] useComputedFields hook created
- [ ] SUM formula implemented
- [ ] COUNT formula implemented
- [ ] AVERAGE formula implemented
- [ ] Template variables implemented (currentDate, currentTime, userName)
- [ ] ComputedField updates form value
- [ ] Tests pass (6/6 passing)
- [ ] Manual test shows real-time calculations
- [ ] Build succeeds
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-082/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (6/6 tests passing)
  - computed-calculations.png (manual test with SUM, COUNT, AVERAGE)
  - template-variables.png (currentDate, currentTime, userName)
- code/
  - use-computed-fields.png (useComputedFields.ts)
  - computed-field-component.png (ComputedField.tsx with setValue)

## Troubleshooting

**Problem:** Computed values don't update when form values change

- **Cause:** useMemo dependencies not configured correctly
- **Solution:** Ensure formValues in useMemo dependency array

**Problem:** SUM returns NaN

- **Cause:** Non-numeric field values
- **Solution:** Use Number() conversion with fallback to 0

**Problem:** Template variables show literal {{currentDate}}

- **Cause:** Regex not matching
- **Solution:** Verify regex pattern and replace() call

## Success Criteria

- [ ] SUM formula calculates total correctly
- [ ] COUNT formula counts non-empty fields
- [ ] AVERAGE formula calculates average correctly
- [ ] currentDate template variable shows YYYY-MM-DD
- [ ] currentTime template variable shows HH:MM
- [ ] userName template variable shows user name
- [ ] Computed values update in real-time
- [ ] Tests pass (6/6 passing)
- [ ] Manual test demonstrates all formulas
- [ ] Build succeeds

## Time Estimate

**2 hours total:**

- Create computed fields hook: 1 hour
- Update FormRenderer: 20 min
- Update ComputedField component: 15 min
- Create example templates: 20 min
- Write tests: 5 min

## Next Issue

**ISSUE-083:** Form Validation (1h)

- Prerequisites: This issue complete (computed fields working)
- Uses: Zod schema generation from FormTemplate
- Adds: Required, min/max, pattern validation with error messages
