# ISSUE-093: Build FormRenderer Component

**Sprint:** Sprint 3 | **Phase:** 4 - Dynamic Form Renderer | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Status:** COMPLETE
**Completed:** 2025-11-17
**Evidence:** docs/sprints/sprint3/PHASE_4_COMPLETION_REPORT.md
**Dependencies:** Phase 0 complete (single-tenant ready)

## What You'll Do

Create the core FormRenderer component that accepts JSON schema (FormTemplate), renders form fields dynamically using React Hook Form, and handles form submission with validation.

## Prerequisites

- [ ] Phase 0 complete (ISSUE-076, ISSUE-077, ISSUE-092)
- [ ] Web app accessible at http://localhost:30102
- [ ] Code editor open to apps/web/components
- [ ] React Hook Form installed (verify: package.json)
- [ ] Zod installed (verify: package.json)

## Step-by-Step Instructions

### Step 1: Create FormRenderer Directory Structure (15 min)

```bash
cd apps/web/components
mkdir -p Forms/FormRenderer
cd Forms/FormRenderer

# Create files
touch FormRenderer.tsx
touch index.ts
touch types.ts
touch FormRenderer.test.tsx
```

**Directory structure:**

```
apps/web/components/Forms/FormRenderer/
├── FormRenderer.tsx         # Main component
├── index.ts                 # Barrel export
├── types.ts                 # TypeScript interfaces
├── FormRenderer.test.tsx    # Tests
└── Fields/                  # Field components (ISSUE-094)
```

### Step 2: Define TypeScript Interfaces (30 min)

Create `types.ts`:

```typescript
/**
 * Form Template Schema
 * JSON structure defining form layout and fields
 */
export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  version: number;
  fields: FormField[];
  metadata?: Record<string, any>;
}

/**
 * Individual Form Field Definition
 */
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  validation?: FieldValidation;
  conditional?: ConditionalLogic;
  computedValue?: string;
  options?: FieldOption[];
  metadata?: Record<string, any>;
}

/**
 * Field Types (15 total - ISSUE-094 implements all)
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkboxes'
  | 'photo'
  | 'signature'
  | 'gps'
  | 'repeater'
  | 'file'
  | 'computed';

/**
 * Field Validation Rules
 */
export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

/**
 * Conditional Display Logic (ISSUE-081)
 */
export interface ConditionalLogic {
  showIf?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
}

/**
 * Field Options (for select, radio, checkboxes)
 */
export interface FieldOption {
  value: string;
  label: string;
}

/**
 * Form Submission Data
 */
export interface FormSubmissionData {
  templateId: string;
  values: Record<string, any>;
  submittedAt: string;
  submittedBy: string;
}

/**
 * FormRenderer Props
 */
export interface FormRendererProps {
  template: FormTemplate;
  onSubmit: (data: FormSubmissionData) => void;
  initialValues?: Record<string, any>;
  readOnly?: boolean;
}
```

### Step 3: Create FormRenderer Component (1.5 hours)

Create `FormRenderer.tsx`:

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormRendererProps, FormSubmissionData } from './types';

/**
 * FormRenderer Component
 *
 * Renders dynamic forms from JSON schema
 * Uses React Hook Form for state management
 * Supports validation, conditional logic, computed fields
 */
