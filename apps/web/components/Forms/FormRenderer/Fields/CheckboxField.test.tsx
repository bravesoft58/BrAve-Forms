import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import type { UseFormRegister } from 'react-hook-form';
import { CheckboxField } from './CheckboxField';
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

describe('CheckboxField', () => {
  const baseField: FormField = {
    id: 'test_checkbox',
    type: 'checkbox',
    label: 'Test Checkbox',
    placeholder: 'Agree to terms',
    required: false,
  };

  beforeEach(() => {
    mockRegisterFn.mockClear();
  });

  it('should render with label', () => {
    renderWithMantine(<CheckboxField field={baseField} register={mockRegister} />);

    // Verify field label wrapper is rendered
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument();

    // Verify checkbox label is rendered
    expect(screen.getByText('Agree to terms')).toBeInTheDocument();

    // Verify checkbox is rendered
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('id', 'test_checkbox');
  });

  it('should accept user interaction', async () => {
    const user = userEvent.setup();

    renderWithMantine(<CheckboxField field={baseField} register={mockRegister} />);

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    // Initially unchecked
    expect(checkbox.checked).toBe(false);

    // Click to check
    await user.click(checkbox);

    // Verify register was called with correct field ID
    expect(mockRegister).toHaveBeenCalledWith('test_checkbox');
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'This field is required' };

    renderWithMantine(<CheckboxField field={baseField} register={mockRegister} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithMantine(<CheckboxField field={baseField} register={mockRegister} disabled={true} />);

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    // Verify checkbox is disabled
    expect(checkbox).toBeDisabled();
  });
});
