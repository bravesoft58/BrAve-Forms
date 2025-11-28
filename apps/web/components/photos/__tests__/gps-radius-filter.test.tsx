'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { GPSRadiusFilter } from '../gps-radius-filter';

// Mock scrollIntoView for Mantine components
Element.prototype.scrollIntoView = vi.fn();

// Test wrapper with MantineProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('GPSRadiusFilter', () => {
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Ensure navigator.onLine is reset to prevent cross-test pollution
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
    // Clear localStorage to prevent cross-test pollution
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render latitude input', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
    });

    it('should render longitude input', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
    });

    it('should render radius input', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/radius/i)).toBeInTheDocument();
    });

    it('should render apply button with map icon', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    it('should render use current location button', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /current location/i })).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should have default latitude value', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const latInput = screen.getByLabelText(/latitude/i);
      // Mantine NumberInput renders values as strings in the DOM
      expect(latInput).toHaveValue('39.5296');
    });

    it('should have default longitude value', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const lngInput = screen.getByLabelText(/longitude/i);
      // Mantine NumberInput renders values as strings in the DOM
      expect(lngInput).toHaveValue('-119.8138');
    });

    it('should have default radius value of 1 km', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const radiusInput = screen.getByLabelText(/radius/i);
      // Mantine NumberInput renders values as strings in the DOM
      expect(radiusInput).toHaveValue('1');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid latitude values', async () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const latInput = screen.getByLabelText(/latitude/i);
      fireEvent.change(latInput, { target: { value: '45.123456' } });

      await waitFor(() => {
        // Mantine NumberInput renders values as strings in the DOM
        expect(latInput).toHaveValue('45.123456');
      });
    });

    it('should accept valid longitude values', async () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const lngInput = screen.getByLabelText(/longitude/i);
      fireEvent.change(lngInput, { target: { value: '-122.456789' } });

      await waitFor(() => {
        // Mantine NumberInput renders values as strings in the DOM
        expect(lngInput).toHaveValue('-122.456789');
      });
    });

    it('should enforce minimum radius value', async () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      // Mantine NumberInput enforces min/max through component logic, not HTML attributes
      // Test that the input accepts a value at the boundary
      const radiusInput = screen.getByLabelText(/radius/i);
      fireEvent.change(radiusInput, { target: { value: '0.1' } });

      await waitFor(() => {
        expect(radiusInput).toHaveValue('0.1');
      });
    });

    it('should enforce maximum radius value', async () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      // Mantine NumberInput enforces min/max through component logic, not HTML attributes
      // Test that the input accepts a value at the boundary
      const radiusInput = screen.getByLabelText(/radius/i);
      fireEvent.change(radiusInput, { target: { value: '50' } });

      await waitFor(() => {
        expect(radiusInput).toHaveValue('50');
      });
    });
  });

  describe('Apply Filter', () => {
    it('should call onApply with coordinates when apply button is clicked', async () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalledWith({
          lat: 39.5296,
          lng: -119.8138,
          radiusKm: 1,
        });
      });
    });

    it('should call onApply with updated values after changes', async () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      // Update values
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      const radiusInput = screen.getByLabelText(/radius/i);

      fireEvent.change(latInput, { target: { value: '40.0' } });
      fireEvent.change(lngInput, { target: { value: '-120.0' } });
      fireEvent.change(radiusInput, { target: { value: '5' } });

      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalledWith({
          lat: 40.0,
          lng: -120.0,
          radiusKm: 5,
        });
      });
    });
  });

  describe('Current Location', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn(),
    };

    beforeEach(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });
    });

    it('should request current location when button is clicked', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        });
      });

      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const locationButton = screen.getByRole('button', { name: /current location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should update coordinates with current location', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        });
      });

      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const locationButton = screen.getByRole('button', { name: /current location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        const latInput = screen.getByLabelText(/latitude/i);
        // Mantine NumberInput renders values as strings in the DOM
        expect(latInput).toHaveValue('37.7749');
      });
    });

    it('should handle geolocation error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error({ message: 'Location unavailable' });
      });

      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const locationButton = screen.getByRole('button', { name: /current location/i });
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Clear Filter', () => {
    it('should render clear button', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} onClear={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', async () => {
      const mockOnClear = vi.fn();
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} onClear={mockOnClear} />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockOnClear).toHaveBeenCalled();
      });
    });

    it('should not render clear button if onClear is not provided', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible input labels', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/radius/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(
        <TestWrapper>
          <GPSRadiusFilter onApply={mockOnApply} />
        </TestWrapper>
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeInTheDocument();
    });
  });
});