export function FormRenderer({
  template,
  onSubmit,
  initialValues = {},
  readOnly = false,
}: FormRendererProps) {
  // Generate Zod schema from template (ISSUE-083)
  const validationSchema = generateValidationSchema(template);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  // Watch all form values for conditional logic
  const formValues = watch();

  // Handle form submission
  const onSubmitForm = (data: Record<string, any>) => {
    const submission: FormSubmissionData = {
      templateId: template.id,
      values: data,
      submittedAt: new Date().toISOString(),
      submittedBy: 'current-user-id', // TODO: Get from auth context
    };

    onSubmit(submission);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="form-renderer">
      {/* Form Header */}
      <div className="form-header">
        <h2>{template.title}</h2>
        {template.description && <p>{template.description}</p>}
      </div>

      {/* Form Fields */}
      <div className="form-fields">
        {template.fields.map((field) => (
          <div key={field.id} className="form-field">
            {/* Basic text field for now - ISSUE-094 adds all 15 types */}
            {field.type === 'text' && (
              <div>
                <label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                <input
                  id={field.id}
                  type="text"
                  placeholder={field.placeholder}
                  {...register(field.id)}
                  disabled={readOnly}
                />
                {errors[field.id] && (
                  <span className="error">{errors[field.id]?.message}</span>
                )}
              </div>
            )}

            {/* Other field types handled in ISSUE-094 */}
            {field.type !== 'text' && (
              <div>
                <p>Field type {field.type} not yet implemented (ISSUE-094)</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form Actions */}
      {!readOnly && (
        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
    </form>
  );
}

/**
 * Generate Zod validation schema from FormTemplate
 * ISSUE-083 enhances this with full validation rules
 */
function generateValidationSchema(template: FormTemplate) {
  const shape: Record<string, z.ZodTypeAny> = {};

  template.fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny = z.any();

    // Basic validation for text fields
    if (field.type === 'text') {
      fieldSchema = z.string();

      if (field.required) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      }

      if (field.validation?.minLength) {
        fieldSchema = (fieldSchema as z.ZodString).min(
          field.validation.minLength,
          `Minimum ${field.validation.minLength} characters`
        );
      }

      if (field.validation?.maxLength) {
        fieldSchema = (fieldSchema as z.ZodString).max(
          field.validation.maxLength,
          `Maximum ${field.validation.maxLength} characters`
        );
      }
    }

    // Other field types handled in ISSUE-083
    shape[field.id] = fieldSchema;
  });

  return z.object(shape);
}
```

### Step 4: Create Barrel Export (5 min)

Create `index.ts`:

```typescript
export { FormRenderer } from './FormRenderer';
export type {
  FormRendererProps,
  FormTemplate,
  FormField,
  FieldType,
  FormSubmissionData,
} from './types';
```

### Step 5: Add Basic Styling (20 min)

Create `FormRenderer.module.css`:

```css
.form-renderer {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.form-header {
  margin-bottom: 24px;
}

.form-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-header p {
  color: #666;
  font-size: 14px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-field .required {
  color: red;
  margin-left: 4px;
}

.form-field input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-field .error {
  color: red;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

.form-actions button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.form-actions button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

Update FormRenderer.tsx to import styles:

```typescript
import styles from './FormRenderer.module.css';

// Update className to use CSS modules
<form className={styles['form-renderer']}>
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `FormRenderer.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormRenderer } from './FormRenderer';
import { FormTemplate } from './types';

describe('FormRenderer', () => {
  const mockTemplate: FormTemplate = {
    id: 'template_1',
    title: 'Test Form',
    description: 'A test form',
    version: 1,
    fields: [
      {
        id: 'field_name',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter your name',
        required: true,
      },
      {
        id: 'field_email',
        type: 'text',
        label: 'Email',
        placeholder: 'Enter your email',
        required: false,
      },
    ],
  };

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form title and description', () => {
    render(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('A test form')).toBeInTheDocument();
  });

  it('should render all text fields', () => {
    render(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('should mark required fields with asterisk', () => {
    render(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    const nameLabel = screen.getByText(/Name/i);
    expect(nameLabel.parentElement?.textContent).toContain('*');
  });

  it('should submit form with valid data', async () => {
    render(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    // Wait for submission
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'template_1',
          values: expect.objectContaining({
            field_name: 'John Doe',
          }),
        })
      );
    });
  });

  it('should show validation error for required field', async () => {
    render(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    // Submit without filling required field
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should render in read-only mode', () => {
    render(
      <FormRenderer
        template={mockTemplate}
        onSubmit={mockOnSubmit}
        readOnly={true}
      />
    );

    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test FormRenderer.test.tsx
```

Expected: Tests fail (component not fully implemented yet)

**Screenshot:** Save failing test output to `evidence/ISSUE-079/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement FormRenderer.tsx as shown in Step 3.

Run tests again:

```bash
pnpm test FormRenderer.test.tsx
```

Expected: All tests pass (6/6 passing)

**Screenshot:** Save passing test output to `evidence/ISSUE-079/test-results/green-phase.png`

### Step 6: Manual Testing with Example Template (30 min)

Create test page `apps/web/app/test-form/page.tsx`:

```typescript
'use client';

import { FormRenderer } from '@/components/Forms/FormRenderer';
import { FormTemplate } from '@/components/Forms/FormRenderer/types';

const testTemplate: FormTemplate = {
  id: 'template_test',
  title: 'Daily Safety Inspection',
  description: 'Record daily safety observations',
  version: 1,
  fields: [
    {
      id: 'inspector_name',
      type: 'text',
      label: 'Inspector Name',
      placeholder: 'Enter your name',
      required: true,
    },
    {
      id: 'inspection_date',
      type: 'text', // Will be 'date' in ISSUE-094
      label: 'Inspection Date',
      placeholder: 'YYYY-MM-DD',
      required: true,
    },
    {
      id: 'site_conditions',
      type: 'text', // Will be 'textarea' in ISSUE-094
      label: 'Site Conditions',
      placeholder: 'Describe site conditions',
      required: false,
    },
  ],
};

export default function TestFormPage() {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    alert('Form submitted successfully!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <FormRenderer template={testTemplate} onSubmit={handleSubmit} />
    </div>
  );
}
```

Test manually:

1. Navigate to http://localhost:30102/test-form
2. Fill in Inspector Name (required)
3. Leave Inspection Date empty
4. Click Submit - should show validation error
5. Fill in Inspection Date
6. Click Submit - should show success alert

**Screenshot:** Save form with validation error to `evidence/ISSUE-079/test-results/manual-validation.png`

## Files to Create

**Create:**

- apps/web/components/Forms/FormRenderer/FormRenderer.tsx
- apps/web/components/Forms/FormRenderer/index.ts
- apps/web/components/Forms/FormRenderer/types.ts
- apps/web/components/Forms/FormRenderer/FormRenderer.module.css
- apps/web/components/Forms/FormRenderer/FormRenderer.test.tsx
- apps/web/app/test-form/page.tsx (for manual testing)

## Verification Checklist

- [ ] FormRenderer component created
- [ ] TypeScript interfaces defined
- [ ] React Hook Form integration working
- [ ] Zod validation working
- [ ] Tests pass (6/6 passing)
- [ ] Manual test page works
- [ ] Required field validation working
- [ ] Form submission calls onSubmit callback
- [ ] Read-only mode disables inputs
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-079/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (6/6 tests passing)
  - manual-validation.png (form showing validation error)
  - manual-success.png (form submission success)
- code/
  - form-renderer-component.png (FormRenderer.tsx code)
  - types-interface.png (types.ts code)

## Troubleshooting

**Problem:** Tests fail with "Cannot find module 'react-hook-form'"

- **Cause:** Package not installed
- **Solution:** `cd apps/web && pnpm add react-hook-form @hookform/resolvers zod`

**Problem:** Validation not triggering

- **Cause:** Zod resolver not configured
- **Solution:** Verify `resolver: zodResolver(validationSchema)` in useForm options

**Problem:** Form submission not calling onSubmit

- **Cause:** Validation errors preventing submission
- **Solution:** Check console for validation errors, fix field values

## Success Criteria

- [ ] FormRenderer component renders text fields
- [ ] React Hook Form integration complete
- [ ] Zod validation working for required fields
- [ ] Form submission creates FormSubmissionData object
- [ ] Read-only mode disables inputs and hides submit button
- [ ] Tests pass (6/6 passing)
- [ ] Manual test page works
- [ ] Build succeeds

## Time Estimate

**4 hours total:**

- Create directory structure: 15 min
- Define TypeScript interfaces: 30 min
- Create FormRenderer component: 1.5 hours
- Create barrel export: 5 min
- Add basic styling: 20 min
- Write tests (TDD red phase): 30 min
- Manual testing: 30 min

## Next Issue

**ISSUE-094:** Implement 15 Field Types (5h)

- Prerequisites: This issue complete (FormRenderer exists)
- Uses: FormRenderer component as foundation
- Adds: 15 field type components (text, number, date, photo, signature, etc.)
