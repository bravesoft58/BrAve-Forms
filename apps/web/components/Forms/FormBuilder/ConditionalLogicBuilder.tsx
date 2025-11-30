'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Select,
  Button,
  Card,
  Text,
  ActionIcon,
  Badge,
  TextInput,
  NumberInput,
  Divider,
  Alert,
} from '@mantine/core';
import { IconPlus, IconTrash, IconEye, IconEyeOff, IconAlertTriangle } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, updateField } from '@/lib/stores/form-builder-store';
import type { FieldDefinition } from '@brave-forms/types';

/**
 * Condition operator types
 */
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equals'
  | 'less_than_or_equals'
  | 'is_empty'
  | 'is_not_empty';

/**
 * Single condition definition
 */
export interface Condition {
  id: string;
  fieldId: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

/**
 * Conditional rule definition
 */
export interface ConditionalRule {
  id: string;
  targetFieldId: string;
  action: 'show' | 'hide' | 'require' | 'optional';
  logic: 'AND' | 'OR';
  conditions: Condition[];
}

/**
 * Generate unique ID for conditions/rules
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Operator options for condition editor
 */
const operatorOptions = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'greater_than_or_equals', label: 'is greater than or equal to' },
  { value: 'less_than_or_equals', label: 'is less than or equal to' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

/**
 * Action options for conditional rules
 */
const actionOptions = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Make required' },
  { value: 'optional', label: 'Make optional' },
];

// ============================================================================
// Main Component
// ============================================================================

interface ConditionalLogicBuilderProps {
  fieldId: string;
}

/**
 * Conditional Logic Builder Component
 *
 * Allows form creators to define show/hide rules based on other field values.
 * Supports multiple conditions with AND/OR logic.
 */
export function ConditionalLogicBuilder({ fieldId }: ConditionalLogicBuilderProps) {
  const snap = useSnapshot(formBuilderStore);
  const field = snap.fields.find((f) => f.id === fieldId) as FieldDefinition | undefined;

  // Local state for rules (synced with store)
  const [rules, setRules] = useState<ConditionalRule[]>([]);
  const [circularError, setCircularError] = useState<string | null>(null);

  // Load rules from field on mount - convert from schema format to local format
  useEffect(() => {
    if (field?.conditional) {
      // Convert schema conditional to local rules format
      const conditional = field.conditional;
      const rule: ConditionalRule = {
        id: conditional.id,
        targetFieldId: fieldId,
        action: (conditional.actions?.[0]?.type as ConditionalRule['action']) || 'show',
        logic: conditional.operator || 'AND',
        conditions: conditional.conditions.map((c) => ({
          id: generateId('cond'),
          fieldId: c.field,
          operator: c.operator as ConditionOperator,
          value: c.value,
        })),
      };
      setRules([rule]);
    } else {
      setRules([]);
    }
  }, [field?.conditional, fieldId]);

  // Check for circular dependencies when rules change
  useEffect(() => {
    const errors = detectCircularDependencies(snap.fields as FieldDefinition[], fieldId, rules);
    setCircularError(errors.length > 0 ? errors[0] : null);
  }, [rules, snap.fields, fieldId]);

  if (!field) return null;

  // Get available fields for conditions (exclude current field)
  const availableFields = (snap.fields as FieldDefinition[])
    .filter((f) => f.id !== fieldId)
    .map((f) => ({ value: f.id, label: f.label || f.name || f.id }));

  const addRule = () => {
    const newRule: ConditionalRule = {
      id: generateId('rule'),
      targetFieldId: fieldId,
      action: 'show',
      logic: 'AND',
      conditions: [],
    };
    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    syncToStore(updatedRules);
  };

  const removeRule = (ruleId: string) => {
    const updatedRules = rules.filter((r) => r.id !== ruleId);
    setRules(updatedRules);
    syncToStore(updatedRules);
  };

  const updateRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
    const updatedRules = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    setRules(updatedRules);
    syncToStore(updatedRules);
  };

  const syncToStore = (updatedRules: ConditionalRule[]) => {
    // Convert local rules back to schema format
    if (updatedRules.length === 0) {
      updateField(fieldId, { conditional: undefined });
      return;
    }

    // For now, only support one rule per field (schema limitation)
    const rule = updatedRules[0];
    const conditional = {
      id: rule.id,
      operator: rule.logic,
      conditions: rule.conditions.map((c) => ({
        field: c.fieldId,
        operator: c.operator as
          | 'equals'
          | 'not_equals'
          | 'contains'
          | 'greater_than'
          | 'less_than'
          | 'in'
          | 'not_in',
        value: c.value,
      })),
      actions: [
        {
          type: rule.action as
            | 'show'
            | 'hide'
            | 'enable'
            | 'disable'
            | 'require'
            | 'set_value'
            | 'trigger_calculation',
          target: fieldId,
        },
      ],
    };
    updateField(fieldId, { conditional });
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={600}>
              Conditional Logic
            </Text>
            <Text size="xs" c="dimmed">
              Show, hide, or change this field based on other fields
            </Text>
          </div>
        </Group>

        {circularError && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Circular Dependency">
            {circularError}
          </Alert>
        )}

        {rules.length === 0 ? (
          <Card withBorder padding="md" ta="center" style={{ borderStyle: 'dashed' }}>
            <Stack align="center" gap="xs">
              <Text size="sm" c="dimmed">
                No conditional rules
              </Text>
              <Text size="xs" c="dimmed">
                Add rules to control when this field appears or changes
              </Text>
            </Stack>
          </Card>
        ) : (
          <Stack gap="sm">
            {rules.map((rule, index) => (
              <div key={rule.id}>
                {index > 0 && <Divider my="xs" label="OR" labelPosition="center" />}
                <ConditionalRuleEditor
                  rule={rule}
                  availableFields={availableFields}
                  onUpdate={(updates) => updateRule(rule.id, updates)}
                  onRemove={() => removeRule(rule.id)}
                />
              </div>
            ))}
          </Stack>
        )}

        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addRule} fullWidth>
          Add Conditional Rule
        </Button>
      </Stack>
    </Card>
  );
}

