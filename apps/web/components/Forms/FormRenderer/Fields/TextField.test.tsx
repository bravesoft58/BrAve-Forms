import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import type { UseFormRegister } from 'react-hook-form';
import { TextField } from './TextField';
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

describe('TextField', () => {
  const baseField: FormField = {
    id: 'test_field',
    type: 'text',
    label: 'Test Field',
    placeholder: 'Enter text here',
    required: false,
  };

  beforeEach(() => {
    mockRegisterFn.mockClear();
  });

  it('should render with label and placeholder', () => {
    renderWithMantine(<TextField field={baseField} register={mockRegister} />);

    // Verify label is rendered
    expect(screen.getByText('Test Field')).toBeInTheDocument();

    // Verify input is rendered with correct placeholder
    const input = screen.getByPlaceholderText('Enter text here');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test_field');
  });

  it('should accept user input and update value', async () => {
    const user = userEvent.setup();

    renderWithMantine(<TextField field={baseField} register={mockRegister} />);

    const input = screen.getByPlaceholderText('Enter text here') as HTMLInputElement;

    // Type into the input
    await user.type(input, 'Hello World');

    // Verify input value updated
    await waitFor(() => {
      expect(input.value).toBe('Hello World');
    });

    // Verify register was called with correct field ID
    expect(mockRegister).toHaveBeenCalledWith('test_field');
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'This field is required' };

    renderWithMantine(<TextField field={baseField} register={mockRegister} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithMantine(<TextField field={baseField} register={mockRegister} disabled={true} />);

    const input = screen.getByPlaceholderText('Enter text here') as HTMLInputElement;

    // Verify input is disabled
    expect(input).toBeDisabled();
  });
});
