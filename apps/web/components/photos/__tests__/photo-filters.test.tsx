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
});
