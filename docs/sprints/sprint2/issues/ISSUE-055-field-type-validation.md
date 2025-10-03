# ISSUE-055: Field Type Validation (8+ Types)

**Sprint:** Sprint 2 | **Phase:** 1 - Forms Engine Backend | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-02
**Dependencies:** ISSUE-052 (types defined)

## What You'll Do

Implement comprehensive Zod validators for 8 field types (text, number, date, dropdown, photo, signature, GPS, weather_data), add conditional logic support, create validation error messages, and test edge cases.

## Prerequisites

- [ ] ISSUE-052 completed (GraphQL types exist)
- [ ] Zod library installed

## Step-by-Step Instructions

### Step 1: Expand Field Type Validators (90 min)

Update `apps/backend/src/modules/forms/validation/field-definition.schema.ts`:

```typescript
// Text field validation
const textFieldSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean(),
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(), // Regex pattern
    })
    .optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
});

// Number field validation
const numberFieldSchema = z.object({
  id: z.string(),
  type: z.literal('number'),
  label: z.string().min(1),
  required: z.boolean(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
    })
    .optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
});

// Date field validation
const dateFieldSchema = z.object({
  id: z.string(),
  type: z.literal('date'),
  label: z.string().min(1),
  required: z.boolean(),
  validation: z
    .object({
      minDate: z.string().optional(), // ISO format
      maxDate: z.string().optional(),
    })
    .optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
});

// Dropdown field validation
const dropdownFieldSchema = z.object({
  id: z.string(),
  type: z.literal('dropdown'),
  label: z.string().min(1),
  required: z.boolean(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .min(1), // At least one option required
  conditionalLogic: conditionalLogicSchema.optional(),
});

// Photo field validation
const photoFieldSchema = z.object({
  id: z.string(),
  type: z.literal('photo'),
  label: z.string().min(1),
  required: z.boolean(),
  validation: z
    .object({
      maxSizeMB: z.number().max(10).optional(), // Max 10MB
      requireGPS: z.boolean().optional(),
    })
    .optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
});

// Signature field validation
const signatureFieldSchema = z.object({
  id: z.string(),
  type: z.literal('signature'),
  label: z.string().min(1),
  required: z.boolean(),
  conditionalLogic: conditionalLogicSchema.optional(),
});

// GPS field validation
const gpsFieldSchema = z.object({
  id: z.string(),
  type: z.literal('gps'),
  label: z.string().min(1),
  required: z.boolean(),
  validation: z
    .object({
      accuracy: z.number().optional(), // Meters
    })
    .optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
});

// Weather data field validation
const weatherDataFieldSchema = z.object({
  id: z.string(),
  type: z.literal('weather_data'),
  label: z.string().min(1),
  required: z.boolean(),
  validation: z
    .object({
      includeTemperature: z.boolean().optional(),
      includePrecipitation: z.boolean().optional(),
      includeWindSpeed: z.boolean().optional(),
    })
    .optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
});

// Discriminated union for all field types
export const fieldDefinitionSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  numberFieldSchema,
  dateFieldSchema,
  dropdownFieldSchema,
  photoFieldSchema,
  signatureFieldSchema,
  gpsFieldSchema,
  weatherDataFieldSchema,
]);
```

### Step 2: Create Validation Service (60 min)

Create `apps/backend/src/modules/forms/services/field-validation.service.ts`:

```typescript
@Injectable()
export class FieldValidationService {
  validateFields(fields: any[]): ValidationResult {
    const errors: string[] = [];

    fields.forEach((field, index) => {
      const result = fieldDefinitionSchema.safeParse(field);
      if (!result.success) {
        errors.push(`Field ${index} (${field.id}): ${result.error.message}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateConditionalLogic(fields: any[]): ValidationResult {
    const fieldIds = new Set(fields.map((f) => f.id));
    const errors: string[] = [];

    fields.forEach((field) => {
      if (field.conditionalLogic) {
        // Verify referenced field exists
        if (!fieldIds.has(field.conditionalLogic.field)) {
          errors.push(
            `Field ${field.id}: references non-existent field ${field.conditionalLogic.field}`
          );
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

### Step 3: Add Edge Case Tests (90 min)

Create `apps/backend/src/modules/forms/__tests__/field-validation.spec.ts`:

```typescript
describe('Field Type Validation', () => {
  describe('text field', () => {
    it('should validate text field with minLength/maxLength', () => {
      const field = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        validation: { minLength: 2, maxLength: 50 },
      };
      const result = fieldDefinitionSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it('should reject text field with negative minLength', () => {
      const field = {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        validation: { minLength: -1 },
      };
      const result = fieldDefinitionSchema.safeParse(field);
      expect(result.success).toBe(false);
    });
  });

  describe('dropdown field', () => {
    it('should require at least one option', () => {
      const field = {
        id: 'status',
        type: 'dropdown',
        label: 'Status',
        required: true,
        options: [],
      };
      const result = fieldDefinitionSchema.safeParse(field);
      expect(result.success).toBe(false);
    });
  });

  describe('photo field', () => {
    it('should limit maxSizeMB to 10MB', () => {
      const field = {
        id: 'photo',
        type: 'photo',
        label: 'Photo',
        required: true,
        validation: { maxSizeMB: 15 },
      };
      const result = fieldDefinitionSchema.safeParse(field);
      expect(result.success).toBe(false);
    });
  });

  describe('conditional logic', () => {
    it('should validate show/hide/require actions', () => {
      const field = {
        id: 'comments',
        type: 'text',
        label: 'Comments',
        required: false,
        conditionalLogic: {
          field: 'has_issue',
          operator: 'equals',
          value: true,
          action: 'require',
        },
      };
      const result = fieldDefinitionSchema.safeParse(field);
      expect(result.success).toBe(true);
    });
  });

  // 15+ test cases total
});
```

## TDD Workflow

**Phase 1:** Write tests first (all 8 field types + edge cases)
**Phase 2:** Implement validators to pass tests
**Phase 3:** Verify >80% coverage

## Files to Create

- Enhanced `field-definition.schema.ts` (8 field schemas)
- `field-validation.service.ts` (validation logic)
- `field-validation.spec.ts` (15+ tests)

## Verification Checklist

- [ ] 8 field type validators implemented
- [ ] Conditional logic validation working
- [ ] Edge case tests passing (15+ tests)
- [ ] > 80% test coverage for validation module

## Time Estimate: 4 hours

## Next Issue

**ISSUE-056:** Form Versioning System (2h)
