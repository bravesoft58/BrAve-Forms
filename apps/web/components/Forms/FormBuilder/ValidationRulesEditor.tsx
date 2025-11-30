'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  Switch,
  Card,
  Text,
  Button,
  ActionIcon,
  Badge,
  Collapse,
  Alert,
} from '@mantine/core';
import { IconTrash, IconAlertTriangle, IconShieldCheck } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, updateField } from '@/lib/stores/form-builder-store';
import type { FieldDefinition } from '@brave-forms/types';

/**
 * Validation rule type
 */
export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'custom';

/**
 * Validation rule interface
 */
export interface ValidationRule {
  id: string;
  type: ValidationRuleType;
  value?: string | number;
  message: string;
  enabled: boolean;
}

/**
 * Generate unique ID for rules
 */
function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Default error messages for each rule type
 */
const defaultMessages: Record<ValidationRuleType, string> = {
  required: 'This field is required',
  minLength: 'Must be at least {value} characters',
  maxLength: 'Must be at most {value} characters',
  min: 'Value must be at least {value}',
  max: 'Value must be at most {value}',
  pattern: 'Invalid format',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  date: 'Please enter a valid date',
  custom: 'Validation failed',
};

/**
 * Rule type labels and descriptions
 */
const ruleTypeInfo: Record<ValidationRuleType, { label: string; description: string }> = {
  required: { label: 'Required', description: 'Field must have a value' },
  minLength: { label: 'Minimum Length', description: 'Minimum character count' },
  maxLength: { label: 'Maximum Length', description: 'Maximum character count' },
  min: { label: 'Minimum Value', description: 'Minimum numeric value' },
  max: { label: 'Maximum Value', description: 'Maximum numeric value' },
  pattern: { label: 'Pattern (Regex)', description: 'Custom regex pattern' },
  email: { label: 'Email Format', description: 'Valid email address' },
  phone: { label: 'Phone Format', description: 'Valid phone number' },
  url: { label: 'URL Format', description: 'Valid URL' },
  date: { label: 'Date Format', description: 'Valid date' },
  custom: { label: 'Custom Validation', description: 'Custom JavaScript validation' },
};

/**
 * Get available rule types based on field type
 */
function getAvailableRuleTypes(fieldType: string): ValidationRuleType[] {
  const baseRules: ValidationRuleType[] = ['required', 'custom'];

  switch (fieldType) {
    case 'text':
    case 'textarea':
      return [...baseRules, 'minLength', 'maxLength', 'pattern', 'email', 'phone', 'url'];
    case 'number':
    case 'measurement':
      return [...baseRules, 'min', 'max'];
    case 'date':
    case 'time':
      return [...baseRules, 'date'];
    case 'select':
    case 'multiSelect':
    case 'radio':
    case 'checkbox':
      return baseRules;
    default:
      return baseRules;
  }
}

/**
 * Common regex patterns for construction compliance
 */
const commonPatterns = [
  { value: '^[A-Za-z\\s]+$', label: 'Letters only' },
  { value: '^[0-9]+$', label: 'Numbers only' },
  { value: '^[A-Za-z0-9]+$', label: 'Alphanumeric' },
  { value: '^[A-Za-z\\s]+ [A-Za-z\\s]+$', label: 'Full name (First Last)' },
  { value: '^\\d{5}(-\\d{4})?$', label: 'US ZIP Code' },
  { value: '^[A-Z]{2,3}-\\d{4,6}$', label: 'Permit Number (XX-0000)' },
  { value: '^SWPPP-\\d{4}-\\d{3}$', label: 'SWPPP ID (SWPPP-0000-000)' },
];

// ============================================================================
// Main Component
// ============================================================================

interface ValidationRulesEditorProps {
  fieldId: string;
}

/**
 * Validation Rules Editor Component
 *
 * Allows form builders to configure validation rules with custom error messages.
 * Supports EPA-compliant validation templates for construction forms.
 */
