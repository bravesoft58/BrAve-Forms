# ISSUE-083: Form Validation

**Sprint:** Sprint 3 | **Phase:** 4 - Dynamic Form Renderer | **Priority:** P0
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-082 (computed fields working)

## What You'll Do

Enhance Zod validation schema generation to support all field types with required, min/max, minLength/maxLength, and pattern validation rules from FormTemplate.

## Prerequisites

- [ ] ISSUE-082 complete (computed fields working)
- [ ] Web app accessible at http://localhost:30102
- [ ] Code editor open to apps/web/components/Forms/FormRenderer
- [ ] Zod installed

## Step-by-Step Instructions

### Step 1: Enhance Validation Schema Generation (40 min)

Edit `FormRenderer.tsx` - Update `generateValidationSchema` function:

```typescript
import { z } from 'zod';
import { FormTemplate, FormField } from './types';

/**
 * Generate Zod validation schema from FormTemplate
 *
 * Supports:
 * - Required fields
 * - String validation (minLength, maxLength, pattern)
 * - Number validation (min, max)
 * - Email validation
 * - Custom error messages
 */
function generateValidationSchema(template: FormTemplate) {
  const shape: Record<string, z.ZodTypeAny> = {};

  template.fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = generateStringSchema(field);
        break;

      case 'number':
        fieldSchema = generateNumberSchema(field);
        break;

      case 'date':
        fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        }
        break;

      case 'time':
        fieldSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)');
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        }
        break;

      case 'select':
      case 'radio':
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        }
        break;

      case 'checkbox':
        fieldSchema = z.boolean().optional();
        if (field.required) {
          fieldSchema = z.boolean().refine((val) => val === true, {
            message: `${field.label} must be checked`,
          });
        }
        break;

      case 'checkboxes':
        fieldSchema = z.array(z.string()).optional();
        if (field.required) {
          fieldSchema = z.array(z.string()).min(1, `At least one ${field.label} is required`);
        }
        break;

      case 'photo':
      case 'file':
        fieldSchema = z.string().url('Invalid file URL').optional();
        if (field.required) {
          fieldSchema = z.string().url('Invalid file URL').min(1, `${field.label} is required`);
        }
        break;

      case 'signature':
        fieldSchema = z.string().optional();
        if (field.required) {
          fieldSchema = z.string().min(1, `${field.label} is required`);
        }
        break;

      case 'gps':
        fieldSchema = z
          .string()
          .regex(/^-?\d+\.\d+,\s*-?\d+\.\d+$/, 'Invalid GPS format (lat, lng)')
          .optional();
        if (field.required) {
          fieldSchema = z.string().min(1, `${field.label} is required`);
        }
        break;

      case 'computed':
        // Computed fields don't need validation (auto-generated)
        fieldSchema = z.any().optional();
        break;

      case 'repeater':
        // Repeater validation handled in Sprint 4
        fieldSchema = z.any().optional();
        break;

      default:
        fieldSchema = z.any().optional();
    }

    shape[field.id] = fieldSchema;
  });

  return z.object(shape);
}

/**
 * Generate string field validation schema
 */
function generateStringSchema(field: FormField): z.ZodString {
  let schema = z.string();

  // Required validation
  if (field.required) {
    schema = schema.min(1, `${field.label} is required`);
  } else {
    schema = schema.optional() as any;
  }

  // Min length validation
  if (field.validation?.minLength) {
    schema = schema.min(
      field.validation.minLength,
      field.validation.customMessage || `Minimum ${field.validation.minLength} characters required`
    );
  }

  // Max length validation
  if (field.validation?.maxLength) {
    schema = schema.max(
      field.validation.maxLength,
      field.validation.customMessage || `Maximum ${field.validation.maxLength} characters allowed`
    );
  }

  // Pattern validation (regex)
  if (field.validation?.pattern) {
    schema = schema.regex(
      new RegExp(field.validation.pattern),
      field.validation.customMessage || 'Invalid format'
    );
  }

  return schema;
}

/**
 * Generate number field validation schema
 */
function generateNumberSchema(field: FormField): z.ZodNumber {
  let schema = z.number({
    invalid_type_error: `${field.label} must be a number`,
  });

  // Required validation
  if (field.required) {
    // Number fields can't use .min(1) for required - use refine
    schema = schema.refine((val) => val !== undefined && val !== null, {
      message: `${field.label} is required`,
    });
  } else {
    schema = schema.optional() as any;
  }

  // Min value validation
  if (field.validation?.min !== undefined) {
    schema = schema.min(
      field.validation.min,
      field.validation.customMessage || `Minimum value is ${field.validation.min}`
    );
  }

  // Max value validation
  if (field.validation?.max !== undefined) {
    schema = schema.max(
      field.validation.max,
      field.validation.customMessage || `Maximum value is ${field.validation.max}`
    );
  }

  return schema;
}
```

### Step 2: Update FieldValidation Interface (5 min)

Verify `types.ts` has correct validation interface:

```typescript
/**
 * Field Validation Rules
 */
export interface FieldValidation {
  min?: number; // Minimum value (number fields)
  max?: number; // Maximum value (number fields)
  minLength?: number; // Minimum length (string fields)
  maxLength?: number; // Maximum length (string fields)
  pattern?: string; // Regex pattern (string fields)
  customMessage?: string; // Custom error message
}
```

### Step 3: Create Example Template with Validation (10 min)

Update `apps/web/app/test-form/page.tsx`:

