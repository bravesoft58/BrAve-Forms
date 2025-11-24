import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { SelectField } from './SelectField';
import { FormField } from '../types';

// Helper to render with form context and Mantine provider
const TestWrapper = ({
  disabled = false,
  error,
}: {
  disabled?: boolean;
  error?: { type: string; message: string };
}) => {
  const { control } = useForm();
  const field: FormField = {
    id: 'test_select',
    type: 'select',
    label: 'Test Select',
    required: false,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  };

  return (
    <MantineProvider>
      <SelectField field={field} control={control} disabled={disabled} error={error} />
    </MantineProvider>
  );
};

describe('SelectField', () => {
  it('should render with label and options', () => {
    render(<TestWrapper>{null}</TestWrapper>);

    // Verify label is rendered
    expect(screen.getByText('Test Select')).toBeInTheDocument();

    // Verify select input is rendered
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should display placeholder text', () => {
    render(<TestWrapper>{null}</TestWrapper>);

    // Verify placeholder is displayed
    expect(screen.getByPlaceholderText('Select an option')).toBeInTheDocument();
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'Selection is required' };

    render(<TestWrapper error={error}>{null}</TestWrapper>);

    // Verify error message is displayed
    expect(screen.getByText('Selection is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<TestWrapper disabled={true}>{null}</TestWrapper>);

    const input = screen.getByRole('textbox');

    // Verify input is disabled
    expect(input).toBeDisabled();
  });
});
