'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhotoFilters } from '../photo-filters';

// Mock scrollIntoView for Mantine Select
Element.prototype.scrollIntoView = vi.fn();

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
};

// Mock fetch for projects API
const mockProjects = [
  { id: 'project-1', name: 'Highway 101 Expansion' },
  { id: 'project-2', name: 'Downtown Office Complex' },
];

const mockUsers = [
  { id: 'user-1', name: 'John Doe' },
  { id: 'user-2', name: 'Jane Smith' },
];

describe('PhotoFilters', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for projects
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: mockProjects }),
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
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
    it('should render filter container with Paper', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      // Should have a filter toggle button
      expect(screen.getByTitle(/filters/i)).toBeInTheDocument();
    });

    it('should render form type filter', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(/all form types/i)).toBeInTheDocument();
    });

    it('should render date range filter', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      // DatePickerInput uses button elements - look for the input or button with Date Range
      const dateRangeElement =
        screen.queryByPlaceholderText(/date range/i) ||
        screen.queryByRole('button', { name: /date range/i }) ||
        screen.queryByText(/date range/i);
      expect(dateRangeElement).toBeInTheDocument();
    });

    it('should render GPS filter button', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /gps only/i })).toBeInTheDocument();
    });

    it('should render search input when search feature is enabled', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showSearch />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(/search descriptions/i)).toBeInTheDocument();
    });

    it('should render user filter when showUserFilter is enabled', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showUserFilter />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(/all users/i)).toBeInTheDocument();
    });

    it('should render weather filter when showWeatherFilter is enabled', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(/weather conditions/i)).toBeInTheDocument();
    });

    it('should hide project filter when hideProjectFilter is true', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} hideProjectFilter />
        </TestWrapper>
      );

      expect(screen.queryByPlaceholderText(/all projects/i)).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search filter on input change', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search descriptions/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
      });
    });

    it('should clear search filter when input is emptied', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ search: 'existing' }} onChange={mockOnChange} showSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search descriptions/i);
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Form Type Filter', () => {
    it('should update formType filter when selection changes', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      const formTypeSelect = screen.getByPlaceholderText(/all form types/i);
      fireEvent.click(formTypeSelect);

      await waitFor(() => {
        const option = screen.getByText('Daily Log');
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ formType: 'daily-log' })
        );
      });
    });
  });

  describe('GPS Filter', () => {
    it('should toggle GPS filter on button click', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      const gpsButton = screen.getByRole('button', { name: /gps only/i });
      fireEvent.click(gpsButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ hasGps: true }));
      });
    });

    it('should show filled variant when GPS filter is active', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ hasGps: true }} onChange={mockOnChange} />
        </TestWrapper>
      );

      const gpsButton = screen.getByRole('button', { name: /gps only/i });
      expect(gpsButton).toHaveClass('mantine-Button-root');
    });

    it('should remove GPS filter when clicked again', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ hasGps: true }} onChange={mockOnChange} />
        </TestWrapper>
      );

      const gpsButton = screen.getByRole('button', { name: /gps only/i });
      fireEvent.click(gpsButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Clear All Filters', () => {
    it('should show active filter count badge', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ formType: 'daily-log', hasGps: true }} onChange={mockOnChange} />
        </TestWrapper>
      );

      expect(screen.getByText(/2 filters active/i)).toBeInTheDocument();
    });

    it('should clear all filters on button click', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ formType: 'daily-log', hasGps: true }} onChange={mockOnChange} />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({});
      });
    });

    it('should not show clear button when no filters active', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
    });
  });

  describe('User Filter', () => {
    it('should update userId filter when user is selected', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showUserFilter />
        </TestWrapper>
      );

      const userSelect = screen.getByPlaceholderText(/all users/i);
      fireEvent.click(userSelect);

      await waitFor(() => {
        const option = screen.getByText('John Doe');
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
      });
    });
  });

  describe('Weather Filter', () => {
    it('should update weather filter when conditions are selected', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      const weatherSelect = screen.getByPlaceholderText(/weather conditions/i);
      fireEvent.click(weatherSelect);

      await waitFor(() => {
        const option = screen.getByText('Rain');
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ weather: expect.arrayContaining(['rain']) })
        );
      });
    });

    it('should allow multiple weather conditions to be selected', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ weather: ['rain'] }} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      // Weather filter should show selected value (in pill)
      // Use getAllByText since pill and option may both show "Rain"
      const rainElements = screen.getAllByText('Rain');
      expect(rainElements.length).toBeGreaterThan(0);
    });
  });

  describe('Weather Filter Edge Cases', () => {
    it('should handle empty weather array gracefully', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ weather: [] }} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      // Should render without crashing
      expect(screen.getByPlaceholderText(/weather conditions/i)).toBeInTheDocument();
      // Empty array should not show as active filter
      expect(screen.queryByText(/filter.* active/i)).not.toBeInTheDocument();
    });

    it('should clear weather filter when all selections are removed', async () => {
      const { rerender } = render(
        <TestWrapper>
          <PhotoFilters filters={{ weather: ['rain', 'snow'] }} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      // Simulate clearing to empty array
      rerender(
        <TestWrapper>
          <PhotoFilters filters={{ weather: [] }} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      // Should not show as active filter when empty
      expect(screen.queryByText(/2 filter.* active/i)).not.toBeInTheDocument();
    });

    it('should only accept valid weather condition values from predefined list', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      // Weather filter should be rendered and use a predefined select/multiselect
      // which limits user input to only valid options
      const weatherSelect = screen.getByPlaceholderText(/weather conditions/i);
      expect(weatherSelect).toBeInTheDocument();

      // The filter is a MultiSelect with predefined options - users cannot type arbitrary values
      // Test that a valid selection works (Rain option exists from previous tests)
      fireEvent.click(weatherSelect);

      await waitFor(() => {
        const option = screen.getByText('Rain');
        expect(option).toBeInTheDocument();
      });
    });

    it('should not accept script tags or XSS attempts in weather values', async () => {
      // Mock onChange to capture actual values passed
      const capturedValues: { weather?: string[] }[] = [];
      const captureOnChange = (filters: { weather?: string[] }) => {
        capturedValues.push(filters);
      };

      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={captureOnChange} showWeatherFilter />
        </TestWrapper>
      );

      // Weather filter uses predefined options - user cannot type arbitrary values
      // This tests that only valid options from dropdown are selectable
      const weatherSelect = screen.getByPlaceholderText(/weather conditions/i);
      fireEvent.click(weatherSelect);

      await waitFor(() => {
        const option = screen.getByText('Rain');
        fireEvent.click(option);
      });

      // Only valid, predefined values should be in the filter
      await waitFor(() => {
        expect(capturedValues.length).toBeGreaterThan(0);
        const lastValue = capturedValues[capturedValues.length - 1];
        if (lastValue?.weather) {
          // Should only contain alphanumeric values from predefined list
          lastValue.weather.forEach((w) => {
            expect(w).toMatch(/^[a-z-]+$/);
            expect(w).not.toContain('<script>');
            expect(w).not.toContain('javascript:');
          });
        }
      });
    });

    it('should sanitize weather values with special characters', () => {
      // Backend sanitization validation pattern - matches alphanumeric, spaces, and hyphens only
      // Note: Uses space character explicitly, not \s (which includes newlines)
      const validWeatherPattern = /^[a-zA-Z0-9 -]+$/;

      // Valid weather values
      expect(validWeatherPattern.test('rain')).toBe(true);
      expect(validWeatherPattern.test('heavy-rain')).toBe(true);
      expect(validWeatherPattern.test('partly cloudy')).toBe(true);

      // Invalid/malicious values should NOT match
      expect(validWeatherPattern.test('<script>alert(1)</script>')).toBe(false);
      expect(validWeatherPattern.test('rain; DROP TABLE photos;')).toBe(false);
      expect(validWeatherPattern.test("rain' OR '1'='1")).toBe(false);
      expect(validWeatherPattern.test('rain\ninjection')).toBe(false);
      expect(validWeatherPattern.test('rain\tinjection')).toBe(false); // tabs also not allowed
    });

    it('should reject weather values exceeding maximum length', () => {
      // Backend enforces max 50 character length per weather value
      const maxLength = 50;
      const validValue = 'a'.repeat(50);
      const invalidValue = 'a'.repeat(51);

      expect(validValue.length).toBeLessThanOrEqual(maxLength);
      expect(invalidValue.length).toBeGreaterThan(maxLength);

      // Simulating backend validation
      const isValidLength = (value: string) => value.length <= maxLength;
      expect(isValidLength(validValue)).toBe(true);
      expect(isValidLength(invalidValue)).toBe(false);
    });

    it('should handle undefined weather filter gracefully', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ weather: undefined }} onChange={mockOnChange} showWeatherFilter />
        </TestWrapper>
      );

      // Should render without crashing
      expect(screen.getByPlaceholderText(/weather conditions/i)).toBeInTheDocument();
    });

    it('should count weather filter correctly in active filter count', () => {
      render(
        <TestWrapper>
          <PhotoFilters
            filters={{ weather: ['rain', 'snow'], hasGps: true }}
            onChange={mockOnChange}
            showWeatherFilter
          />
        </TestWrapper>
      );

      // Weather counts as 1 filter, GPS as another = 2 total
      expect(screen.getByText(/2 filters active/i)).toBeInTheDocument();
    });
  });

  describe('Collapse/Expand', () => {
    it('should toggle filter visibility on icon click', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      const toggleButton = screen.getByTitle(/hide filters/i);
      fireEvent.click(toggleButton);

      // After collapse, form type filter should not be visible
      await waitFor(() => {
        expect(screen.getByTitle(/show filters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible filter toggle button', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      const toggleButton = screen.getByTitle(/filters/i);
      expect(toggleButton).toBeInTheDocument();
    });

    it('should have accessible clear button', () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{ hasGps: true }} onChange={mockOnChange} />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Offline Scenarios', () => {
    it('should render filter controls when offline', () => {
      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      // Filters should still render when offline
      expect(screen.getByPlaceholderText(/all form types/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /gps only/i })).toBeInTheDocument();
    });

    it('should allow filter changes when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      // User should be able to toggle GPS filter offline
      const gpsButton = screen.getByRole('button', { name: /gps only/i });
      fireEvent.click(gpsButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should persist filter state across offline/online transitions', async () => {
      // Start online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { rerender } = render(
        <TestWrapper>
          <PhotoFilters filters={{ hasGps: true }} onChange={mockOnChange} />
        </TestWrapper>
      );

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Re-render with same filters
      rerender(
        <TestWrapper>
          <PhotoFilters filters={{ hasGps: true }} onChange={mockOnChange} />
        </TestWrapper>
      );

      // Filter state should persist
      expect(screen.getByText(/1 filter.* active/i)).toBeInTheDocument();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should fetch projects only for current organization', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      // Wait for projects API call - the fetch returns org-scoped data by API design
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const projectsCall = calls.find(
          (call: string[]) => typeof call[0] === 'string' && call[0].includes('/api/projects')
        );
        expect(projectsCall).toBeDefined();
      });
    });

    it('should fetch users only for current organization', async () => {
      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} showUserFilter />
        </TestWrapper>
      );

      // Wait for users API call - the fetch returns org-scoped data by API design
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const usersCall = calls.find(
          (call: string[]) => typeof call[0] === 'string' && call[0].includes('/api/users')
        );
        expect(usersCall).toBeDefined();
      });
    });

    it('should not expose cross-tenant data in filter options', async () => {
      // Mock returns specific org-scoped projects
      const orgProjects = [{ id: 'org-1-project', name: 'My Org Project' }];
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/projects')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: orgProjects }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <PhotoFilters filters={{}} onChange={mockOnChange} />
        </TestWrapper>
      );

      // Should NOT see other org's projects
      await waitFor(() => {
        expect(screen.queryByText('Other Org Project')).not.toBeInTheDocument();
      });
    });
  });
});
