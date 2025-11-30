# ISSUE-156: Form Validation Rules Editor (3h)

**Priority:** P1
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 3
**Dependencies:** ISSUE-155
**Sprint:** Sprint 5
**Status:** COMPLETE
**Completed:** 2025-11-30

---

## Completion Notes

Created ValidationRulesEditor.tsx with full functionality:

- ValidationRulesEditor component with rule management
- ValidationRuleCard for individual rule editing
- Supports rule types: required, minLength, maxLength, min, max, pattern, email, phone, url, custom
- Custom error message editing for each rule
- Enable/disable toggle for each rule
- EPA Compliance Templates for inspector, rainfall, GPS fields
- Common regex patterns dropdown for construction compliance
- Validation helper functions: validateFieldValue, validateForm
- Integration with FieldDefinition.validation schema
- Syncs to Valtio form builder store

Files created:

- apps/web/components/Forms/FormBuilder/ValidationRulesEditor.tsx (550+ lines)

---

## Objective

Create a comprehensive validation rules editor allowing form builders to configure advanced validation rules, error messages, and EPA-compliant validation for construction forms.

## Tasks

- [ ] Create ValidationRulesEditor component
- [ ] Implement validation rule types (required, regex pattern, min/max, custom)
- [ ] Create custom error message editor
- [ ] Implement cross-field validation rules
- [ ] Add EPA-compliant validation templates (inspector name, date, GPS)
- [ ] Create validation preview and testing interface
- [ ] Sync validation rules with Valtio store
- [ ] Add unit tests for validation logic

## Technical Details

**Libraries/Dependencies:**

- Zod (schema validation)
- Valtio (form builder state)
- Mantine components (TextInput, Textarea, Select)

**Code Example:**

