import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useComputedFields, evaluateComputedField } from './useComputedFields';
import { FormField } from './types';

describe('useComputedFields', () => {
  it('should calculate SUM formula correctly', () => {
    const field: FormField = {
      id: 'total',
      type: 'computed',
      label: 'Total',
      computedValue: 'SUM(field1, field2, field3)',
    };

    const formValues = {
      field1: 10,
      field2: 20,
      field3: 30,
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(60);
  });

  it('should calculate COUNT formula correctly', () => {
    const field: FormField = {
      id: 'count',
      type: 'computed',
      label: 'Count',
      computedValue: 'COUNT(field1, field2, field3, field4)',
    };

    const formValues = {
      field1: 'value1',
      field2: 'value2',
      field3: '', // Empty - not counted
      field4: null, // Null - not counted
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(2);
  });

  it('should calculate AVERAGE formula correctly', () => {
    const field: FormField = {
      id: 'average',
      type: 'computed',
      label: 'Average',
      computedValue: 'AVERAGE(field1, field2, field3)',
    };

    const formValues = {
      field1: 10,
      field2: 20,
      field3: 30,
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(20);
  });

  it('should replace {{currentDate}} template variable', () => {
    const field: FormField = {
      id: 'date',
      type: 'computed',
      label: 'Date',
      computedValue: '{{currentDate}}',
    };

    const { result } = renderHook(() => useComputedFields(field, {}));

    // Should match YYYY-MM-DD format
    expect(result.current).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should replace {{currentTime}} template variable', () => {
    const field: FormField = {
      id: 'time',
      type: 'computed',
      label: 'Time',
      computedValue: '{{currentTime}}',
    };

    const { result } = renderHook(() => useComputedFields(field, {}));

    // Should match HH:MM format
    expect(result.current).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should replace {{userName}} template variable', () => {
    const field: FormField = {
      id: 'user',
      type: 'computed',
      label: 'User',
      computedValue: 'Completed by {{userName}}',
    };

    const { result } = renderHook(() => useComputedFields(field, {}, 'John Doe'));

    expect(result.current).toBe('Completed by John Doe');
  });

  it('should return undefined when no computedValue', () => {
    const field: FormField = {
      id: 'field1',
      type: 'text',
      label: 'Field 1',
    };

    const { result } = renderHook(() => useComputedFields(field, {}));

    expect(result.current).toBeUndefined();
  });

  it('should handle SUM with missing values', () => {
    const field: FormField = {
      id: 'total',
      type: 'computed',
      label: 'Total',
      computedValue: 'SUM(field1, field2, field3)',
    };

    const formValues = {
      field1: 10,
      // field2 missing
      field3: 30,
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(40);
  });

  it('should handle AVERAGE with zero values', () => {
    const field: FormField = {
      id: 'average',
      type: 'computed',
      label: 'Average',
      computedValue: 'AVERAGE(field1, field2)',
    };

    const formValues = {
      field1: 0,
      field2: 0,
    };

    const { result } = renderHook(() => useComputedFields(field, formValues));

    expect(result.current).toBe(0);
  });
});

