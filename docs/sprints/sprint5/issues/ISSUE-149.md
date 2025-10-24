# ISSUE-149: Conditional Logic Builder (5h)

**Priority:** P1
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 5
**Dependencies:** ISSUE-148
**Sprint:** Sprint 5

---

## Objective

Create a visual conditional logic builder allowing form creators to show/hide fields based on other field values, implementing EPA-compliant conditional requirements for construction forms.

## Tasks

- [ ] Create ConditionalLogicBuilder component
- [ ] Create condition rule editor (if field X equals/contains Y, then show/hide field Z)
- [ ] Implement condition types (equals, not equals, contains, greater than, less than)
- [ ] Support multiple conditions with AND/OR logic
- [ ] Create condition preview and testing interface
- [ ] Implement condition validation (prevent circular dependencies)
- [ ] Add visual indicators for conditional fields
- [ ] Sync conditional logic with Valtio store
- [ ] Add unit tests for conditional logic evaluation

## Technical Details

**Libraries/Dependencies:**

- Valtio (form builder state)
- React Hook Form + Zod (condition form validation)
- Mantine components (Select, Switch, Button, Card)
- expr-eval (condition expression evaluation)

**Code Example:**

```typescript
'use client';

import { useState } from 'react';
import { Stack, Group, Select, Button, Card, Text, ActionIcon, Badge, Switch } from '@mantine/core';
import { IconPlus, IconTrash, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, updateField } from './store';
import { Parser } from 'expr-eval';

export interface Condition {
  id: string;
  fieldId: string; // Source field ID
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
}

export interface ConditionalRule {
  id: string;
  targetFieldId: string; // Field to show/hide
  action: 'show' | 'hide';
  logic: 'AND' | 'OR';
  conditions: Condition[];
}

// Conditional Logic Builder Component
export function ConditionalLogicBuilder({ fieldId }: { fieldId: string }) {
  const snap = useSnapshot(formBuilderStore);
  const field = snap.fields.find(f => f.id === fieldId);

  if (!field) return null;

  const [rules, setRules] = useState<ConditionalRule[]>(field.conditionalRules || []);

  const addRule = () => {
    const newRule: ConditionalRule = {
      id: `rule-${Date.now()}`,
      targetFieldId: fieldId,
      action: 'show',
      logic: 'AND',
      conditions: [],
    };
    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    updateField(fieldId, { conditionalRules: updatedRules });
  };

  const removeRule = (ruleId: string) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);
    updateField(fieldId, { conditionalRules: updatedRules });
  };

  const updateRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
    const updatedRules = rules.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    setRules(updatedRules);
    updateField(fieldId, { conditionalRules: updatedRules });
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={600}>Conditional Logic</Text>
            <Text size="xs" c="dimmed">Show or hide this field based on other fields</Text>
          </div>
        </Group>

        {rules.length === 0 ? (
          <Card withBorder padding="md" ta="center" style={{ borderStyle: 'dashed' }}>
            <Stack align="center" gap="xs">
              <Text size="sm" c="dimmed">No conditional rules</Text>
              <Text size="xs" c="dimmed">
                Add rules to show/hide this field dynamically
              </Text>
            </Stack>
          </Card>
        ) : (
          <Stack gap="sm">
            {rules.map(rule => (
              <ConditionalRuleEditor
                key={rule.id}
                rule={rule}
                onUpdate={(updates) => updateRule(rule.id, updates)}
                onRemove={() => removeRule(rule.id)}
              />
            ))}
          </Stack>
        )}

        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={addRule}
        >
          Add Conditional Rule
        </Button>
      </Stack>
    </Card>
  );
}

// Conditional Rule Editor
function ConditionalRuleEditor({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: ConditionalRule;
  onUpdate: (updates: Partial<ConditionalRule>) => void;
  onRemove: () => void;
}) {
  const snap = useSnapshot(formBuilderStore);

  const availableFields = snap.fields
    .filter(f => f.id !== rule.targetFieldId)
    .map(f => ({ value: f.id, label: f.label }));

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      fieldId: '',
      operator: 'equals',
      value: '',
    };
    onUpdate({ conditions: [...rule.conditions, newCondition] });
  };

  const updateCondition = (conditionId: string, updates: Partial<Condition>) => {
    const updatedConditions = rule.conditions.map(c =>
      c.id === conditionId ? { ...c, ...updates } : c
    );
    onUpdate({ conditions: updatedConditions });
  };

  const removeCondition = (conditionId: string) => {
    const updatedConditions = rule.conditions.filter(c => c.id !== conditionId);
    onUpdate({ conditions: updatedConditions });
  };

  return (
    <Card withBorder padding="sm">
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge color={rule.action === 'show' ? 'green' : 'orange'}>
              {rule.action === 'show' ? <IconEye size={12} /> : <IconEyeOff size={12} />}
              {rule.action === 'show' ? 'Show' : 'Hide'}
            </Badge>
            <Text size="xs" c="dimmed">when conditions match</Text>
          </Group>

          <Group gap="xs">
            <Select
              size="xs"
              value={rule.action}
              onChange={(value) => onUpdate({ action: value as 'show' | 'hide' })}
              data={[
                { value: 'show', label: 'Show field' },
                { value: 'hide', label: 'Hide field' },
              ]}
            />

            <ActionIcon
              variant="subtle"
              color="red"
              onClick={onRemove}
              aria-label="Remove rule"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {rule.conditions.length > 0 && (
          <Select
            size="xs"
            label="Combine conditions with"
            value={rule.logic}
            onChange={(value) => onUpdate({ logic: value as 'AND' | 'OR' })}
            data={[
              { value: 'AND', label: 'AND (all conditions must match)' },
              { value: 'OR', label: 'OR (any condition can match)' },
            ]}
          />
        )}

        <Stack gap="xs">
          {rule.conditions.map((condition, index) => (
            <ConditionEditor
              key={condition.id}
              condition={condition}
              availableFields={availableFields}
              showLogic={index > 0}
              logic={rule.logic}
              onUpdate={(updates) => updateCondition(condition.id, updates)}
              onRemove={() => removeCondition(condition.id)}
            />
          ))}
        </Stack>

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

// Individual Condition Editor
function ConditionEditor({
  condition,
  availableFields,
  showLogic,
  logic,
  onUpdate,
  onRemove,
}: {
  condition: Condition;
  availableFields: { value: string; label: string }[];
  showLogic: boolean;
  logic: 'AND' | 'OR';
  onUpdate: (updates: Partial<Condition>) => void;
  onRemove: () => void;
}) {
  const snap = useSnapshot(formBuilderStore);
  const selectedField = snap.fields.find(f => f.id === condition.fieldId);

  const operatorOptions = [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ];

  return (
    <Card withBorder padding="xs">
      <Stack gap="xs">
        {showLogic && (
          <Badge size="xs" variant="light" color={logic === 'AND' ? 'blue' : 'orange'}>
            {logic}
          </Badge>
        )}

        <Group gap="xs" wrap="nowrap">
          <Select
            placeholder="Select field"
            size="xs"
            style={{ flex: 1 }}
            data={availableFields}
            value={condition.fieldId}
            onChange={(value) => onUpdate({ fieldId: value || '' })}
          />

          <Select
            size="xs"
            style={{ flex: 1 }}
            data={operatorOptions}
            value={condition.operator}
            onChange={(value) => onUpdate({ operator: value as Condition['operator'] })}
          />

          {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
            <>
              {selectedField?.type === 'dropdown' || selectedField?.type === 'radio' ? (
                <Select
                  size="xs"
                  style={{ flex: 1 }}
                  placeholder="Select value"
                  data={selectedField.options?.map(opt => ({ value: opt.value, label: opt.label })) || []}
                  value={condition.value?.toString()}
                  onChange={(value) => onUpdate({ value: value || '' })}
                />
              ) : (
                <TextInput
                  size="xs"
                  style={{ flex: 1 }}
                  placeholder="Value"
                  value={condition.value?.toString() || ''}
                  onChange={(e) => onUpdate({ value: e.target.value })}
                />
              )}
            </>
          )}

          <ActionIcon
            variant="subtle"
            color="red"
            onClick={onRemove}
            aria-label="Remove condition"
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
}

// Evaluate conditional logic
export function evaluateConditionalLogic(
  rule: ConditionalRule,
  formValues: Record<string, any>
): boolean {
  if (rule.conditions.length === 0) return true;

  const results = rule.conditions.map(condition => {
    const fieldValue = formValues[condition.fieldId];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return fieldValue?.toString().includes(condition.value?.toString());
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '';
      default:
        return false;
    }
  });

  return rule.logic === 'AND'
    ? results.every(r => r === true)
    : results.some(r => r === true);
}

// Detect circular dependencies
export function detectCircularDependencies(fields: FormField[]): string[] {
  const errors: string[] = [];

  fields.forEach(field => {
    const visited = new Set<string>();
    const checkDependencies = (fieldId: string) => {
      if (visited.has(fieldId)) {
        errors.push(`Circular dependency detected involving field: ${field.label}`);
        return;
      }

      visited.add(fieldId);

      const currentField = fields.find(f => f.id === fieldId);
      currentField?.conditionalRules?.forEach(rule => {
        rule.conditions.forEach(condition => {
          checkDependencies(condition.fieldId);
        });
      });
    };

    checkDependencies(field.id);
  });

  return errors;
}
```

