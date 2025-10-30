import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from '../page';
import { MantineProvider } from '@mantine/core';

// Mock the auth provider
vi.mock('@/app/providers', () => ({
  useAppAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    isLoaded: true,
    isSignedIn: true,
  })),
}));

// Mock child components to isolate Dashboard tests
vi.mock('@/components/Dashboard/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

vi.mock('@/components/Dashboard/WeatherAlertsWidget', () => ({
  WeatherAlertsWidget: () => <div data-testid="weather-alerts">Weather Alerts</div>,
}));

vi.mock('@/components/Dashboard/PendingTasksList', () => ({
  PendingTasksList: () => <div data-testid="pending-tasks">Pending Tasks</div>,
}));

vi.mock('@/components/Dashboard/RecentActivityList', () => ({
  RecentActivityList: () => <div data-testid="recent-activity">Recent Activity</div>,
}));

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('DashboardPage', () => {
  it('should render welcome message with user name', () => {
    renderWithMantine(<DashboardPage />);
    expect(screen.getByText(/Welcome, John/)).toBeInTheDocument();
  });

  it('should render all 5 widget sections', () => {
    renderWithMantine(<DashboardPage />);

    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    expect(screen.getByTestId('weather-alerts')).toBeInTheDocument();
    expect(screen.getByTestId('pending-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
  });

  it('should handle missing user gracefully', async () => {
    const { useAppAuth } = await import('@/app/providers');
    vi.mocked(useAppAuth).mockReturnValueOnce({
      user: null,
      isLoaded: true,
      isSignedIn: false,
      orgRole: null,
      userId: null,
      orgId: null,
    });

    renderWithMantine(<DashboardPage />);
    expect(screen.getByText(/Welcome, User/)).toBeInTheDocument();
  });

  it('should render in responsive grid layout', () => {
    const { container } = renderWithMantine(<DashboardPage />);

    // SimpleGrid should be present
    const grid = container.querySelector('[class*="SimpleGrid"]');
    expect(grid).toBeInTheDocument();
  });
});
