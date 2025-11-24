import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { FormRenderer } from './FormRenderer';
import { FormTemplate } from './types';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('FormRenderer', () => {
  const mockTemplate: FormTemplate = {
    id: 'template_1',
    title: 'Test Form',
    description: 'A test form',
    version: 1,
    fields: [
      {
        id: 'field_name',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter your name',
        required: true,
      },
      {
        id: 'field_email',
        type: 'text',
        label: 'Email',
        placeholder: 'Enter your email',
        required: false,
      },
    ],
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form title and description', () => {
    renderWithMantine(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('A test form')).toBeInTheDocument();
  });

  it('should render all text fields', () => {
    renderWithMantine(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('should mark required fields with asterisk', () => {
    renderWithMantine(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    const nameLabel = screen.getByText(/Name/i);
    expect(nameLabel.parentElement?.textContent).toContain('*');
  });

  it('should submit form with valid data', async () => {
    renderWithMantine(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    // Fill form
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, {
      target: { value: 'John Doe' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    // Wait for submission
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'template_1',
          values: expect.objectContaining({
            field_name: 'John Doe',
          }),
        })
      );
    });
  });

  it('should show validation error for required field', async () => {
    renderWithMantine(<FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} />);

    // Submit without filling required field
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should render in read-only mode', () => {
    renderWithMantine(
      <FormRenderer template={mockTemplate} onSubmit={mockOnSubmit} readOnly={true} />
    );

    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
  });

  it('should show/hide fields based on conditional logic', async () => {
    const user = userEvent.setup();

    const conditionalTemplate: FormTemplate = {
      id: 'template_conditional',
      title: 'Conditional Form',
      description: 'Form with conditional fields',
      version: 1,
      fields: [
        {
          id: 'field_trigger',
          type: 'select',
          label: 'Show Details?',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          required: true,
        },
        {
          id: 'field_details',
          type: 'text',
          label: 'Details Field',
          required: false,
          conditional: {
            showIf: {
              field: 'field_trigger',
              operator: 'equals',
              value: 'yes',
            },
          },
        },
      ],
    };

    const { container } = renderWithMantine(
      <FormRenderer template={conditionalTemplate} onSubmit={mockOnSubmit} />
    );

    // Details field should be hidden initially (not in DOM)
    expect(container.querySelector('#field_details')).toBeNull();

    // Select "Yes" in trigger field using userEvent
    const triggerSelect = container.querySelector('#field_trigger') as HTMLInputElement;
    expect(triggerSelect).not.toBeNull();

    await user.click(triggerSelect);
    const yesOption = await screen.findByText('Yes');
    await user.click(yesOption);

    // Details field should now be visible
    await waitFor(
      () => {
        const detailsField = container.querySelector('#field_details');
        expect(detailsField).not.toBeNull();
      },
      { timeout: 3000 }
    );

    // Select "No" in trigger field
    await user.click(triggerSelect);
    const noOption = await screen.findByText('No');
    await user.click(noOption);

    // Details field should be hidden again (not in DOM)
    await waitFor(
      () => {
        expect(container.querySelector('#field_details')).toBeNull();
      },
      { timeout: 3000 }
    );
  });

  it('should compute values based on formula', async () => {
    const computedTemplate: FormTemplate = {
      id: 'template_computed',
      title: 'Computed Form',
      description: 'Form with computed fields',
      version: 1,
      fields: [
        {
          id: 'field_text1',
          type: 'text',
          label: 'Text Field 1',
          required: false,
        },
        {
          id: 'field_text2',
          type: 'text',
          label: 'Text Field 2',
          required: false,
        },
        {
          id: 'field_computed',
          type: 'computed',
          label: 'Computed Field',
          required: false,
          computedValue: '{{currentDate}}',
        },
      ],
    };

    const { container } = renderWithMantine(
      <FormRenderer template={computedTemplate} onSubmit={mockOnSubmit} />
    );

    // Verify computed field is rendered
    const computedField = container.querySelector('#field_computed') as HTMLInputElement;
    expect(computedField).not.toBeNull();

    // Computed field should have a value (currentDate template variable)
    await waitFor(
      () => {
        expect(computedField.value).toBeTruthy();
        // Verify it looks like a date (YYYY-MM-DD format)
        expect(computedField.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      },
      { timeout: 1000 }
    );
  });
});
