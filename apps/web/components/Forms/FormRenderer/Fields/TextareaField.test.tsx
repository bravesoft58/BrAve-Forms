import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import type { UseFormRegister } from 'react-hook-form';
import { TextareaField } from './TextareaField';
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

describe('TextareaField', () => {
  const baseField: FormField = {
    id: 'test_textarea',
    type: 'textarea',
    label: 'Test Textarea',
    placeholder: 'Enter description here',
    required: false,
  };

  beforeEach(() => {
    mockRegisterFn.mockClear();
  });

  it('should render with label and placeholder', () => {
    renderWithMantine(<TextareaField field={baseField} register={mockRegister} />);

    // Verify label is rendered
    expect(screen.getByText('Test Textarea')).toBeInTheDocument();

    // Verify textarea is rendered with correct placeholder
    const textarea = screen.getByPlaceholderText('Enter description here');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('id', 'test_textarea');
  });

  it('should accept user input and update value', async () => {
    const user = userEvent.setup();

    renderWithMantine(<TextareaField field={baseField} register={mockRegister} />);

    const textarea = screen.getByPlaceholderText('Enter description here') as HTMLTextAreaElement;

    // Type into the textarea
    await user.type(textarea, 'This is a multi-line\ndescription');

    // Verify textarea value updated
    await waitFor(() => {
      expect(textarea.value).toContain('This is a multi-line');
      expect(textarea.value).toContain('description');
    });

    // Verify register was called with correct field ID
    expect(mockRegister).toHaveBeenCalledWith('test_textarea');
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'Description is required' };

    renderWithMantine(<TextareaField field={baseField} register={mockRegister} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithMantine(<TextareaField field={baseField} register={mockRegister} disabled={true} />);

    const textarea = screen.getByPlaceholderText('Enter description here') as HTMLTextAreaElement;

    // Verify textarea is disabled
    expect(textarea).toBeDisabled();
  });
});
