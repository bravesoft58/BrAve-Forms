# ISSUE-152: Form Preview & Testing (3h)

**Priority:** P0
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 3
**Dependencies:** ISSUE-147, ISSUE-148, ISSUE-149, ISSUE-151
**Sprint:** Sprint 5

---

## Objective

Create an interactive form preview and testing interface allowing form builders to test their forms with realistic data, validation, and conditional logic before deployment.

## Tasks

- [ ] Create FormPreview component with all 15 field types
- [ ] Implement real-time preview updates from canvas changes
- [ ] Add test data generation for all field types
- [ ] Implement validation error display in preview
- [ ] Show/hide fields based on conditional logic
- [ ] Create preview mode toggle (desktop/mobile/tablet)
- [ ] Add form submission simulation
- [ ] Create test results display
- [ ] Add unit tests for preview logic

## Technical Details

**Libraries/Dependencies:**

- React Hook Form + Zod (form preview validation)
- Valtio (form builder state)
- Mantine components (all field components)
- expr-eval (calculated fields evaluation)

**Code Example:**

```typescript
'use client';

import { useForm, zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stack, Card, Button, Group, SegmentedControl, Text, Badge } from '@mantine/core';
import { IconDeviceMobile, IconDeviceTablet, IconDeviceDesktop } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore } from './store';
import { generateZodSchema, evaluateConditionalLogic } from './utils';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

// Form Preview Component
export function FormPreview() {
  const snap = useSnapshot(formBuilderStore);
  const [mode, setMode] = useState<PreviewMode>('desktop');
  const [showValidation, setShowValidation] = useState(false);

  // Generate Zod schema from fields
  const schema = z.object(
    snap.fields.reduce((acc, field) => {
      acc[field.id] = generateZodSchema(field);
      return acc;
    }, {} as Record<string, z.ZodTypeAny>)
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: snap.fields.reduce((acc, field) => {
      acc[field.id] = field.defaultValue || '';
      return acc;
    }, {} as Record<string, any>),
  });

  const formValues = form.watch();

  // Evaluate conditional logic for each field
  const visibleFields = snap.fields.filter(field => {
    if (!field.conditionalRules || field.conditionalRules.length === 0) {
      return true;
    }

    return field.conditionalRules.every(rule =>
      evaluateConditionalLogic(rule, formValues)
    );
  });

  const onSubmit = (data: any) => {
    console.log('Form submitted:', data);
    alert('Form submission successful!\n\n' + JSON.stringify(data, null, 2));
  };

  const generateTestData = () => {
    const testData = snap.fields.reduce((acc, field) => {
      acc[field.id] = generateFieldTestData(field);
      return acc;
    }, {} as Record<string, any>);

    form.reset(testData);
  };

  const modeWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>Form Preview</Text>

          <Group gap="xs">
            <Button variant="light" size="xs" onClick={generateTestData}>
              Fill Test Data
            </Button>

            <SegmentedControl
              size="xs"
              value={mode}
              onChange={(value) => setMode(value as PreviewMode)}
              data={[
                { label: <IconDeviceDesktop size={16} />, value: 'desktop' },
                { label: <IconDeviceTablet size={16} />, value: 'tablet' },
                { label: <IconDeviceMobile size={16} />, value: 'mobile' },
              ]}
            />
          </Group>
        </Group>

        <div style={{ width: modeWidths[mode], margin: '0 auto' }}>
          <Card withBorder padding="md">
            {visibleFields.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center">
                Add fields to see form preview
              </Text>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Stack gap="md">
                  {visibleFields.map(field => (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      form={form}
                      showValidation={showValidation}
                    />
                  ))}

                  <Group justify="flex-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowValidation(true)}
                    >
                      Validate
                    </Button>
                    <Button type="submit">
                      Submit Form
                    </Button>
                  </Group>
                </Stack>
              </form>
            )}
          </Card>
        </div>

        {/* Validation Summary */}
        {showValidation && Object.keys(form.formState.errors).length > 0 && (
          <Card withBorder padding="md" bg="red.0">
            <Stack gap="xs">
              <Text size="sm" fw={600} c="red">
                Validation Errors ({Object.keys(form.formState.errors).length})
              </Text>
              {Object.entries(form.formState.errors).map(([fieldId, error]) => {
                const field = snap.fields.find(f => f.id === fieldId);
                return (
                  <Text key={fieldId} size="xs" c="red">
                    • {field?.label}: {error.message}
                  </Text>
                );
              })}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}

// Field Renderer (renders appropriate component based on field type)
function FieldRenderer({ field, form, showValidation }: any) {
  const error = showValidation ? form.formState.errors[field.id]?.message : null;

  const commonProps = {
    label: field.label,
    description: field.description,
    placeholder: field.placeholder,
    required: field.required,
    error,
    ...form.register(field.id),
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return <TextInput {...commonProps} type={field.type} />;

    case 'textarea':
      return <Textarea {...commonProps} minRows={3} />;

    case 'number':
      return <NumberInput {...commonProps} min={field.validation?.min} max={field.validation?.max} />;

    case 'dropdown':
      return (
        <Select
          {...commonProps}
          data={field.options || []}
        />
      );

    case 'radio':
      return (
        <Radio.Group {...commonProps}>
          <Stack gap="xs">
            {field.options?.map(opt => (
              <Radio key={opt.value} value={opt.value} label={opt.label} />
            ))}
          </Stack>
        </Radio.Group>
      );

    case 'checkbox':
      return <Checkbox {...commonProps} />;

    case 'multiselect':
      return (
        <MultiSelect
          {...commonProps}
          data={field.options || []}
        />
      );

    case 'photo':
      return <FileInput {...commonProps} accept="image/*" multiple />;

    case 'signature':
      return (
        <div>
          <Text size="sm" fw={500}>{field.label}</Text>
          <Card withBorder padding="md" style={{ height: 150, border: '1px solid #ccc' }}>
            <Text size="xs" c="dimmed" ta="center">Signature Pad (Preview Only)</Text>
          </Card>
        </div>
      );

    case 'datetime':
      return <DateTimePicker {...commonProps} />;

    case 'gps':
      return (
        <TextInput
          {...commonProps}
          readOnly
          value="GPS: 37.7749, -122.4194 (Auto-captured)"
        />
      );

    case 'inspector':
      return (
        <TextInput
          {...commonProps}
          readOnly
          value="John Doe (Auto-filled from Clerk)"
        />
      );

    case 'calculated':
      return (
        <NumberInput
          {...commonProps}
          readOnly
          value={evaluateCalculation(field, form.getValues())}
        />
      );

    default:
      return <TextInput {...commonProps} />;
  }
}

// Generate test data for field
function generateFieldTestData(field: FormField): any {
  switch (field.type) {
    case 'text':
      return field.label + ' Test Value';
    case 'number':
      return Math.floor(Math.random() * 100);
    case 'email':
      return 'test@example.com';
    case 'phone':
      return '555-123-4567';
    case 'dropdown':
    case 'radio':
      return field.options?.[0]?.value || '';
    case 'checkbox':
      return true;
    case 'multiselect':
      return [field.options?.[0]?.value, field.options?.[1]?.value].filter(Boolean);
    case 'datetime':
      return new Date().toISOString();
    default:
      return '';
  }
}

// Evaluate calculated field
function evaluateCalculation(field: FormField, formValues: Record<string, any>): number {
  if (!field.calculation?.formula) return 0;

  const parser = new Parser();
  try {
    return parser.evaluate(field.calculation.formula, formValues);
  } catch (error) {
    return 0;
  }
}
```