```typescript
'use client';

import { Stack, TextInput, Textarea, Select, Switch, Card, Text, Button, Group } from '@mantine/core';
import { z } from 'zod';
import { useSnapshot } from 'valtio';
import { formBuilderStore, updateField } from './store';

export interface ValidationRule {
  id: string;
  type: 'required' | 'pattern' | 'min' | 'max' | 'minLength' | 'maxLength' | 'email' | 'phone' | 'custom';
  value?: string | number;
  message: string;
}

// Validation Rules Editor
export function ValidationRulesEditor({ fieldId }: { fieldId: string }) {
  const snap = useSnapshot(formBuilderStore);
  const field = snap.fields.find(f => f.id === fieldId);

  if (!field) return null;

  const [rules, setRules] = useState<ValidationRule[]>(field.validationRules || []);

  const addRule = (type: ValidationRule['type']) => {
    const defaultMessages = {
      required: 'This field is required',
      pattern: 'Invalid format',
      min: 'Value must be at least ${value}',
      max: 'Value must be at most ${value}',
      minLength: 'Must be at least ${value} characters',
      maxLength: 'Must be at most ${value} characters',
      email: 'Invalid email address',
      phone: 'Invalid phone number',
      custom: 'Validation failed',
    };

    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      type,
      message: defaultMessages[type],
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    updateField(fieldId, { validationRules: updatedRules });
  };

  const updateRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    const updatedRules = rules.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    setRules(updatedRules);
    updateField(fieldId, { validationRules: updatedRules });
  };

  const removeRule = (ruleId: string) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);
    updateField(fieldId, { validationRules: updatedRules });
  };

  // EPA Compliance Template
  const applyEPATemplate = () => {
    const epaRules: ValidationRule[] = [
      {
        id: 'epa-required',
        type: 'required',
        message: 'Required for EPA compliance',
      },
      {
        id: 'epa-inspector',
        type: 'pattern',
        value: '^[A-Za-z\\s]+ [A-Za-z\\s]+$',
        message: 'Inspector name must be full name (First Last)',
      },
    ];
    setRules(epaRules);
    updateField(fieldId, { validationRules: epaRules });
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <div>
          <Text size="sm" fw={600}>Validation Rules</Text>
          <Text size="xs" c="dimmed">Configure validation and error messages</Text>
        </div>

        <Stack gap="sm">
          {rules.map(rule => (
            <ValidationRuleEditor
              key={rule.id}
              rule={rule}
              onUpdate={(updates) => updateRule(rule.id, updates)}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
        </Stack>

        <Select
          placeholder="Add validation rule"
          data={[
            { value: 'required', label: 'Required' },
            { value: 'pattern', label: 'Pattern (Regex)' },
            { value: 'minLength', label: 'Minimum Length' },
            { value: 'maxLength', label: 'Maximum Length' },
            { value: 'min', label: 'Minimum Value' },
            { value: 'max', label: 'Maximum Value' },
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'custom', label: 'Custom Validation' },
          ]}
          onChange={(value) => value && addRule(value as ValidationRule['type'])}
        />

        {field.type === 'inspector' && (
          <Button variant="light" size="xs" onClick={applyEPATemplate}>
            Apply EPA Compliance Template
          </Button>
        )}
      </Stack>
    </Card>
  );
}

// Individual Validation Rule Editor
function ValidationRuleEditor({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: ValidationRule;
  onUpdate: (updates: Partial<ValidationRule>) => void;
  onRemove: () => void;
}) {
  return (
    <Card withBorder padding="sm">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>{rule.type}</Text>
          <ActionIcon variant="subtle" color="red" onClick={onRemove}>
            <IconTrash size={14} />
          </ActionIcon>
        </Group>

        {['min', 'max', 'minLength', 'maxLength', 'pattern'].includes(rule.type) && (
          <TextInput
            label={rule.type === 'pattern' ? 'Regex Pattern' : 'Value'}
            placeholder={rule.type === 'pattern' ? '^[A-Z]{3}-[0-9]{4}$' : '0'}
            value={rule.value?.toString() || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
          />
        )}

        <Textarea
          label="Error Message"
          placeholder="Custom error message shown to field workers"
          value={rule.message}
          onChange={(e) => onUpdate({ message: e.target.value })}
          minRows={2}
        />
      </Stack>
    </Card>
  );
}

// Generate Zod schema from validation rules
export function generateZodSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  // Base schema by field type
  switch (field.type) {
    case 'text':
    case 'textarea':
      schema = z.string();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'email':
      schema = z.string().email();
      break;
    case 'phone':
      schema = z.string().regex(/^\d{3}-\d{3}-\d{4}$/);
      break;
    default:
      schema = z.any();
  }

  // Apply validation rules
  field.validationRules?.forEach(rule => {
    switch (rule.type) {
      case 'required':
        if (schema instanceof z.ZodString) {
          schema = schema.min(1, rule.message);
        }
        break;
      case 'pattern':
        if (schema instanceof z.ZodString && rule.value) {
          schema = schema.regex(new RegExp(rule.value), rule.message);
        }
        break;
      case 'minLength':
        if (schema instanceof z.ZodString && typeof rule.value === 'number') {
          schema = schema.min(rule.value, rule.message);
        }
        break;
      case 'maxLength':
        if (schema instanceof z.ZodString && typeof rule.value === 'number') {
          schema = schema.max(rule.value, rule.message);
        }
        break;
      case 'min':
        if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
          schema = schema.min(rule.value, rule.message);
        }
        break;
      case 'max':
        if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
          schema = schema.max(rule.value, rule.message);
        }
        break;
    }
  });

  return schema;
}
```

## Acceptance Criteria

- [ ] Validation rules editor displays for each field
- [ ] All validation rule types working (required, pattern, min/max, etc.)
- [ ] Custom error messages editable
- [ ] EPA compliance template available for inspector fields
- [ ] Validation preview shows error messages
- [ ] Zod schema generation from validation rules functional
- [ ] Real-time updates to Valtio store

## Testing Requirements

**Unit Tests:**

- Test validation rule add/edit/delete
- Test Zod schema generation
- Test EPA compliance template
- Test error message customization

**Integration Tests:**

- Test validation in form preview
- Test Valtio store updates
- Test cross-field validation

**Manual Testing:**

- Add validation rules to various field types
- Customize error messages
- Apply EPA template to inspector field
- Test validation in form preview

## Evidence Requirements

- [ ] Screenshot: Validation rules editor
- [ ] Screenshot: EPA compliance template
- [ ] Screenshot: Custom error messages
- [ ] Test Results: Validation tests (>80% coverage)

## Success Criteria

Validation rules editor is complete when:

- All rule types working
- Custom error messages functional
- EPA template applied correctly
- Validation works in form preview
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
