import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useForm, FormProvider } from 'react-hook-form';
import { GpsField } from './GpsField';
import { FormField } from '../types';
import * as geolocation from '@/lib/geolocation';

// Mock the geolocation module
vi.mock('@/lib/geolocation', () => ({
  isGeolocationAvailable: vi.fn(() => true),
  getCurrentPosition: vi.fn(),
  isGeolocationError: vi.fn((result) => 'code' in result && !('latitude' in result)),
  formatCoordinates: vi.fn(
    (coords) => `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
  ),
  formatAccuracy: vi.fn((meters) => {
    if (meters < 10) return 'Excellent';
    if (meters < 30) return 'Good';
    if (meters < 100) return 'Fair';
    return 'Poor';
  }),
  getAccuracyColor: vi.fn((meters) => {
    if (meters < 10) return 'green';
    if (meters < 30) return 'blue';
    if (meters < 100) return 'yellow';
    return 'red';
  }),
}));

describe('GpsField', () => {
  const baseField: FormField = {
    id: 'test_gps',
    type: 'gps',
    label: 'Test GPS Location',
    required: false,
  };

  const mockCoordinates: geolocation.GPSCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: 50,
    timestamp: '2025-11-27T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (geolocation.isGeolocationAvailable as any).mockReturnValue(true);
  });

  it('renders capture button when no coordinates captured', () => {
    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('Test GPS Location')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capture gps location/i })).toBeInTheDocument();
  });

  it('shows GPS unavailable alert when geolocation not available', () => {
    (geolocation.isGeolocationAvailable as any).mockReturnValue(false);

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText(/gps is not available/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /capture/i })).not.toBeInTheDocument();
  });

  it('shows required indicator when field is required', () => {
    const requiredField = { ...baseField, required: true };

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={requiredField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('captures GPS coordinates when button clicked', async () => {
    (geolocation.getCurrentPosition as any).mockResolvedValue(mockCoordinates);
    (geolocation.isGeolocationError as any).mockReturnValue(false);

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    const captureButton = screen.getByRole('button', { name: /capture gps location/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(true, 30000);
    });
  });

  it('displays captured coordinates with accuracy badge', async () => {
    (geolocation.getCurrentPosition as any).mockResolvedValue(mockCoordinates);
    (geolocation.isGeolocationError as any).mockReturnValue(false);
    (geolocation.formatCoordinates as any).mockReturnValue('37.774900, -122.419400');
    (geolocation.formatAccuracy as any).mockReturnValue('Excellent');
    (geolocation.getAccuracyColor as any).mockReturnValue('green');

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    // Click capture button
    const captureButton = screen.getByRole('button', { name: /capture gps location/i });
    fireEvent.click(captureButton);

    // Wait for coordinates to be displayed
    await waitFor(() => {
      expect(screen.getByText('37.774900, -122.419400')).toBeInTheDocument();
    });

    // Check accuracy badge
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText(/accuracy: 10m/i)).toBeInTheDocument();
  });

  it('shows error message when GPS capture fails', async () => {
    const errorResult: geolocation.GeolocationError = {
      code: 'PERMISSION_DENIED',
      message: 'Location permission denied. Please enable location access.',
    };

    (geolocation.getCurrentPosition as any).mockResolvedValue(errorResult);
    (geolocation.isGeolocationError as any).mockReturnValue(true);

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    const captureButton = screen.getByRole('button', { name: /capture gps location/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByText(/location permission denied/i)).toBeInTheDocument();
    });
  });

  it('shows Update Location button after coordinates captured', async () => {
    (geolocation.getCurrentPosition as any).mockResolvedValue(mockCoordinates);
    (geolocation.isGeolocationError as any).mockReturnValue(false);

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    // Click initial capture button
    const captureButton = screen.getByRole('button', { name: /capture gps location/i });
    fireEvent.click(captureButton);

    // Wait for update button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update location/i })).toBeInTheDocument();
    });
  });

  it('hides update button when disabled', async () => {
    (geolocation.getCurrentPosition as any).mockResolvedValue(mockCoordinates);
    (geolocation.isGeolocationError as any).mockReturnValue(false);

    const TestComponent = () => {
      const methods = useForm({ defaultValues: { test_gps: mockCoordinates } });
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} disabled />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    // Should show coordinates but not update button
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /update location/i })).not.toBeInTheDocument();
    });
  });

  it('displays altitude when available', async () => {
    (geolocation.getCurrentPosition as any).mockResolvedValue(mockCoordinates);
    (geolocation.isGeolocationError as any).mockReturnValue(false);

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    const captureButton = screen.getByRole('button', { name: /capture gps location/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByText(/altitude: 50m/i)).toBeInTheDocument();
    });
  });

  it('displays validation error message', () => {
    const error = { type: 'required', message: 'GPS location is required' };

    const TestComponent = () => {
      const methods = useForm();
      return (
        <MantineProvider>
          <FormProvider {...methods}>
            <GpsField field={baseField} control={methods.control} error={error as any} />
          </FormProvider>
        </MantineProvider>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('GPS location is required')).toBeInTheDocument();
  });
});
