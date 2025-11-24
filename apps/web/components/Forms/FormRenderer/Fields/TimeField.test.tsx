import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { TimeField } from './TimeField';
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

describe('TimeField', () => {
  const baseField: FormField = {
    id: 'test_time',
    type: 'time',
    label: 'Test Time',
    required: false,
  };

  beforeEach(() => {
    mockRegister.mockClear();
  });

  it('should render with label', () => {
    renderWithMantine(<TimeField field={baseField} register={mockRegister} />);

    // Verify label is rendered
    expect(screen.getByText('Test Time')).toBeInTheDocument();

    // Verify time input is rendered
    const input = document.querySelector('#test_time') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.type).toBe('time');
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'Time is required' };

    renderWithMantine(<TimeField field={baseField} register={mockRegister} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('Time is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithMantine(<TimeField field={baseField} register={mockRegister} disabled={true} />);

    const input = document.querySelector('#test_time') as HTMLInputElement;

    // Verify input is disabled
    expect(input).toBeDisabled();
  });
});