```typescript
const validationTemplate: FormTemplate = {
  id: 'template_validation',
  title: 'Form Validation Example',
  version: 1,
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true,
      validation: {
        minLength: 3,
        maxLength: 50,
        customMessage: 'Name must be between 3 and 50 characters',
      },
    },
    {
      id: 'email',
      type: 'text',
      label: 'Email Address',
      placeholder: 'user@example.com',
      required: true,
      validation: {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        customMessage: 'Invalid email address',
      },
    },
    {
      id: 'age',
      type: 'number',
      label: 'Age',
      placeholder: '18',
      required: true,
      validation: {
        min: 18,
        max: 100,
        customMessage: 'Age must be between 18 and 100',
      },
    },
    {
      id: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Enter description',
      required: false,
      validation: {
        maxLength: 500,
        customMessage: 'Description cannot exceed 500 characters',
      },
    },
    {
      id: 'agree_terms',
      type: 'checkbox',
      label: 'I agree to the terms and conditions',
      required: true,
    },
  ],
};
```

Test manually:

1. Navigate to http://localhost:30102/test-form
2. Submit empty form - see required errors
3. Enter "AB" in name - see minLength error
4. Enter "invalid-email" in email - see pattern error
5. Enter "17" in age - see min value error
6. Fill all fields correctly - submit success

**Screenshot:** Save validation errors to `evidence/ISSUE-083/test-results/validation-errors.png`

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `__tests__/validation.test.ts`:

```typescript
import { z } from 'zod';
import { FormTemplate } from '../types';

// Import generateValidationSchema (export it from FormRenderer.tsx)
import { generateValidationSchema } from '../FormRenderer';

describe('Form Validation', () => {
  it('should validate required text field', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid data
    expect(() => schema.parse({ name: 'John Doe' })).not.toThrow();

    // Invalid - empty string
    expect(() => schema.parse({ name: '' })).toThrow('Name is required');
  });

  it('should validate minLength for text field', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          validation: {
            minLength: 3,
          },
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ name: 'John' })).not.toThrow();

    // Invalid - too short
    expect(() => schema.parse({ name: 'Jo' })).toThrow('Minimum 3 characters');
  });

  it('should validate number field min/max', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'age',
          type: 'number',
          label: 'Age',
          required: true,
          validation: {
            min: 18,
            max: 100,
          },
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ age: 25 })).not.toThrow();

    // Invalid - too low
    expect(() => schema.parse({ age: 17 })).toThrow('Minimum value is 18');

    // Invalid - too high
    expect(() => schema.parse({ age: 101 })).toThrow('Maximum value is 100');
  });

  it('should validate email pattern', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'email',
          type: 'text',
          label: 'Email',
          required: true,
          validation: {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            customMessage: 'Invalid email',
          },
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ email: 'user@example.com' })).not.toThrow();

    // Invalid
    expect(() => schema.parse({ email: 'invalid-email' })).toThrow('Invalid email');
  });

  it('should validate required checkbox', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'agree',
          type: 'checkbox',
          label: 'I agree',
          required: true,
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ agree: true })).not.toThrow();

    // Invalid - false
    expect(() => schema.parse({ agree: false })).toThrow('I agree must be checked');
  });
});
```

Run tests (should FAIL - red phase):

```bash
pnpm test validation.test.ts
```

Expected: Tests fail (validation not fully implemented yet)

**Screenshot:** Save failing test to `evidence/ISSUE-083/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement validation schema as shown in Step 1.

Run tests again:

```bash
pnpm test validation.test.ts
```

Expected: All tests pass (5/5 passing)

**Screenshot:** Save passing tests to `evidence/ISSUE-083/test-results/green-phase.png`

## Files to Modify

**Modify:**

- apps/web/components/Forms/FormRenderer/FormRenderer.tsx (enhance generateValidationSchema)
- apps/web/components/Forms/FormRenderer/types.ts (verify FieldValidation interface)
- apps/web/app/test-form/page.tsx (add validation example)

**Create:**

- apps/web/components/Forms/FormRenderer/**tests**/validation.test.ts

## Verification Checklist

- [ ] Required validation works for all field types
- [ ] String validation (minLength, maxLength, pattern) works
- [ ] Number validation (min, max) works
- [ ] Email pattern validation works
- [ ] Checkbox required validation works
- [ ] Custom error messages display correctly
- [ ] Tests pass (5/5 passing)
- [ ] Manual test shows all validation errors
- [ ] Build succeeds
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-083/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (5/5 tests passing)
  - validation-errors.png (manual test showing required, minLength, pattern errors)
  - validation-success.png (form submits with valid data)
- code/
  - generate-validation-schema.png (generateValidationSchema function)
  - string-schema.png (generateStringSchema function)
  - number-schema.png (generateNumberSchema function)

## Troubleshooting

**Problem:** Validation errors not showing in UI

- **Cause:** FieldError not passed to field components
- **Solution:** Verify errors[field.id] extracted and passed as error prop

**Problem:** Number field required validation not working

- **Cause:** Using .min(1) instead of .refine()
- **Solution:** Use .refine((val) => val !== undefined) for number required

**Problem:** Pattern validation not matching

- **Cause:** Regex string needs double escaping
- **Solution:** Use double backslashes: "\\." instead of "."

## Success Criteria

- [ ] All field types have appropriate validation schemas
- [ ] Required validation prevents form submission
- [ ] String validation enforces minLength, maxLength, pattern
- [ ] Number validation enforces min, max
- [ ] Custom error messages display correctly
- [ ] Tests pass (5/5 passing)
- [ ] Manual test demonstrates all validation types
- [ ] Build succeeds

## Time Estimate

**1 hour total:**

- Enhance validation schema: 40 min
- Update types: 5 min
- Create example template: 10 min
- Write tests: 5 min

## Next Issue

**ISSUE-084:** Auto-Save Draft Functionality (1h)

- Prerequisites: This issue complete (validation working)
- Uses: FormRenderer watch() for form values
- Adds: Save draft to IndexedDB every 30s, load on form open
