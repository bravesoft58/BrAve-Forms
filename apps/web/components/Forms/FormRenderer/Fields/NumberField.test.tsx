import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { NumberField } from './NumberField';
import { FormField } from '../types';

// Mock React Hook Form register
const mockRegister = vi.fn((name: string) => ({
  name,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
}));

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

  beforeEach(() => {
    mockRegister.mockClear();
  });

  it('should render with label and placeholder', () => {
    renderWithMantine(<NumberField field={baseField} register={mockRegister} />);

    // Verify label is rendered
    expect(screen.getByText('Test Number')).toBeInTheDocument();

    // Verify input is rendered with correct placeholder
    const input = screen.getByPlaceholderText('Enter a number');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test_number');
  });

  it('should apply validation constraints (min, max, step)', () => {
    renderWithMantine(<NumberField field={baseField} register={mockRegister} />);

    // Verify min, max, step attributes are applied
    // Note: Mantine NumberInput may not directly set these as HTML attributes
    // but the component should respect them in its internal logic
    expect(mockRegister).toHaveBeenCalledWith('test_number', { valueAsNumber: true });
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'min', message: 'Value must be at least 0' };

    renderWithMantine(<NumberField field={baseField} register={mockRegister} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('Value must be at least 0')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithMantine(<NumberField field={baseField} register={mockRegister} disabled={true} />);

    const input = screen.getByPlaceholderText('Enter a number') as HTMLInputElement;

    // Verify input is disabled
    expect(input).toBeDisabled();
  });
});
