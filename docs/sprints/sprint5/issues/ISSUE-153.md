# ISSUE-153: Field Properties Panel (5h)

**Priority:** P0
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 5
**Dependencies:** ISSUE-158
**Sprint:** Sprint 5

---

## Objective

Create a comprehensive field properties panel allowing form builders to configure field settings, validation rules, options, and advanced properties for each field type.

## Tasks

- [ ] Create FieldPropertiesPanel component
- [ ] Create property editors for common properties (label, description, required, placeholder)
- [ ] Create type-specific property editors (dropdown options, number min/max, file types)
- [ ] Create validation rule editors (required, min/max length, pattern, custom)
- [ ] Implement conditional property visibility based on field type
- [ ] Add real-time property updates with Valtio
- [ ] Create property reset to defaults button
- [ ] Add property validation and error handling
- [ ] Add unit tests for properties panel

## Technical Details

**Libraries/Dependencies:**

- React Hook Form + Zod (property form validation)
- Valtio (form builder state)
- Mantine Form components (TextInput, NumberInput, Switch, MultiSelect)
- @tabler/icons-react (property icons)

**Code Example:**

```typescript
'use client';

import { useEffect } from 'react';
import { useForm, zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  Select,
  MultiSelect,
  Button,
  Accordion,
  Group,
  Text,
  Divider,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconTrash, IconRefresh } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, updateField } from './store';
import type { FormField } from './types';

// Property schema based on field type
const basePropertySchema = z.object({
  label: z.string().min(1, 'Label required'),
  description: z.string().optional(),
  required: z.boolean(),
  placeholder: z.string().optional(),
});

const textPropertySchema = basePropertySchema.extend({
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  pattern: z.string().optional(),
  defaultValue: z.string().optional(),
});

const numberPropertySchema = basePropertySchema.extend({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().min(0).optional(),
  defaultValue: z.number().optional(),
});

const selectionPropertySchema = basePropertySchema.extend({
  options: z.array(z.object({
    label: z.string().min(1, 'Option label required'),
    value: z.string().min(1, 'Option value required'),
  })).min(1, 'At least one option required'),
  defaultValue: z.string().optional(),
});

// Field Properties Panel
export function FieldPropertiesPanel() {
  const snap = useSnapshot(formBuilderStore);
  const selectedField = snap.fields.find(f => f.id === snap.selectedFieldId);

  if (!selectedField) {
    return (
      <Card withBorder padding="xl" ta="center">
        <Stack align="center" gap="xs">
          <IconSettings size={48} color="gray" />
          <Text size="sm" c="dimmed">Select a field to edit properties</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>Field Properties</Text>
            <Text size="xs" c="dimmed">{selectedField.type} field</Text>
          </div>
          <ActionIcon
            variant="subtle"
            onClick={() => resetFieldProperties(selectedField.id)}
            aria-label="Reset to defaults"
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>

        <Divider />

        <Accordion variant="separated" defaultValue={['basic', 'validation']}>
          <Accordion.Item value="basic">
            <Accordion.Control>Basic Properties</Accordion.Control>
            <Accordion.Panel>
              <BasicPropertiesEditor field={selectedField} />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="validation">
            <Accordion.Control>Validation Rules</Accordion.Control>
            <Accordion.Panel>
              <ValidationRulesEditor field={selectedField} />
            </Accordion.Panel>
          </Accordion.Item>

          {['dropdown', 'radio', 'checkbox', 'multiselect'].includes(selectedField.type) && (
            <Accordion.Item value="options">
              <Accordion.Control>Options</Accordion.Control>
              <Accordion.Panel>
                <OptionsEditor field={selectedField} />
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {selectedField.type === 'calculated' && (
            <Accordion.Item value="calculation">
              <Accordion.Control>Calculation Formula</Accordion.Control>
              <Accordion.Panel>
                <CalculationEditor field={selectedField} />
              </Accordion.Panel>
            </Accordion.Item>
          )}

          <Accordion.Item value="advanced">
            <Accordion.Control>Advanced Settings</Accordion.Control>
            <Accordion.Panel>
              <AdvancedPropertiesEditor field={selectedField} />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Card>
  );
}

// Basic Properties Editor
function BasicPropertiesEditor({ field }: { field: FormField }) {
  const form = useForm({
    resolver: zodResolver(basePropertySchema),
    defaultValues: {
      label: field.label,
      description: field.description || '',
      required: field.required,
      placeholder: field.placeholder || '',
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      updateField(field.id, values as Partial<FormField>);
    });
    return () => subscription.unsubscribe();
  }, [field.id, form]);

  return (
    <Stack gap="sm">
      <TextInput
        label="Field Label"
        placeholder="e.g., Inspector Name"
        {...form.register('label')}
        error={form.formState.errors.label?.message}
      />

      <Textarea
        label="Description"
        placeholder="Help text for field workers"
        minRows={2}
        {...form.register('description')}
      />

      <TextInput
        label="Placeholder"
        placeholder="e.g., Enter your name"
        {...form.register('placeholder')}
      />

      <Switch
        label="Required field"
        description="Field workers must fill this field"
        {...form.register('required')}
      />
    </Stack>
  );
}

// Validation Rules Editor
function ValidationRulesEditor({ field }: { field: FormField }) {
  const form = useForm({
    defaultValues: {
      minLength: field.validation?.minLength,
      maxLength: field.validation?.maxLength,
      min: field.validation?.min,
      max: field.validation?.max,
      pattern: field.validation?.pattern,
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      updateField(field.id, {
        validation: { ...field.validation, ...values },
      });
    });
    return () => subscription.unsubscribe();
  }, [field.id, form]);

  return (
    <Stack gap="sm">
      {['text', 'textarea'].includes(field.type) && (
        <>
          <NumberInput
            label="Minimum Length"
            placeholder="No minimum"
            min={0}
            {...form.register('minLength')}
          />
          <NumberInput
            label="Maximum Length"
            placeholder="No maximum"
            min={1}
            {...form.register('maxLength')}
          />
          <TextInput
            label="Pattern (Regex)"
            placeholder="e.g., ^[A-Z]{3}-[0-9]{4}$"
            description="Advanced: Regular expression for validation"
            {...form.register('pattern')}
          />
        </>
      )}

      {field.type === 'number' && (
        <>
          <NumberInput
            label="Minimum Value"
            placeholder="No minimum"
            {...form.register('min')}
          />
          <NumberInput
            label="Maximum Value"
            placeholder="No maximum"
            {...form.register('max')}
          />
          <NumberInput
            label="Step"
            placeholder="1"
            min={0}
            step={0.1}
            {...form.register('step')}
          />
        </>
      )}

      {field.type === 'photo' && (
        <>
          <NumberInput
            label="Max File Size (MB)"
            placeholder="10"
            min={1}
            max={100}
            {...form.register('maxFileSize')}
          />
          <NumberInput
            label="Max Photos"
            placeholder="5"
            min={1}
            max={50}
            {...form.register('maxCount')}
          />
        </>
      )}
    </Stack>
  );
}

// Options Editor (for dropdown, radio, checkbox, multiselect)
function OptionsEditor({ field }: { field: FormField }) {
  const [options, setOptions] = useState(field.options || []);

  const addOption = () => {
    const newOption = { label: '', value: `option-${Date.now()}` };
    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);
    updateField(field.id, { options: updatedOptions });
  };

  const updateOption = (index: number, updates: Partial<typeof options[0]>) => {
    const updatedOptions = options.map((opt, i) =>
      i === index ? { ...opt, ...updates } : opt
    );
    setOptions(updatedOptions);
    updateField(field.id, { options: updatedOptions });
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    updateField(field.id, { options: updatedOptions });
  };

  return (
    <Stack gap="sm">
      {options.map((option, index) => (
        <Group key={index} gap="xs" wrap="nowrap">
          <TextInput
            placeholder="Option label"
            value={option.label}
            onChange={(e) => updateOption(index, { label: e.target.value })}
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Value"
            value={option.value}
            onChange={(e) => updateOption(index, { value: e.target.value })}
            style={{ flex: 1 }}
          />
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => removeOption(index)}
            aria-label="Remove option"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}

      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={addOption}
      >
        Add Option
      </Button>
    </Stack>
  );
}

// Calculation Editor (for calculated fields)
function CalculationEditor({ field }: { field: FormField }) {
  const snap = useSnapshot(formBuilderStore);

  const availableFields = snap.fields
    .filter(f => f.type === 'number' && f.id !== field.id)
    .map(f => ({ value: f.id, label: f.label }));

  return (
    <Stack gap="sm">
      <Textarea
        label="Formula"
        placeholder="e.g., SUM(field1, field2)"
        description="Use SUM, AVG, MIN, MAX, ROUND functions"
        value={field.calculation?.formula || ''}
        onChange={(e) => updateField(field.id, {
          calculation: { formula: e.target.value },
        })}
        minRows={3}
      />

      <MultiSelect
        label="Referenced Fields"
        placeholder="Select fields used in formula"
        data={availableFields}
        value={field.calculation?.referencedFields || []}
        onChange={(values) => updateField(field.id, {
          calculation: { ...field.calculation, referencedFields: values },
        })}
      />
    </Stack>
  );
}

// Advanced Properties Editor
function AdvancedPropertiesEditor({ field }: { field: FormField }) {
  return (
    <Stack gap="sm">
      <Switch
        label="Read-only"
        description="Field cannot be edited by field workers"
        checked={field.readOnly || false}
        onChange={(e) => updateField(field.id, { readOnly: e.currentTarget.checked })}
      />

      <Switch
        label="Hidden"
        description="Field is hidden but value is submitted"
        checked={field.hidden || false}
        onChange={(e) => updateField(field.id, { hidden: e.currentTarget.checked })}
      />

      <TextInput
        label="CSS Class"
        placeholder="custom-field-class"
        description="Custom styling class name"
        value={field.className || ''}
        onChange={(e) => updateField(field.id, { className: e.target.value })}
      />
    </Stack>
  );
}

// Reset field properties to defaults
function resetFieldProperties(fieldId: string) {
  if (confirm('Reset field to default properties?')) {
    updateField(fieldId, {
      label: 'New Field',
      description: '',
      required: false,
      placeholder: '',
      validation: {},
      options: [],
    });
  }
}
```

