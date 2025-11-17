import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
      <FormRenderer
        template={mockTemplate}
        onSubmit={mockOnSubmit}
        readOnly={true}
      />
    );

    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument();
  });
});

