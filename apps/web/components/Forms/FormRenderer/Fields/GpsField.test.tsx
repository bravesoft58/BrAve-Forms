import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';
import { GpsField } from './GpsField';
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

describe('GpsField', () => {
  const baseField: FormField = {
    id: 'test_gps',
    type: 'gps',
    label: 'Test GPS Location',
    required: false,
  };

  beforeEach(() => {
    mockRegister.mockClear();
  });

  it('should render with label and help text', () => {
    renderWithMantine(<GpsField field={baseField} register={mockRegister} />);

    // Verify label is rendered
    expect(screen.getByText('Test GPS Location')).toBeInTheDocument();

    // Verify help text is rendered
    expect(
      screen.getByText('Sprint 4: Will auto-capture GPS using Capacitor Geolocation')
    ).toBeInTheDocument();

    // Verify input is rendered with placeholder
    const input = screen.getByPlaceholderText('Lat, Lng (auto-captured)');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test_gps');
  });

  it('should be disabled by default (auto-capture field)', () => {
    renderWithMantine(<GpsField field={baseField} register={mockRegister} />);

    const input = screen.getByPlaceholderText('Lat, Lng (auto-captured)') as HTMLInputElement;

    // Verify input is always disabled (GPS is auto-captured)
    expect(input).toBeDisabled();
  });

  it('should display error message when validation fails', () => {
    const error = { type: 'required', message: 'GPS location is required' };

    renderWithMantine(<GpsField field={baseField} register={mockRegister} error={error} />);

    // Verify error message is displayed
    expect(screen.getByText('GPS location is required')).toBeInTheDocument();
  });
});