## Acceptance Criteria

- [ ] Form preview displays all 15 field types correctly
- [ ] Real-time updates from canvas changes
- [ ] Test data generation working for all field types
- [ ] Validation errors display correctly
- [ ] Conditional logic shows/hides fields correctly
- [ ] Preview mode toggle (desktop/tablet/mobile) functional
- [ ] Form submission simulation working
- [ ] Calculated fields evaluate correctly
- [ ] Auto-filled fields (inspector, GPS) show placeholder values

## Testing Requirements

**Unit Tests:**

- Test field rendering for all 15 types
- Test conditional logic evaluation
- Test calculated fields evaluation
- Test validation error display

**Integration Tests:**

- Test form preview with Valtio store
- Test real-time updates from canvas
- Test form submission

**Manual Testing:**

- Preview forms with all field types
- Test conditional show/hide logic
- Fill test data and validate
- Test different preview modes (desktop/mobile/tablet)
- Submit form and verify data

## Evidence Requirements

- [ ] Screenshot: Form preview desktop mode
- [ ] Screenshot: Form preview mobile mode
- [ ] Screenshot: Validation errors displayed
- [ ] Screenshot: Conditional logic in action
- [ ] Video: Complete preview workflow
- [ ] Test Results: Preview tests (>80% coverage)

## Success Criteria

Form preview is complete when:

- All field types render correctly
- Conditional logic working
- Validation errors displayed
- Preview modes functional
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
