import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { ComputedField } from './ComputedField';
import { FormField } from '../types';

// Mock React Hook Form setValue
const mockSetValue = vi.fn();

// Helper to render with Mantine provider
const renderWithMantine = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('ComputedField', () => {
  const baseField: FormField = {
    id: 'test_computed',
    type: 'computed',
    label: 'Test Computed Field',
    required: false,
    computedValue: 'field1 + field2',
  };

  beforeEach(() => {
    mockSetValue.mockClear();
  });

  it('should render with label and formula help text', () => {
    renderWithMantine(
      <ComputedField field={baseField} setValue={mockSetValue} computedValue={42} />
    );

    // Verify label is rendered
    expect(screen.getByText('Test Computed Field')).toBeInTheDocument();

    // Verify formula help text is rendered
    expect(screen.getByText('Formula: field1 + field2')).toBeInTheDocument();

    // Verify computed value is displayed
    const input = document.querySelector('#test_computed') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('42');
  });

  it('should display computed value and be disabled', () => {
    renderWithMantine(
      <ComputedField field={baseField} setValue={mockSetValue} computedValue={100} />
    );

    const input = document.querySelector('#test_computed') as HTMLInputElement;

    // Verify computed value is displayed
    expect(input.value).toBe('100');

    // Verify input is disabled (computed fields are read-only)
    expect(input).toBeDisabled();
  });

  it('should call setValue when computedValue changes', () => {
    const { rerender } = renderWithMantine(
      <ComputedField field={baseField} setValue={mockSetValue} computedValue={10} />
    );

    // Verify setValue called with initial value
    expect(mockSetValue).toHaveBeenCalledWith('test_computed', 10, { shouldValidate: false });

    // Rerender with new computed value
    rerender(
      <MantineProvider>
        <ComputedField field={baseField} setValue={mockSetValue} computedValue={20} />
      </MantineProvider>
    );

    // Verify setValue called again with new value
    expect(mockSetValue).toHaveBeenCalledWith('test_computed', 20, { shouldValidate: false });
  });

  it('should display monospace font style for computed values', () => {
    renderWithMantine(
      <ComputedField field={baseField} setValue={mockSetValue} computedValue={42} />
    );

    const input = document.querySelector('#test_computed') as HTMLInputElement;

    // Verify monospace font style (check computed styles)
    const styles = window.getComputedStyle(input);
    expect(styles.fontFamily).toContain('monospace');
  });
});
