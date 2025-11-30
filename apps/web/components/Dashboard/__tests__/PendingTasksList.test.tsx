import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PendingTasksList } from '../PendingTasksList';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the useDashboard hook
vi.mock('@/hooks/useDashboard', () => ({
  usePendingTasks: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: createWrapper() });
};

describe('PendingTasksList', () => {
  it('should render component with title', () => {
    renderWithProviders(<PendingTasksList />);

    expect(screen.getByText(/Pending Tasks/i)).toBeInTheDocument();
  });

  it('should show inspections due today', () => {
    renderWithProviders(<PendingTasksList />);

    // Should display task items (will implement with mock data)
    const widget = screen.getByTestId('pending-tasks-widget');
    expect(widget).toBeInTheDocument();
  });

  it('should show empty state when no tasks', () => {
    renderWithProviders(<PendingTasksList />);

    // Should gracefully handle empty state
    // Will look for empty message or tasks container
    const component = screen.getByTestId('pending-tasks-widget');
    expect(component).toBeInTheDocument();
  });

  it('should display task name, project, and due time', () => {
    renderWithProviders(<PendingTasksList />);

    // Once implemented with mock data, should show task details
    const widget = screen.getByTestId('pending-tasks-widget');
    expect(widget).toBeInTheDocument();
  });
});
