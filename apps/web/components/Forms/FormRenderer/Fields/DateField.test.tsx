import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import type { UseFormRegister } from 'react-hook-form';
import { DateField } from './DateField';
import { FormField } from '../types';

// Mock React Hook Form register - keep reference for mockClear
const mockRegisterFn = vi.fn((name: string) => ({
  name,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
}));
const mockRegister = mockRegisterFn as unknown as UseFormRegister<Record<string, unknown>>;

// Helper to render with Mantine provider
const renderWithMantine = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('DateField', () => {
  const baseField: FormField = {
    id: 'test_date',
    type: 'date',
    label: 'Test Date',
    required: false,
  };

  beforeEach(() => {
    mockRegisterFn.mockClear();
  });

  it('should render with label', () => {
    renderWithMantine(<DateField field={baseField} register={mockRegister} />);

    // Verify label is rendered
    expect(screen.getByText('Test Date')).toBeInTheDocument();

    // Verify date input is rendered
    const input = document.querySelector('#test_date') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.type).toBe('date');
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'Date is required' };

    renderWithMantine(<DateField field={baseField} register={mockRegister} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('Date is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithMantine(<DateField field={baseField} register={mockRegister} disabled={true} />);

    const input = document.querySelector('#test_date') as HTMLInputElement;

    // Verify input is disabled
    expect(input).toBeDisabled();
  });
});