## Acceptance Criteria

- [ ] Conditional logic builder displays for each field
- [ ] Add/edit/delete conditional rules working
- [ ] Condition operators support equals, not equals, contains, greater/less than, empty checks
- [ ] Multiple conditions with AND/OR logic functional
- [ ] Visual indicators for conditional fields
- [ ] Condition preview shows expected behavior
- [ ] Circular dependency detection prevents invalid configs
- [ ] Real-time updates to Valtio store
- [ ] Conditional logic evaluates correctly in form preview

## Testing Requirements

**Unit Tests:**

- Test condition evaluation logic
- Test circular dependency detection
- Test AND/OR logic combinations
- Test all operator types

**Integration Tests:**

- Test conditional logic with form preview
- Test complex multi-condition rules
- Test Valtio store updates

**Manual Testing:**

- Create show/hide rules for various field types
- Test multiple conditions with AND logic
- Test multiple conditions with OR logic
- Verify circular dependency prevention
- Test conditional logic in form preview

## Evidence Requirements

- [ ] Screenshot: Conditional logic builder UI
- [ ] Screenshot: Multiple conditions with AND/OR logic
- [ ] Screenshot: Condition preview
- [ ] Video: Conditional logic in action (form preview)
- [ ] Test Results: Conditional logic tests (>80% coverage)

## Success Criteria

Conditional logic builder is complete when:

- All condition types working
- AND/OR logic functional
- Circular dependency detection working
- Form preview reflects conditional logic
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
