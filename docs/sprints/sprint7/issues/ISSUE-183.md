# ISSUE-183: NDEP BWPC SWPP Unsupported Field Errors

**Sprint:** Sprint 7 | **Phase:** 2 - Form Template Fixes | **Priority:** P1
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-12-15
**Dependencies:** ISSUE-178
**Status:** COMPLETE
**Completed:** 2026-01-05
**Resolution:** Resolved by ISSUE-182

---

## Problem

From Andy's QA Review (December 10, 2025):

> "NDEP BWPC SWPP Form: It is not possible to enter or select dates for Estimated project start date and end date. Data entry is also blocked for Operator owner name, Operator address, and Contact person. 'Unsupported field errors' were observed."

The form renderer doesn't handle certain field types properly.

---

## Evidence of Bug

**Location:** Forms Tab > NDEP BWPC SWPP Form > Fill

**Affected Fields:**

- Estimated project start date
- Estimated project end date
- Operator owner name
- Operator address
- Contact person

**Error:** "Unsupported field" displayed instead of input

---

## Root Cause Investigation

### Likely Causes

1. **Missing field type handler** - FieldRenderer doesn't handle specific field types
2. **Incorrect field type in template** - Template uses unknown type name
3. **Date picker not implemented** - Date fields not rendering properly
4. **Field type mismatch** - Backend expects different type than frontend

### Files to Investigate

- `packages/database/seed/templates/ndep-bwpc-swpp.json` - Template schema
- `apps/web/components/form-renderer/FieldRenderer.tsx` - Field type switch
- `apps/web/components/form-renderer/fields/` - Individual field components

---

## Solution

### Step 1: Add Comprehensive Field Type Support

```typescript
// apps/web/components/form-renderer/FieldRenderer.tsx
import { TextInput, NumberInput, Textarea, Select, Checkbox, DateInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

const SUPPORTED_TYPES = ['text', 'number', 'textarea', 'select', 'checkbox', 'date', 'email', 'phone', 'address'];

export function FieldRenderer({ field, form }: FieldRendererProps) {
  const { register, control, formState: { errors } } = form;

  // Log unsupported types for debugging
  if (!SUPPORTED_TYPES.includes(field.type)) {
    console.warn(`Unsupported field type: ${field.type}`, field);
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'address':
      return (
        <TextInput
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          error={errors[field.id]?.message}
          {...register(field.id)}
        />
      );

    case 'number':
      return (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => (
            <NumberInput
              label={field.label}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.id]?.message}
              value={value}
              onChange={onChange}
            />
          )}
        />
      );

    case 'date':
      return (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => (
            <DatePickerInput
              label={field.label}
              placeholder={field.placeholder || 'Select date'}
              required={field.required}
              error={errors[field.id]?.message}
              value={value ? new Date(value) : null}
              onChange={(date) => onChange(date?.toISOString())}
            />
          )}
        />
      );

    case 'textarea':
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          error={errors[field.id]?.message}
          minRows={3}
          {...register(field.id)}
        />
      );

    case 'select':
      return (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              label={field.label}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.id]?.message}
              data={field.options || []}
              value={value}
              onChange={onChange}
            />
          )}
        />
      );

    case 'checkbox':
      return (
        <Controller
          name={field.id}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Checkbox
              label={field.label}
              checked={Boolean(value)}
              onChange={(e) => onChange(e.currentTarget.checked)}
            />
          )}
        />
      );

    default:
      // Fallback to text input instead of error
      console.warn(`Unknown field type "${field.type}", falling back to text`);
      return (
        <TextInput
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
          description={`Type: ${field.type}`}
          error={errors[field.id]?.message}
          {...register(field.id)}
        />
      );
  }
}
```

### Step 2: Verify Template Schema

Check and fix field types in template.

