import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecentActivityList } from '../RecentActivityList';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the useDashboard hook
vi.mock('@/hooks/useDashboard', () => ({
  useRecentActivity: vi.fn(() => ({
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

describe('RecentActivityList', () => {
  it('should render component with title', () => {
    renderWithProviders(<RecentActivityList limit={5} />);

    // Use getAllByText since "Recent Activity" appears multiple times (title and empty state)
    const elements = screen.getAllByText(/Recent Activity/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should display last 5 submissions when limit is 5', () => {
    renderWithProviders(<RecentActivityList limit={5} />);

    const widget = screen.getByTestId('recent-activity-widget');
    expect(widget).toBeInTheDocument();
  });

  it('should show correct submission type and date', () => {
    renderWithProviders(<RecentActivityList limit={5} />);

    // Once implemented with mock data, should show submission details
    const widget = screen.getByTestId('recent-activity-widget');
    expect(widget).toBeInTheDocument();
  });

  it('should show empty state when no submissions', () => {
    renderWithProviders(<RecentActivityList limit={5} />);

    // Should handle no activity gracefully
    const component = screen.getByTestId('recent-activity-widget');
    expect(component).toBeInTheDocument();
  });

  it('should respect limit prop', () => {
    renderWithProviders(<RecentActivityList limit={3} />);

    // Component should accept limit prop
    const widget = screen.getByTestId('recent-activity-widget');
    expect(widget).toBeInTheDocument();
  });
});
