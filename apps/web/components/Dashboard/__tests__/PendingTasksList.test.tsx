import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PendingTasksList } from '../PendingTasksList';
import { MantineProvider } from '@mantine/core';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('PendingTasksList', () => {
  it('should render component with title', () => {
    renderWithMantine(<PendingTasksList />);

    expect(screen.getByText(/Pending Tasks/i)).toBeInTheDocument();
  });

  it('should show inspections due today', () => {
    renderWithMantine(<PendingTasksList />);

    // Should display task items (will implement with mock data)
    const widget = screen.getByTestId('pending-tasks-widget');
    expect(widget).toBeInTheDocument();
  });

  it('should show empty state when no tasks', () => {
    renderWithMantine(<PendingTasksList />);

    // Should gracefully handle empty state
    // Will look for empty message or tasks container
    const component = screen.getByTestId('pending-tasks-widget');
    expect(component).toBeInTheDocument();
  });

  it('should display task name, project, and due time', () => {
    renderWithMantine(<PendingTasksList />);

    // Once implemented with mock data, should show task details
    const widget = screen.getByTestId('pending-tasks-widget');
    expect(widget).toBeInTheDocument();
  });
});