// ============================================================================
// Rule Editor Component
// ============================================================================

interface ConditionalRuleEditorProps {
  rule: ConditionalRule;
  availableFields: { value: string; label: string }[];
  onUpdate: (updates: Partial<ConditionalRule>) => void;
  onRemove: () => void;
}

function ConditionalRuleEditor({
  rule,
  availableFields,
  onUpdate,
  onRemove,
}: ConditionalRuleEditorProps) {
  const addCondition = () => {
    const newCondition: Condition = {
      id: generateId('cond'),
      fieldId: availableFields[0]?.value || '',
      operator: 'equals',
      value: '',
    };
    onUpdate({ conditions: [...rule.conditions, newCondition] });
  };

  const updateCondition = (conditionId: string, updates: Partial<Condition>) => {
    const updatedConditions = rule.conditions.map((c) =>
      c.id === conditionId ? { ...c, ...updates } : c
    );
    onUpdate({ conditions: updatedConditions });
  };

  const removeCondition = (conditionId: string) => {
    const updatedConditions = rule.conditions.filter((c) => c.id !== conditionId);
    onUpdate({ conditions: updatedConditions });
  };

  const getActionIcon = () => {
    switch (rule.action) {
      case 'show':
        return <IconEye size={12} />;
      case 'hide':
        return <IconEyeOff size={12} />;
      default:
        return null;
    }
  };

  const getActionColor = () => {
    switch (rule.action) {
      case 'show':
        return 'green';
      case 'hide':
        return 'orange';
      case 'require':
        return 'red';
      case 'optional':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Card withBorder padding="sm">
      <Stack gap="sm">
        {/* Rule Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <Badge color={getActionColor()} leftSection={getActionIcon()}>
              {rule.action.charAt(0).toUpperCase() + rule.action.slice(1)}
            </Badge>
            <Text size="xs" c="dimmed">
              when conditions match
            </Text>
          </Group>

          <Group gap="xs">
            <Select
              size="xs"
              value={rule.action}
              onChange={(value) => onUpdate({ action: value as ConditionalRule['action'] })}
              data={actionOptions}
              style={{ width: 140 }}
            />

            <ActionIcon variant="subtle" color="red" onClick={onRemove} aria-label="Remove rule">
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Logic Selector (only show if multiple conditions) */}
        {rule.conditions.length > 1 && (
          <Select
            size="xs"
            label="Combine conditions with"
            value={rule.logic}
            onChange={(value) => onUpdate({ logic: value as 'AND' | 'OR' })}
            data={[
              { value: 'AND', label: 'AND - All conditions must match' },
              { value: 'OR', label: 'OR - Any condition can match' },
            ]}
          />
        )}

        {/* Conditions List */}
        <Stack gap="xs">
          {rule.conditions.map((condition, index) => (
            <ConditionEditor
              key={condition.id}
              condition={condition}
              availableFields={availableFields}
              showLogicBadge={index > 0}
              logic={rule.logic}
              onUpdate={(updates) => updateCondition(condition.id, updates)}
              onRemove={() => removeCondition(condition.id)}
            />
          ))}
        </Stack>

        {/* Add Condition Button */}
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={addCondition}
        >
          Add Condition
        </Button>
      </Stack>
    </Card>
  );
}

// ============================================================================
// Condition Editor Component
// ============================================================================

interface ConditionEditorProps {
  condition: Condition;
  availableFields: { value: string; label: string }[];
  showLogicBadge: boolean;
  logic: 'AND' | 'OR';
  onUpdate: (updates: Partial<Condition>) => void;
  onRemove: () => void;
}

function ConditionEditor({
  condition,
  availableFields,
  showLogicBadge,
  logic,
  onUpdate,
  onRemove,
}: ConditionEditorProps) {
  const snap = useSnapshot(formBuilderStore);
  const selectedField = (snap.fields as FieldDefinition[]).find((f) => f.id === condition.fieldId);

  // Determine if value input is needed
  const needsValueInput = !['is_empty', 'is_not_empty'].includes(condition.operator);

  // Get options if selected field is a select/radio type
  const hasOptions =
    selectedField?.type === 'select' ||
    selectedField?.type === 'radio' ||
    selectedField?.type === 'multiSelect';
  const fieldOptions = selectedField?.options || [];

  return (
    <Card withBorder padding="xs" bg="gray.0">
      <Stack gap="xs">
        {showLogicBadge && (
          <Badge size="xs" variant="light" color={logic === 'AND' ? 'blue' : 'orange'}>
            {logic}
          </Badge>
        )}

        <Group gap="xs" wrap="nowrap" align="flex-end">
          {/* Field Selector */}
          <Select
            placeholder="Select field"
            size="xs"
            style={{ flex: 2 }}
            data={availableFields}
            value={condition.fieldId}
            onChange={(value) => onUpdate({ fieldId: value || '' })}
            searchable
          />

          {/* Operator Selector */}
          <Select
            size="xs"
            style={{ flex: 2 }}
            data={operatorOptions}
            value={condition.operator}
            onChange={(value) => onUpdate({ operator: value as ConditionOperator })}
          />

          {/* Value Input (conditional) */}
          {needsValueInput && (
            <>
              {hasOptions ? (
                <Select
                  size="xs"
                  style={{ flex: 2 }}
                  placeholder="Select value"
                  data={fieldOptions.map((opt) => ({
                    value: String(opt.value ?? opt.label),
                    label: opt.label,
                  }))}
                  value={condition.value?.toString() || ''}
                  onChange={(value) => onUpdate({ value: value || '' })}
                />
              ) : selectedField?.type === 'number' ? (
                <NumberInput
                  size="xs"
                  style={{ flex: 2 }}
                  placeholder="Value"
                  value={typeof condition.value === 'number' ? condition.value : undefined}
                  onChange={(value) => onUpdate({ value: value || 0 })}
                />
              ) : (
                <TextInput
                  size="xs"
                  style={{ flex: 2 }}
                  placeholder="Value"
                  value={condition.value?.toString() || ''}
                  onChange={(e) => onUpdate({ value: e.target.value })}
                />
              )}
            </>
          )}

          {/* Remove Button */}
          <ActionIcon variant="subtle" color="red" onClick={onRemove} aria-label="Remove condition">
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
}

// ============================================================================
// Evaluation Functions
// ============================================================================

/**
 * Evaluate a single condition against form values
 */
export function evaluateCondition(
  condition: Condition,
  formValues: Record<string, unknown>
): boolean {
  const fieldValue = formValues[condition.fieldId];

  switch (condition.operator) {
    case 'equals':
      return (
        fieldValue === condition.value || fieldValue?.toString() === condition.value?.toString()
      );

    case 'not_equals':
      return (
        fieldValue !== condition.value && fieldValue?.toString() !== condition.value?.toString()
      );

    case 'contains':
      return Boolean(
        fieldValue
          ?.toString()
          .toLowerCase()
          .includes(condition.value?.toString().toLowerCase() ?? '')
      );

    case 'not_contains':
      return !fieldValue
        ?.toString()
        .toLowerCase()
        .includes(condition.value?.toString().toLowerCase() ?? '');

    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);

    case 'less_than':
      return Number(fieldValue) < Number(condition.value);

    case 'greater_than_or_equals':
      return Number(fieldValue) >= Number(condition.value);

    case 'less_than_or_equals':
      return Number(fieldValue) <= Number(condition.value);

    case 'is_empty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';

    case 'is_not_empty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';

    default:
      return false;
  }
}

/**
 * Evaluate a conditional rule against form values
 */
export function evaluateConditionalRule(
  rule: ConditionalRule,
  formValues: Record<string, unknown>
): boolean {
  if (rule.conditions.length === 0) {
    return true; // No conditions = always true
  }

  const results = rule.conditions.map((condition) => evaluateCondition(condition, formValues));

  if (rule.logic === 'AND') {
    return results.every((r) => r === true);
  } else {
    return results.some((r) => r === true);
  }
}

/**
 * Get field visibility based on conditional rules
 */
export function getFieldVisibility(
  fieldId: string,
  fields: FieldDefinition[],
  formValues: Record<string, unknown>
): { visible: boolean; required: boolean } {
  const field = fields.find((f) => f.id === fieldId);
  if (!field) return { visible: true, required: false };

  const conditional = field.conditional;
  if (!conditional) {
    return { visible: true, required: field.validation?.required ?? false };
  }

  // Convert schema conditional to local rule format for evaluation
  const rule: ConditionalRule = {
    id: conditional.id,
    targetFieldId: fieldId,
    action: (conditional.actions?.[0]?.type as ConditionalRule['action']) || 'show',
    logic: conditional.operator || 'AND',
    conditions: conditional.conditions.map((c) => ({
      id: `cond_${c.field}`,
      fieldId: c.field,
      operator: c.operator as ConditionOperator,
      value: c.value,
    })),
  };

  let visible = true;
  let required = field.validation?.required ?? false;

  const conditionMet = evaluateConditionalRule(rule, formValues);

  if (conditionMet) {
    switch (rule.action) {
      case 'show':
        visible = true;
        break;
      case 'hide':
        visible = false;
        break;
      case 'require':
        required = true;
        break;
      case 'optional':
        required = false;
        break;
    }
  }

  return { visible, required };
}

// ============================================================================
// Circular Dependency Detection
// ============================================================================

/**
 * Detect circular dependencies in conditional logic
 */
export function detectCircularDependencies(
  fields: FieldDefinition[],
  currentFieldId: string,
  newRules: ConditionalRule[]
): string[] {
  const errors: string[] = [];

  // Build dependency graph
  const dependsOn = new Map<string, Set<string>>();

  // Initialize with existing conditional logic from fields
  fields.forEach((field) => {
    const deps = new Set<string>();
    const conditional = field.conditional;
    if (conditional) {
      conditional.conditions.forEach((condition) => {
        if (condition.field) {
          deps.add(condition.field);
        }
      });
    }
    dependsOn.set(field.id, deps);
  });

  // Add new rules for current field
  const currentDeps = new Set<string>();
  newRules.forEach((rule) => {
    rule.conditions.forEach((condition) => {
      if (condition.fieldId) {
        currentDeps.add(condition.fieldId);
      }
    });
  });
  dependsOn.set(currentFieldId, currentDeps);

  // Check for cycles using DFS
  const checkCycle = (fieldId: string, visited: Set<string>, path: Set<string>): boolean => {
    if (path.has(fieldId)) {
      return true; // Cycle detected
    }
    if (visited.has(fieldId)) {
      return false; // Already checked, no cycle
    }

    visited.add(fieldId);
    path.add(fieldId);

    const deps = dependsOn.get(fieldId) || new Set();
    for (const depId of deps) {
      if (checkCycle(depId, visited, path)) {
        const depField = fields.find((f) => f.id === depId);
        errors.push(
          `Circular dependency: "${depField?.label || depId}" depends on fields that depend on it`
        );
        return true;
      }
    }

    path.delete(fieldId);
    return false;
  };

  // Check starting from current field
  checkCycle(currentFieldId, new Set(), new Set());

  return errors;
}

export default ConditionalLogicBuilder;