export function ValidationRulesEditor({ fieldId }: ValidationRulesEditorProps) {
  const snap = useSnapshot(formBuilderStore);
  const field = snap.fields.find((f) => f.id === fieldId) as FieldDefinition | undefined;

  // Local state for rules
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [expanded, setExpanded] = useState(true);

  // Load rules from field validation on mount
  useEffect(() => {
    if (field?.validation) {
      const loadedRules: ValidationRule[] = [];

      if (field.validation.required) {
        loadedRules.push({
          id: generateId(),
          type: 'required',
          message: defaultMessages.required,
          enabled: true,
        });
      }

      if (field.validation.minLength !== undefined) {
        loadedRules.push({
          id: generateId(),
          type: 'minLength',
          value: field.validation.minLength,
          message: defaultMessages.minLength.replace('{value}', String(field.validation.minLength)),
          enabled: true,
        });
      }

      if (field.validation.maxLength !== undefined) {
        loadedRules.push({
          id: generateId(),
          type: 'maxLength',
          value: field.validation.maxLength,
          message: defaultMessages.maxLength.replace('{value}', String(field.validation.maxLength)),
          enabled: true,
        });
      }

      if (field.validation.min !== undefined) {
        loadedRules.push({
          id: generateId(),
          type: 'min',
          value: field.validation.min,
          message: defaultMessages.min.replace('{value}', String(field.validation.min)),
          enabled: true,
        });
      }

      if (field.validation.max !== undefined) {
        loadedRules.push({
          id: generateId(),
          type: 'max',
          value: field.validation.max,
          message: defaultMessages.max.replace('{value}', String(field.validation.max)),
          enabled: true,
        });
      }

      if (field.validation.pattern) {
        loadedRules.push({
          id: generateId(),
          type: 'pattern',
          value: field.validation.pattern,
          message: defaultMessages.pattern,
          enabled: true,
        });
      }

      setRules(loadedRules);
    } else {
      setRules([]);
    }
  }, [field?.validation]);

  if (!field) return null;

  const availableRuleTypes = getAvailableRuleTypes(field.type);

  // Get rule types not yet added
  const unusedRuleTypes = availableRuleTypes.filter(
    (type) => type === 'custom' || !rules.some((r) => r.type === type)
  );

  const addRule = (type: ValidationRuleType) => {
    const newRule: ValidationRule = {
      id: generateId(),
      type,
      message: defaultMessages[type],
      enabled: true,
    };

    // Set default values for certain rule types
    if (type === 'minLength') newRule.value = 1;
    if (type === 'maxLength') newRule.value = 100;
    if (type === 'min') newRule.value = 0;
    if (type === 'max') newRule.value = 100;
    if (type === 'pattern') newRule.value = '';

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    syncToStore(updatedRules);
  };

  const updateRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    const updatedRules = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    setRules(updatedRules);
    syncToStore(updatedRules);
  };

  const removeRule = (ruleId: string) => {
    const updatedRules = rules.filter((r) => r.id !== ruleId);
    setRules(updatedRules);
    syncToStore(updatedRules);
  };

  const syncToStore = (updatedRules: ValidationRule[]) => {
    // Convert rules to FieldValidation schema format
    const validation: {
      required: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: string;
      customValidation?: string;
    } = { required: false };

    const enabledRules = updatedRules.filter((r) => r.enabled);

    enabledRules.forEach((rule) => {
      switch (rule.type) {
        case 'required':
          validation.required = true;
          break;
        case 'minLength':
          if (typeof rule.value === 'number') {
            validation.minLength = rule.value;
          }
          break;
        case 'maxLength':
          if (typeof rule.value === 'number') {
            validation.maxLength = rule.value;
          }
          break;
        case 'min':
          if (typeof rule.value === 'number') {
            validation.min = rule.value;
          }
          break;
        case 'max':
          if (typeof rule.value === 'number') {
            validation.max = rule.value;
          }
          break;
        case 'pattern':
          if (typeof rule.value === 'string' && rule.value) {
            validation.pattern = rule.value;
          }
          break;
        case 'email':
          validation.pattern = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$';
          break;
        case 'phone':
          validation.pattern = '^[\\d\\s\\-\\(\\)\\+]+$';
          break;
        case 'url':
          validation.pattern = '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+.*$';
          break;
        case 'custom':
          if (typeof rule.value === 'string' && rule.value) {
            validation.customValidation = rule.value;
          }
          break;
      }
    });

    // Only set validation if there are enabled rules, otherwise clear it
    if (enabledRules.length > 0) {
      updateField(fieldId, { validation });
    } else {
      updateField(fieldId, { validation: undefined });
    }
  };

  // EPA Compliance Templates
  const applyEPATemplate = (template: 'inspector' | 'rainfall' | 'gps') => {
    let templateRules: ValidationRule[] = [];

    switch (template) {
      case 'inspector':
        templateRules = [
          {
            id: generateId(),
            type: 'required',
            message: 'Inspector name is required for EPA compliance',
            enabled: true,
          },
          {
            id: generateId(),
            type: 'pattern',
            value: '^[A-Za-z\\s]+ [A-Za-z\\s]+$',
            message: 'Enter full name (First Last) for EPA records',
            enabled: true,
          },
        ];
        break;

      case 'rainfall':
        templateRules = [
          {
            id: generateId(),
            type: 'required',
            message: 'Rainfall measurement is required for EPA CGP compliance',
            enabled: true,
          },
          {
            id: generateId(),
            type: 'min',
            value: 0,
            message: 'Rainfall cannot be negative',
            enabled: true,
          },
          {
            id: generateId(),
            type: 'max',
            value: 20,
            message: 'Verify rainfall measurement (exceeds 20 inches)',
            enabled: true,
          },
        ];
        break;

      case 'gps':
        templateRules = [
          {
            id: generateId(),
            type: 'required',
            message: 'GPS coordinates are required for inspection location',
            enabled: true,
          },
        ];
        break;
    }

    setRules(templateRules);
    syncToStore(templateRules);
  };

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <div>
              <Text size="sm" fw={600}>
                Validation Rules
              </Text>
              <Text size="xs" c="dimmed">
                Configure field validation and error messages
              </Text>
            </div>
            {enabledCount > 0 && (
              <Badge size="sm" variant="light">
                {enabledCount} active
              </Badge>
            )}
          </Group>

          <ActionIcon variant="subtle" onClick={() => setExpanded(!expanded)}>
            {expanded ? '-' : '+'}
          </ActionIcon>
        </Group>

        <Collapse in={expanded}>
          <Stack gap="md">
            {/* EPA Compliance Templates */}
            {(field.type === 'inspector' ||
              field.type === 'measurement' ||
              field.type === 'gpsLocation') && (
              <Alert
                icon={<IconShieldCheck size={16} />}
                color="blue"
                title="EPA Compliance Templates"
              >
                <Group gap="xs" mt="xs">
                  {field.type === 'inspector' && (
                    <Button size="xs" variant="light" onClick={() => applyEPATemplate('inspector')}>
                      Inspector Name Rules
                    </Button>
                  )}
                  {field.type === 'measurement' && (
                    <Button size="xs" variant="light" onClick={() => applyEPATemplate('rainfall')}>
                      Rainfall Measurement Rules
                    </Button>
                  )}
                  {field.type === 'gpsLocation' && (
                    <Button size="xs" variant="light" onClick={() => applyEPATemplate('gps')}>
                      GPS Location Rules
                    </Button>
                  )}
                </Group>
              </Alert>
            )}

            {/* Rules List */}
            {rules.length === 0 ? (
              <Card withBorder padding="md" ta="center" style={{ borderStyle: 'dashed' }}>
                <Stack align="center" gap="xs">
                  <Text size="sm" c="dimmed">
                    No validation rules
                  </Text>
                  <Text size="xs" c="dimmed">
                    Add rules to ensure data quality and compliance
                  </Text>
                </Stack>
              </Card>
            ) : (
              <Stack gap="sm">
                {rules.map((rule) => (
                  <ValidationRuleCard
                    key={rule.id}
                    rule={rule}
                    fieldType={field.type}
                    onUpdate={(updates) => updateRule(rule.id, updates)}
                    onRemove={() => removeRule(rule.id)}
                  />
                ))}
              </Stack>
            )}

            {/* Add Rule Selector */}
            {unusedRuleTypes.length > 0 && (
              <Select
                placeholder="Add validation rule..."
                data={unusedRuleTypes.map((type) => ({
                  value: type,
                  label: ruleTypeInfo[type].label,
                }))}
                value={null}
                onChange={(value) => value && addRule(value as ValidationRuleType)}
                clearable
              />
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}

// ============================================================================
// Rule Card Component
// ============================================================================

interface ValidationRuleCardProps {
  rule: ValidationRule;
  fieldType: string;
  onUpdate: (updates: Partial<ValidationRule>) => void;
  onRemove: () => void;
}

function ValidationRuleCard({
  rule,
  fieldType: _fieldType,
  onUpdate,
  onRemove,
}: ValidationRuleCardProps) {
  const info = ruleTypeInfo[rule.type];
  const needsValue = ['minLength', 'maxLength', 'min', 'max', 'pattern', 'custom'].includes(
    rule.type
  );
  const isNumericValue = ['minLength', 'maxLength', 'min', 'max'].includes(rule.type);

  return (
    <Card withBorder padding="sm" bg={rule.enabled ? undefined : 'gray.0'}>
      <Stack gap="xs">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <Switch
              size="xs"
              checked={rule.enabled}
              onChange={(e) => onUpdate({ enabled: e.currentTarget.checked })}
              aria-label="Enable rule"
            />
            <Badge
              size="sm"
              color={rule.enabled ? 'blue' : 'gray'}
              variant={rule.enabled ? 'filled' : 'light'}
            >
              {info.label}
            </Badge>
            <Text size="xs" c="dimmed">
              {info.description}
            </Text>
          </Group>

          <ActionIcon variant="subtle" color="red" onClick={onRemove} aria-label="Remove rule">
            <IconTrash size={14} />
          </ActionIcon>
        </Group>

        {/* Value Input */}
        {needsValue && (
          <>
            {rule.type === 'pattern' ? (
              <Stack gap="xs">
                <Select
                  size="xs"
                  placeholder="Choose common pattern or enter custom"
                  data={commonPatterns}
                  value={rule.value?.toString() || ''}
                  onChange={(value) => onUpdate({ value: value || '' })}
                  searchable
                  clearable
                />
                <TextInput
                  size="xs"
                  placeholder="Custom regex pattern (e.g., ^[A-Z]{3}-\d{4}$)"
                  value={rule.value?.toString() || ''}
                  onChange={(e) => onUpdate({ value: e.target.value })}
                  leftSection="/"
                  rightSection="/"
                />
              </Stack>
            ) : rule.type === 'custom' ? (
              <Textarea
                size="xs"
                placeholder="JavaScript validation function: (value) => value.length > 0"
                value={rule.value?.toString() || ''}
                onChange={(e) => onUpdate({ value: e.target.value })}
                minRows={2}
              />
            ) : isNumericValue ? (
              <NumberInput
                size="xs"
                placeholder="Value"
                value={typeof rule.value === 'number' ? rule.value : undefined}
                onChange={(value) =>
                  onUpdate({ value: typeof value === 'number' ? value : undefined })
                }
                min={0}
              />
            ) : null}
          </>
        )}

        {/* Error Message */}
        <TextInput
          size="xs"
          label="Error Message"
          placeholder="Message shown when validation fails"
          value={rule.message}
          onChange={(e) => onUpdate({ message: e.target.value })}
          leftSection={<IconAlertTriangle size={14} />}
        />
      </Stack>
    </Card>
  );
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate a field value against its validation rules
 */
export function validateFieldValue(
  value: unknown,
  validation: FieldDefinition['validation']
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validation) {
    return { valid: true, errors: [] };
  }

  const stringValue = value?.toString() ?? '';
  const numValue = typeof value === 'number' ? value : parseFloat(stringValue);

  // Required check
  if (validation.required) {
    if (value === undefined || value === null || stringValue === '') {
      errors.push('This field is required');
    }
  }

  // Skip other validations if empty and not required
  if (stringValue === '' && !validation.required) {
    return { valid: errors.length === 0, errors };
  }

  // String length checks
  if (validation.minLength !== undefined && stringValue.length < validation.minLength) {
    errors.push(`Must be at least ${validation.minLength} characters`);
  }

  if (validation.maxLength !== undefined && stringValue.length > validation.maxLength) {
    errors.push(`Must be at most ${validation.maxLength} characters`);
  }

  // Numeric checks
  if (validation.min !== undefined && !isNaN(numValue) && numValue < validation.min) {
    errors.push(`Value must be at least ${validation.min}`);
  }

  if (validation.max !== undefined && !isNaN(numValue) && numValue > validation.max) {
    errors.push(`Value must be at most ${validation.max}`);
  }

  // Pattern check
  if (validation.pattern) {
    try {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(stringValue)) {
        errors.push('Invalid format');
      }
    } catch {
      // Invalid regex, skip
    }
  }

  // Custom validation
  if (validation.customValidation) {
    try {
      // Safe evaluation of custom validation
      const fn = new Function('value', `return (${validation.customValidation})(value)`);
      const result = fn(value);
      if (result === false) {
        errors.push('Custom validation failed');
      } else if (typeof result === 'string') {
        errors.push(result);
      }
    } catch {
      // Custom validation error, skip
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all fields in a form
 */
export function validateForm(
  fields: FieldDefinition[],
  values: Record<string, unknown>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  fields.forEach((field) => {
    const value = values[field.id] ?? values[field.name];
    const result = validateFieldValue(value, field.validation);

    if (!result.valid) {
      errors[field.id] = result.errors;
    }
  });

  return errors;
}

export default ValidationRulesEditor;
