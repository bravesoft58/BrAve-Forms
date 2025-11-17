import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useConditionalLogic } from './useConditionalLogic';
import { FormField } from './types';

describe('useConditionalLogic', () => {
  it('should return visible when no conditional logic', () => {
    const field: FormField = {
      id: 'field1',
      type: 'text',
      label: 'Field 1',
    };

    const { result } = renderHook(() => useConditionalLogic(field, {}));

    expect(result.current.isVisible).toBe(true);
  });

  it('should evaluate equals operator correctly', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'field1',
          operator: 'equals',
          value: 'yes',
        },
      },
    };

    // Field1 value is 'yes' - should be visible
    const { result: result1 } = renderHook(() => useConditionalLogic(field, { field1: 'yes' }));
    expect(result1.current.isVisible).toBe(true);

    // Field1 value is 'no' - should be hidden
    const { result: result2 } = renderHook(() => useConditionalLogic(field, { field1: 'no' }));
    expect(result2.current.isVisible).toBe(false);
  });

  it('should evaluate notEquals operator correctly', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'field1',
          operator: 'notEquals',
          value: 'no',
        },
      },
    };

    const { result } = renderHook(() => useConditionalLogic(field, { field1: 'yes' }));

    expect(result.current.isVisible).toBe(true);
  });

  it('should evaluate greaterThan operator correctly', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'count',
          operator: 'greaterThan',
          value: 5,
        },
      },
    };

    const { result: result1 } = renderHook(() => useConditionalLogic(field, { count: 10 }));
    expect(result1.current.isVisible).toBe(true);

    const { result: result2 } = renderHook(() => useConditionalLogic(field, { count: 3 }));
    expect(result2.current.isVisible).toBe(false);
  });

  it('should evaluate lessThan operator correctly', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'count',
          operator: 'lessThan',
          value: 10,
        },
      },
    };

    const { result: result1 } = renderHook(() => useConditionalLogic(field, { count: 5 }));
    expect(result1.current.isVisible).toBe(true);

    const { result: result2 } = renderHook(() => useConditionalLogic(field, { count: 15 }));
    expect(result2.current.isVisible).toBe(false);
  });

  it('should evaluate contains operator for strings', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'description',
          operator: 'contains',
          value: 'hazard',
        },
      },
    };

    const { result } = renderHook(() =>
      useConditionalLogic(field, { description: 'Contains hazard text' })
    );

    expect(result.current.isVisible).toBe(true);
  });

  it('should evaluate contains operator for arrays', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'selected',
          operator: 'contains',
          value: 'option1',
        },
      },
    };

    const { result } = renderHook(() =>
      useConditionalLogic(field, { selected: ['option1', 'option2'] })
    );

    expect(result.current.isVisible).toBe(true);
  });

  it('should return false for contains when value not found', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'description',
          operator: 'contains',
          value: 'hazard',
        },
      },
    };

    const { result } = renderHook(() =>
      useConditionalLogic(field, { description: 'No issues here' })
    );

    expect(result.current.isVisible).toBe(false);
  });

  it('should handle unknown operator gracefully', () => {
    const field: FormField = {
      id: 'field2',
      type: 'text',
      label: 'Field 2',
      conditional: {
        showIf: {
          field: 'field1',
          operator: 'unknown' as any,
          value: 'yes',
        },
      },
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useConditionalLogic(field, { field1: 'yes' }));

    expect(result.current.isVisible).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Unknown conditional operator: unknown');
    consoleSpy.mockRestore();
  });
});

