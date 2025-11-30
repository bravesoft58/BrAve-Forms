import { describe, it, expect } from 'vitest';
import { evaluateCalculatedField, evaluateAllCalculatedFields } from '../CalculatedFieldEditor';
import type { FieldDefinition } from '@brave-forms/types';

describe('CalculatedFieldEditor - Evaluation Functions', () => {
  const createField = (overrides?: Partial<FieldDefinition>): FieldDefinition =>
    ({
      id: 'field1',
      name: 'field1',
      label: 'Field 1',
      type: 'number',
      order: 0,
      ...overrides,
    }) as FieldDefinition;

  describe('evaluateCalculatedField', () => {
    describe('Basic Arithmetic', () => {
      it('should evaluate addition', () => {
        const field = createField({
          id: 'total',
          name: 'total',
          metadata: { calculation: '{price} + {tax}' },
        });
        const allFields = [
          createField({ id: 'price', name: 'price' }),
          createField({ id: 'tax', name: 'tax' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { price: 100, tax: 10 }, allFields);

        expect(result).toBe(110);
      });

      it('should evaluate subtraction', () => {
        const field = createField({
          id: 'difference',
          name: 'difference',
          metadata: { calculation: '{total} - {discount}' },
        });
        const allFields = [
          createField({ id: 'total', name: 'total' }),
          createField({ id: 'discount', name: 'discount' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { total: 100, discount: 20 }, allFields);

        expect(result).toBe(80);
      });

      it('should evaluate multiplication', () => {
        const field = createField({
          id: 'total',
          name: 'total',
          metadata: { calculation: '{quantity} * {unitPrice}' },
        });
        const allFields = [
          createField({ id: 'quantity', name: 'quantity' }),
          createField({ id: 'unitPrice', name: 'unitPrice' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { quantity: 5, unitPrice: 25 }, allFields);

        expect(result).toBe(125);
      });

      it('should evaluate division', () => {
        const field = createField({
          id: 'average',
          name: 'average',
          metadata: { calculation: '{total} / {count}' },
        });
        const allFields = [
          createField({ id: 'total', name: 'total' }),
          createField({ id: 'count', name: 'count' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { total: 100, count: 4 }, allFields);

        expect(result).toBe(25);
      });

      it('should handle division by zero', () => {
        const field = createField({
          id: 'ratio',
          name: 'ratio',
          metadata: { calculation: '{numerator} / {denominator}' },
        });
        const allFields = [
          createField({ id: 'numerator', name: 'numerator' }),
          createField({ id: 'denominator', name: 'denominator' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { numerator: 10, denominator: 0 }, allFields);

        // Infinity is not finite, so should return null
        expect(result).toBe(null);
      });

      it('should evaluate complex expressions with parentheses', () => {
        const field = createField({
          id: 'result',
          name: 'result',
          metadata: { calculation: '({a} + {b}) * {c}' },
        });
        const allFields = [
          createField({ id: 'a', name: 'a' }),
          createField({ id: 'b', name: 'b' }),
          createField({ id: 'c', name: 'c' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { a: 2, b: 3, c: 4 }, allFields);

        expect(result).toBe(20);
      });
    });

    describe('Built-in Functions', () => {
      it('should evaluate SUM function', () => {
        const field = createField({
          id: 'total',
          name: 'total',
          metadata: { calculation: 'SUM({a}, {b}, {c})' },
        });
        const allFields = [
          createField({ id: 'a', name: 'a' }),
          createField({ id: 'b', name: 'b' }),
          createField({ id: 'c', name: 'c' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { a: 10, b: 20, c: 30 }, allFields);

        expect(result).toBe(60);
      });

      it('should evaluate AVG function', () => {
        const field = createField({
          id: 'average',
          name: 'average',
          metadata: { calculation: 'AVG({x}, {y}, {z})' },
        });
        const allFields = [
          createField({ id: 'x', name: 'x' }),
          createField({ id: 'y', name: 'y' }),
          createField({ id: 'z', name: 'z' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { x: 10, y: 20, z: 30 }, allFields);

        expect(result).toBe(20);
      });

      it('should evaluate MIN function', () => {
        const field = createField({
          id: 'minimum',
          name: 'minimum',
          metadata: { calculation: 'MIN({a}, {b}, {c})' },
        });
        const allFields = [
          createField({ id: 'a', name: 'a' }),
          createField({ id: 'b', name: 'b' }),
          createField({ id: 'c', name: 'c' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { a: 15, b: 5, c: 25 }, allFields);

        expect(result).toBe(5);
      });

      it('should evaluate MAX function', () => {
        const field = createField({
          id: 'maximum',
          name: 'maximum',
          metadata: { calculation: 'MAX({a}, {b}, {c})' },
        });
        const allFields = [
          createField({ id: 'a', name: 'a' }),
          createField({ id: 'b', name: 'b' }),
          createField({ id: 'c', name: 'c' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { a: 15, b: 5, c: 25 }, allFields);

        expect(result).toBe(25);
      });

      it('should evaluate ROUND function', () => {
        const field = createField({
          id: 'rounded',
          name: 'rounded',
          metadata: { calculation: 'ROUND({value}, 2)' },
        });
        const allFields = [createField({ id: 'value', name: 'value' }), field];

        const result = evaluateCalculatedField(field, { value: 3.14159 }, allFields);

        expect(result).toBe(3.14);
      });

      it('should evaluate ABS function', () => {
        const field = createField({
          id: 'absolute',
          name: 'absolute',
          metadata: { calculation: 'ABS({value})' },
        });
        const allFields = [createField({ id: 'value', name: 'value' }), field];

        const result = evaluateCalculatedField(field, { value: -42 }, allFields);

        expect(result).toBe(42);
      });

      it('should evaluate IF function - true condition', () => {
        const field = createField({
          id: 'result',
          name: 'result',
          metadata: { calculation: 'IF({score} > 50, 100, 0)' },
        });
        const allFields = [createField({ id: 'score', name: 'score' }), field];

        const result = evaluateCalculatedField(field, { score: 75 }, allFields);

        expect(result).toBe(100);
      });

      it('should evaluate IF function - false condition', () => {
        const field = createField({
          id: 'result',
          name: 'result',
          metadata: { calculation: 'IF({score} > 50, 100, 0)' },
        });
        const allFields = [createField({ id: 'score', name: 'score' }), field];

        const result = evaluateCalculatedField(field, { score: 25 }, allFields);

        expect(result).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should return null for field without calculation', () => {
        const field = createField({ id: 'plain', name: 'plain' });

        const result = evaluateCalculatedField(field, {}, [field]);

        expect(result).toBe(null);
      });

      it('should return null for empty formula', () => {
        const field = createField({
          id: 'empty',
          name: 'empty',
          metadata: { calculation: '' },
        });

        const result = evaluateCalculatedField(field, {}, [field]);

        expect(result).toBe(null);
      });

      it('should handle string values that can be parsed as numbers', () => {
        const field = createField({
          id: 'total',
          name: 'total',
          metadata: { calculation: '{a} + {b}' },
        });
        const allFields = [
          createField({ id: 'a', name: 'a' }),
          createField({ id: 'b', name: 'b' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { a: '10', b: '20' }, allFields);

        expect(result).toBe(30);
      });

      it('should return null for invalid formula with unclosed parenthesis', () => {
        const field = createField({
          id: 'invalid',
          name: 'invalid',
          metadata: { calculation: '({a} + {b}' },
        });
        const allFields = [
          createField({ id: 'a', name: 'a' }),
          createField({ id: 'b', name: 'b' }),
          field,
        ];

        const result = evaluateCalculatedField(field, { a: 10, b: 20 }, allFields);

        expect(result).toBe(null);
      });
    });
  });

  describe('evaluateAllCalculatedFields', () => {
    it('should evaluate multiple calculated fields', () => {
      const fieldA = createField({ id: 'a', name: 'a', type: 'number' });
      const fieldB = createField({ id: 'b', name: 'b', type: 'number' });
      const sumField = createField({
        id: 'sum',
        name: 'sum',
        metadata: { calculation: '{a} + {b}' },
      });
      const doubleField = createField({
        id: 'double',
        name: 'double',
        metadata: { calculation: '{a} * 2' },
      });

      const fields = [fieldA, fieldB, sumField, doubleField];
      const formValues = { a: 10, b: 20 };

      const results = evaluateAllCalculatedFields(fields, formValues);

      expect(results['sum']).toBe(30);
      expect(results['double']).toBe(20);
    });

    it('should handle chained calculations (dependent fields)', () => {
      const fieldA = createField({ id: 'a', name: 'a', type: 'number' });
      const fieldB = createField({ id: 'b', name: 'b', type: 'number' });
      const sumField = createField({
        id: 'sum',
        name: 'sum',
        metadata: { calculation: '{a} + {b}' },
      });
      // doubleSum depends on sum
      const doubleSumField = createField({
        id: 'doubleSum',
        name: 'doubleSum',
        metadata: { calculation: '{sum} * 2' },
      });

      const fields = [fieldA, fieldB, sumField, doubleSumField];
      const formValues = { a: 10, b: 20 };

      const results = evaluateAllCalculatedFields(fields, formValues);

      expect(results['sum']).toBe(30);
      expect(results['doubleSum']).toBe(60);
    });

    it('should return empty object when no calculated fields exist', () => {
      const fieldA = createField({ id: 'a', name: 'a', type: 'number' });
      const fieldB = createField({ id: 'b', name: 'b', type: 'text' });

      const fields = [fieldA, fieldB];
      const formValues = { a: 10, b: 'test' };

      const results = evaluateAllCalculatedFields(fields, formValues);

      expect(Object.keys(results)).toHaveLength(0);
    });
  });

  describe('EPA Compliance - Calculated Field Scenarios', () => {
    it('should calculate total rainfall accumulation', () => {
      const reading1 = createField({ id: 'reading1', name: 'reading1', type: 'number' });
      const reading2 = createField({ id: 'reading2', name: 'reading2', type: 'number' });
      const reading3 = createField({ id: 'reading3', name: 'reading3', type: 'number' });
      const totalField = createField({
        id: 'totalRainfall',
        name: 'totalRainfall',
        metadata: { calculation: 'SUM({reading1}, {reading2}, {reading3})' },
      });

      const fields = [reading1, reading2, reading3, totalField];
      const formValues = { reading1: 0.1, reading2: 0.1, reading3: 0.08 };

      const result = evaluateCalculatedField(totalField, formValues, fields);

      // 0.28 inches total (exceeds 0.25 threshold)
      expect(result).toBeCloseTo(0.28, 2);
    });

    it('should calculate inspection compliance percentage', () => {
      const completedField = createField({ id: 'completed', name: 'completed', type: 'number' });
      const requiredField = createField({ id: 'required', name: 'required', type: 'number' });
      const percentageField = createField({
        id: 'compliancePercent',
        name: 'compliancePercent',
        metadata: { calculation: 'ROUND(({completed} / {required}) * 100, 1)' },
      });

      const fields = [completedField, requiredField, percentageField];
      const formValues = { completed: 45, required: 52 };

      const result = evaluateCalculatedField(percentageField, formValues, fields);

      expect(result).toBeCloseTo(86.5, 1);
    });

    it('should calculate cost estimate', () => {
      const laborHours = createField({ id: 'laborHours', name: 'laborHours', type: 'number' });
      const hourlyRate = createField({ id: 'hourlyRate', name: 'hourlyRate', type: 'number' });
      const materialsCost = createField({
        id: 'materialsCost',
        name: 'materialsCost',
        type: 'number',
      });
      const totalCostField = createField({
        id: 'totalCost',
        name: 'totalCost',
        metadata: { calculation: '({laborHours} * {hourlyRate}) + {materialsCost}' },
      });

      const fields = [laborHours, hourlyRate, materialsCost, totalCostField];
      const formValues = { laborHours: 40, hourlyRate: 75, materialsCost: 1500 };

      const result = evaluateCalculatedField(totalCostField, formValues, fields);

      expect(result).toBe(4500);
    });
  });
});