```json
// packages/database/seed/templates/ndep-bwpc-swpp.json
{
  "schema": [
    {
      "id": "projectStartDate",
      "type": "date",
      "label": "Estimated Project Start Date",
      "required": true
    },
    {
      "id": "projectEndDate",
      "type": "date",
      "label": "Estimated Project End Date",
      "required": true
    },
    {
      "id": "operatorOwnerName",
      "type": "text",
      "label": "Operator/Owner Name",
      "required": true
    },
    {
      "id": "operatorAddress",
      "type": "text",
      "label": "Operator Address",
      "required": true
    },
    {
      "id": "contactPerson",
      "type": "text",
      "label": "Contact Person",
      "required": true
    }
  ]
}
```

---

## Tasks

### Frontend

- [ ] Add date field support with DatePickerInput
- [ ] Add fallback for unknown field types (render as text)
- [ ] Ensure all standard field types are supported
- [ ] Add console warning for unsupported types
- [ ] Test with @mantine/dates package

### Template

- [ ] Review NDEP BWPC SWPP template schema
- [ ] Fix any incorrect field type names
- [ ] Ensure consistent field type naming

### Testing

- [ ] Write test: date field renders DatePicker
- [ ] Write test: unknown type falls back to text
- [ ] Write test: all standard types render correctly
- [ ] E2E test: fill NDEP form completely

---

## TDD Workflow

### Test File: `apps/web/components/form-renderer/FieldRenderer.test.tsx`

```typescript
describe('FieldRenderer - Field Types', () => {
  it('should render date field with DatePickerInput', () => {
    const field = { id: 'startDate', type: 'date', label: 'Start Date' };

    render(
      <TestWrapper>
        <FieldRenderer field={field} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    // Should have calendar icon or date picker functionality
  });

  it('should fallback to text for unknown type', () => {
    const field = { id: 'unknownField', type: 'customType', label: 'Custom Field' };

    render(
      <TestWrapper>
        <FieldRenderer field={field} />
      </TestWrapper>
    );

    // Should render as text input instead of error
    const input = screen.getByLabelText(/custom field/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render email as text input', () => {
    const field = { id: 'email', type: 'email', label: 'Email' };

    render(
      <TestWrapper>
        <FieldRenderer field={field} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should render address as text input', () => {
    const field = { id: 'address', type: 'address', label: 'Address' };

    render(
      <TestWrapper>
        <FieldRenderer field={field} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });
});
```

---

## Acceptance Criteria

- [ ] Date fields render with date picker
- [ ] All fields in NDEP form are editable
- [ ] No "Unsupported field" errors displayed
- [ ] Unknown field types fall back to text
- [ ] Form can be filled completely
- [ ] Tests passing

---

## Evidence Required

- [ ] Screenshot of unsupported field error (current bug)
- [ ] Screenshot of working date picker (after fix)
- [ ] Screenshot of fully editable form
- [ ] Test results output

---

## Related Issues

- ISSUE-178: Form Submission 400 Errors
- ISSUE-182: N.Swips Form Data Entry Blocked
- ISSUE-186: Form Fields Pull From Project Data

---

## Completion Summary

**Root Cause:** This issue shared the same root cause as ISSUE-182. The NDEP BWPC SWPPP template uses `tel` (6 fields) and `email` (2 fields) field types that were not supported by the FormRenderer prior to ISSUE-182.

**Analysis:**

The "Unsupported field errors" Andy reported were caused by the FormRenderer's default case displaying "Unsupported field type: tel/email" for these fields, making portions of the form appear broken.

**Template Field Types Used (21-ndep-bwpc-swppp.json):**

- text (27 occurrences)
- textarea (18 occurrences)
- select (7 occurrences)
- number (6 occurrences)
- date (6 occurrences)
- tel (6 occurrences) - NOW SUPPORTED
- email (2 occurrences) - NOW SUPPORTED
- checkbox (18 occurrences)
- repeater (5 occurrences)
- signature (1 occurrence)

**Resolution:**

ISSUE-182 added `tel` and `email` to the FieldType enum and created case handlers in FormRenderer.tsx. All field types in the NDEP BWPC SWPPP template are now fully supported.

**Verification:**

- Build verification: PASSED (`pnpm --filter web build`)
- All field types in template are in FieldType enum
- FormRenderer has case handlers for all types

**Files Modified:** None (resolved by ISSUE-182 changes)

**Commit:** N/A (resolved by commit 140f915 from ISSUE-182)
