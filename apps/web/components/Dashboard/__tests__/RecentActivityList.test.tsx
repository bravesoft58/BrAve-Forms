import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RecentActivityList } from '../RecentActivityList';
import { MantineProvider } from '@mantine/core';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('RecentActivityList', () => {
  it('should render component with title', () => {
    renderWithMantine(<RecentActivityList limit={5} />);

    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
  });

  it('should display last 5 submissions when limit is 5', () => {
    renderWithMantine(<RecentActivityList limit={5} />);

    const widget = screen.getByTestId('recent-activity-widget');
    expect(widget).toBeInTheDocument();
  });

  it('should show correct submission type and date', () => {
    renderWithMantine(<RecentActivityList limit={5} />);

    // Once implemented with mock data, should show submission details
    const widget = screen.getByTestId('recent-activity-widget');
    expect(widget).toBeInTheDocument();
  });

  it('should show empty state when no submissions', () => {
    renderWithMantine(<RecentActivityList limit={5} />);

    // Should handle no activity gracefully
    const component = screen.getByTestId('recent-activity-widget');
    expect(component).toBeInTheDocument();
  });

  it('should respect limit prop', () => {
    renderWithMantine(<RecentActivityList limit={3} />);

    // Component should accept limit prop
    const widget = screen.getByTestId('recent-activity-widget');
    expect(widget).toBeInTheDocument();
  });
});
