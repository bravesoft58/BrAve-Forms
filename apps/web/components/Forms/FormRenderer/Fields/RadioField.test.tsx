import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { RadioField } from './RadioField';
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
    id: 'test_radio',
    type: 'radio',
    label: 'Test Radio Group',
    required: false,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  };

  return (
    <MantineProvider>
      <RadioField field={field} control={control} disabled={disabled} error={error} />
    </MantineProvider>
  );
};

describe('RadioField', () => {
  it('should render with label and radio options', () => {
    render(<TestWrapper />);

    // Verify label is rendered
    expect(screen.getByText('Test Radio Group')).toBeInTheDocument();

    // Verify all radio options are rendered
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();

    // Verify radio buttons are rendered
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'Selection is required' };

    render(<TestWrapper error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('Selection is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<TestWrapper disabled={true} />);

    const radios = screen.getAllByRole('radio');

    // Verify all radio buttons are disabled
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });
});
