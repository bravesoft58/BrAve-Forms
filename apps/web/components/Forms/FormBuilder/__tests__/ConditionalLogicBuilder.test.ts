import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateConditionalRule,
  getFieldVisibility,
  detectCircularDependencies,
  type Condition,
  type ConditionalRule,
} from '../ConditionalLogicBuilder';
import type { FieldDefinition } from '@brave-forms/types';

describe('ConditionalLogicBuilder - Evaluation Functions', () => {
  describe('evaluateCondition', () => {
    describe('equals operator', () => {
      it('should return true when values match exactly', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'status',
          operator: 'equals',
          value: 'active',
        };

        const result = evaluateCondition(condition, { status: 'active' });

        expect(result).toBe(true);
      });

      it('should return true when string representation matches', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'count',
          operator: 'equals',
          value: '5',
        };

        const result = evaluateCondition(condition, { count: 5 });

        expect(result).toBe(true);
      });

      it('should return false when values do not match', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'status',
          operator: 'equals',
          value: 'active',
        };

        const result = evaluateCondition(condition, { status: 'inactive' });

        expect(result).toBe(false);
      });
    });

    describe('not_equals operator', () => {
      it('should return true when values do not match', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'status',
          operator: 'not_equals',
          value: 'active',
        };

        const result = evaluateCondition(condition, { status: 'inactive' });

        expect(result).toBe(true);
      });

      it('should return false when values match', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'status',
          operator: 'not_equals',
          value: 'active',
        };

        const result = evaluateCondition(condition, { status: 'active' });

        expect(result).toBe(false);
      });
    });

    describe('contains operator', () => {
      it('should return true when value contains substring', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'description',
          operator: 'contains',
          value: 'rain',
        };

        const result = evaluateCondition(condition, { description: 'Heavy rain event' });

        expect(result).toBe(true);
      });

      it('should be case insensitive', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'description',
          operator: 'contains',
          value: 'RAIN',
        };

        const result = evaluateCondition(condition, { description: 'Heavy rain event' });

        expect(result).toBe(true);
      });

      it('should return false when value does not contain substring', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'description',
          operator: 'contains',
          value: 'snow',
        };

        const result = evaluateCondition(condition, { description: 'Heavy rain event' });

        expect(result).toBe(false);
      });
    });

    describe('not_contains operator', () => {
      it('should return true when value does not contain substring', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'description',
          operator: 'not_contains',
          value: 'snow',
        };

        const result = evaluateCondition(condition, { description: 'Heavy rain event' });

        expect(result).toBe(true);
      });
    });

    describe('greater_than operator', () => {
      it('should return true when field value is greater', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'rainfall',
          operator: 'greater_than',
          value: 0.25,
        };

        const result = evaluateCondition(condition, { rainfall: 0.5 });

        expect(result).toBe(true);
      });

      it('should return false when field value is equal (EPA 0.25 inch threshold test)', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'rainfall',
          operator: 'greater_than',
          value: 0.25,
        };

        const result = evaluateCondition(condition, { rainfall: 0.25 });

        expect(result).toBe(false);
      });

      it('should return false when field value is less', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'rainfall',
          operator: 'greater_than',
          value: 0.25,
        };

        const result = evaluateCondition(condition, { rainfall: 0.1 });

        expect(result).toBe(false);
      });
    });

    describe('greater_than_or_equals operator', () => {
      it('should return true when field value equals threshold (EPA CGP 0.25 inch)', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'rainfall',
          operator: 'greater_than_or_equals',
          value: 0.25,
        };

        const result = evaluateCondition(condition, { rainfall: 0.25 });

        expect(result).toBe(true);
      });

      it('should return true when field value exceeds threshold', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'rainfall',
          operator: 'greater_than_or_equals',
          value: 0.25,
        };

        const result = evaluateCondition(condition, { rainfall: 0.5 });

        expect(result).toBe(true);
      });

      it('should return false when field value is below threshold', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'rainfall',
          operator: 'greater_than_or_equals',
          value: 0.25,
        };

        const result = evaluateCondition(condition, { rainfall: 0.24 });

        expect(result).toBe(false);
      });
    });

    describe('less_than operator', () => {
      it('should return true when field value is less', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'temperature',
          operator: 'less_than',
          value: 32,
        };

        const result = evaluateCondition(condition, { temperature: 25 });

        expect(result).toBe(true);
      });
    });

    describe('less_than_or_equals operator', () => {
      it('should return true when field value is equal', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'temperature',
          operator: 'less_than_or_equals',
          value: 32,
        };

        const result = evaluateCondition(condition, { temperature: 32 });

        expect(result).toBe(true);
      });
    });

    describe('is_empty operator', () => {
      it('should return true for undefined value', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'notes',
          operator: 'is_empty',
          value: '',
        };

        const result = evaluateCondition(condition, {});

        expect(result).toBe(true);
      });

      it('should return true for null value', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'notes',
          operator: 'is_empty',
          value: '',
        };

        const result = evaluateCondition(condition, { notes: null });

        expect(result).toBe(true);
      });

      it('should return true for empty string', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'notes',
          operator: 'is_empty',
          value: '',
        };

        const result = evaluateCondition(condition, { notes: '' });

        expect(result).toBe(true);
      });

      it('should return false for non-empty value', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'notes',
          operator: 'is_empty',
          value: '',
        };

        const result = evaluateCondition(condition, { notes: 'Some notes' });

        expect(result).toBe(false);
      });
    });

    describe('is_not_empty operator', () => {
      it('should return true for non-empty value', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'notes',
          operator: 'is_not_empty',
          value: '',
        };

        const result = evaluateCondition(condition, { notes: 'Some notes' });

        expect(result).toBe(true);
      });

      it('should return false for empty value', () => {
        const condition: Condition = {
          id: 'c1',
          fieldId: 'notes',
          operator: 'is_not_empty',
          value: '',
        };

        const result = evaluateCondition(condition, { notes: '' });

        expect(result).toBe(false);
      });
    });
  });

  describe('evaluateConditionalRule', () => {
    it('should return true for rule with no conditions', () => {
      const rule: ConditionalRule = {
        id: 'r1',
        targetFieldId: 'field1',
        action: 'show',
        logic: 'AND',
        conditions: [],
      };

      const result = evaluateConditionalRule(rule, {});

      expect(result).toBe(true);
    });

    describe('AND logic', () => {
      it('should return true when all conditions are met', () => {
        const rule: ConditionalRule = {
          id: 'r1',
          targetFieldId: 'field1',
          action: 'show',
          logic: 'AND',
          conditions: [
            { id: 'c1', fieldId: 'rainfall', operator: 'greater_than_or_equals', value: 0.25 },
            { id: 'c2', fieldId: 'status', operator: 'equals', value: 'active' },
          ],
        };

        const result = evaluateConditionalRule(rule, { rainfall: 0.5, status: 'active' });

        expect(result).toBe(true);
      });

      it('should return false when any condition is not met', () => {
        const rule: ConditionalRule = {
          id: 'r1',
          targetFieldId: 'field1',
          action: 'show',
          logic: 'AND',
          conditions: [
            { id: 'c1', fieldId: 'rainfall', operator: 'greater_than_or_equals', value: 0.25 },
            { id: 'c2', fieldId: 'status', operator: 'equals', value: 'active' },
          ],
        };

        const result = evaluateConditionalRule(rule, { rainfall: 0.5, status: 'inactive' });

        expect(result).toBe(false);
      });
    });

    describe('OR logic', () => {
      it('should return true when any condition is met', () => {
        const rule: ConditionalRule = {
          id: 'r1',
          targetFieldId: 'field1',
          action: 'show',
          logic: 'OR',
          conditions: [
            { id: 'c1', fieldId: 'rainfall', operator: 'greater_than_or_equals', value: 0.25 },
            { id: 'c2', fieldId: 'urgency', operator: 'equals', value: 'high' },
          ],
        };

        const result = evaluateConditionalRule(rule, { rainfall: 0.1, urgency: 'high' });

        expect(result).toBe(true);
      });

      it('should return false when no conditions are met', () => {
        const rule: ConditionalRule = {
          id: 'r1',
          targetFieldId: 'field1',
          action: 'show',
          logic: 'OR',
          conditions: [
            { id: 'c1', fieldId: 'rainfall', operator: 'greater_than_or_equals', value: 0.25 },
            { id: 'c2', fieldId: 'urgency', operator: 'equals', value: 'high' },
          ],
        };

        const result = evaluateConditionalRule(rule, { rainfall: 0.1, urgency: 'low' });

        expect(result).toBe(false);
      });
    });
  });

  describe('getFieldVisibility', () => {
    const createField = (overrides?: Partial<FieldDefinition>): FieldDefinition =>
      ({
        id: 'field1',
        name: 'field1',
        label: 'Field 1',
        type: 'text',
        order: 0,
        ...overrides,
      }) as FieldDefinition;

    it('should return visible=true for field without conditional', () => {
      const field = createField();

      const result = getFieldVisibility(field.id, [field], {});

      expect(result.visible).toBe(true);
    });

    it('should return required from validation when no conditional', () => {
      const field = createField({ validation: { required: true } });

      const result = getFieldVisibility(field.id, [field], {});

      expect(result.required).toBe(true);
    });

    it('should handle show action when condition is met', () => {
      const field = createField({
        conditional: {
          id: 'cond1',
          operator: 'AND',
          conditions: [{ field: 'trigger', operator: 'equals', value: 'yes' }],
          actions: [{ type: 'show', target: 'field1' }],
        },
      });

      const result = getFieldVisibility(field.id, [field], { trigger: 'yes' });

      expect(result.visible).toBe(true);
    });

    it('should handle hide action when condition is met', () => {
      const field = createField({
        conditional: {
          id: 'cond1',
          operator: 'AND',
          conditions: [{ field: 'trigger', operator: 'equals', value: 'yes' }],
          actions: [{ type: 'hide', target: 'field1' }],
        },
      });

      const result = getFieldVisibility(field.id, [field], { trigger: 'yes' });

      expect(result.visible).toBe(false);
    });

    it('should handle require action when condition is met', () => {
      const field = createField({
        conditional: {
          id: 'cond1',
          operator: 'AND',
          conditions: [{ field: 'hasIssues', operator: 'equals', value: 'yes' }],
          actions: [{ type: 'require', target: 'field1' }],
        },
      });

      const result = getFieldVisibility(field.id, [field], { hasIssues: 'yes' });

      expect(result.required).toBe(true);
    });

    it('should keep field not required when require action condition is NOT met', () => {
      const field = createField({
        conditional: {
          id: 'cond1',
          operator: 'AND',
          conditions: [{ field: 'mode', operator: 'equals', value: 'detailed' }],
          actions: [{ type: 'require', target: 'field1' }],
        },
      });

      // Condition not met (mode is 'quick', not 'detailed'), so require action doesn't apply
      const result = getFieldVisibility(field.id, [field], { mode: 'quick' });

      expect(result.required).toBe(false);
    });

    it('should return default visibility when field not found', () => {
      const result = getFieldVisibility('nonexistent', [], {});

      expect(result.visible).toBe(true);
      expect(result.required).toBe(false);
    });
  });

  describe('detectCircularDependencies', () => {
    const createField = (
      id: string,
      conditional?: FieldDefinition['conditional']
    ): FieldDefinition =>
      ({
        id,
        name: id,
        label: id,
        type: 'text',
        order: 0,
        conditional,
      }) as FieldDefinition;

    it('should return no errors for fields without circular dependencies', () => {
      const fieldA = createField('fieldA');
      const fieldB = createField('fieldB', {
        id: 'cond1',
        operator: 'AND',
        conditions: [{ field: 'fieldA', operator: 'equals', value: 'yes' }],
        actions: [{ type: 'show', target: 'fieldB' }],
      });

      const newRules: ConditionalRule[] = [];

      const errors = detectCircularDependencies([fieldA, fieldB], 'fieldC', newRules);

      expect(errors).toHaveLength(0);
    });

    it('should detect direct circular dependency', () => {
      const fieldA = createField('fieldA', {
        id: 'cond1',
        operator: 'AND',
        conditions: [{ field: 'fieldB', operator: 'equals', value: 'yes' }],
        actions: [{ type: 'show', target: 'fieldA' }],
      });

      const fieldB = createField('fieldB');

      // Field B will depend on Field A - creating a cycle
      const newRules: ConditionalRule[] = [
        {
          id: 'rule1',
          targetFieldId: 'fieldB',
          action: 'show',
          logic: 'AND',
          conditions: [{ id: 'c1', fieldId: 'fieldA', operator: 'equals', value: 'yes' }],
        },
      ];

      const errors = detectCircularDependencies([fieldA, fieldB], 'fieldB', newRules);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should detect self-referencing circular dependency', () => {
      const fieldA = createField('fieldA');

      const newRules: ConditionalRule[] = [
        {
          id: 'rule1',
          targetFieldId: 'fieldA',
          action: 'show',
          logic: 'AND',
          conditions: [{ id: 'c1', fieldId: 'fieldA', operator: 'equals', value: 'yes' }],
        },
      ];

      const errors = detectCircularDependencies([fieldA], 'fieldA', newRules);

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('EPA CGP 0.25 Inch Threshold Validation', () => {
  it('should trigger inspection exactly at 0.25 inches', () => {
    const condition: Condition = {
      id: 'epa-trigger',
      fieldId: 'rainfall_24h',
      operator: 'greater_than_or_equals',
      value: 0.25,
    };

    // Exactly 0.25 inches - should trigger
    expect(evaluateCondition(condition, { rainfall_24h: 0.25 })).toBe(true);

    // Above threshold - should trigger
    expect(evaluateCondition(condition, { rainfall_24h: 0.5 })).toBe(true);

    // Below threshold - should NOT trigger
    expect(evaluateCondition(condition, { rainfall_24h: 0.24 })).toBe(false);
    expect(evaluateCondition(condition, { rainfall_24h: 0.1 })).toBe(false);
  });
});
