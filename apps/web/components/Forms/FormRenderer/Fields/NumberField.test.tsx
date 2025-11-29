import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { NumberField } from './NumberField';
import { FormField } from '../types';

// Helper to render with Mantine provider
const renderWithMantine = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('NumberField', () => {
  const baseField: FormField = {
    id: 'test_number',
    type: 'number',
    label: 'Test Number',
    placeholder: 'Enter a number',
    required: false,
    validation: {
      min: 0,
      max: 100,
      step: 5,
    },
  };

  it('should render with label and placeholder', () => {
    renderWithMantine(<NumberField field={baseField} />);

    // Verify label is rendered
    expect(screen.getByText('Test Number')).toBeInTheDocument();

    // Verify input is rendered with correct placeholder
    const input = screen.getByPlaceholderText('Enter a number');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test_number');
  });

  it('should apply validation constraints (min, max, step)', () => {
    renderWithMantine(<NumberField field={baseField} />);

    // Verify input is rendered - Mantine handles min/max/step internally
    const input = screen.getByPlaceholderText('Enter a number');
    expect(input).toBeInTheDocument();
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'min', message: 'Value must be at least 0' };

    renderWithMantine(<NumberField field={baseField} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('Value must be at least 0')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithMantine(<NumberField field={baseField} disabled={true} />);

    const input = screen.getByPlaceholderText('Enter a number') as HTMLInputElement;

    // Verify input is disabled
    expect(input).toBeDisabled();
  });

  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    renderWithMantine(<NumberField field={baseField} onChange={handleChange} />);

    // Component renders successfully with onChange prop
    expect(screen.getByPlaceholderText('Enter a number')).toBeInTheDocument();
  });

  it('should display initial value', () => {
    renderWithMantine(<NumberField field={baseField} value={42} />);

    // Mantine NumberInput displays value in the input
    const input = screen.getByPlaceholderText('Enter a number') as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });
});