## Acceptance Criteria

- [ ] Properties panel displays when field selected
- [ ] Basic properties editor working (label, description, required, placeholder)
- [ ] Validation rules editor shows type-specific rules
- [ ] Options editor allows add/edit/delete options (dropdown, radio, etc.)
- [ ] Calculation editor for calculated fields functional
- [ ] Advanced settings editor working (read-only, hidden, CSS class)
- [ ] Real-time updates to Valtio store
- [ ] Reset to defaults button working
- [ ] Property validation with error messages

## Testing Requirements

**Unit Tests:**

- Test property form validation
- Test update field in Valtio store
- Test options add/edit/delete
- Test reset to defaults

**Integration Tests:**

- Test property panel with different field types
- Test real-time updates to canvas preview
- Test validation error handling

**Manual Testing:**

- Edit properties for all 15 field types
- Test validation rules for text/number fields
- Add/remove options for dropdown/radio fields
- Test calculation formula editor
- Verify reset to defaults

## Evidence Requirements

- [ ] Screenshot: Properties panel for text field
- [ ] Screenshot: Validation rules editor
- [ ] Screenshot: Options editor with multiple options
- [ ] Screenshot: Calculation formula editor
- [ ] Test Results: Properties panel tests (>80% coverage)

## Success Criteria

Field properties panel is complete when:

- All property editors functional
- Type-specific properties show correctly
- Real-time updates working
- Validation rules editable
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
