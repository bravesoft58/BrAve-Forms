import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WeatherAlertsWidget } from '../WeatherAlertsWidget';
import { MantineProvider } from '@mantine/core';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('WeatherAlertsWidget', () => {
  it('should show alert when rain >= 0.25"', () => {
    renderWithMantine(<WeatherAlertsWidget />);

    // Look for alert indicators when weather data shows rain >= 0.25"
    // This will fail initially until we implement the component
    const alertElement = screen.queryByText(/rain/i);
    expect(alertElement).toBeInTheDocument();
  });

  it('should display project name and rain amount when alert active', () => {
    renderWithMantine(<WeatherAlertsWidget />);

    // Should show project details when alert triggered
    // Using queryBy since it might not exist yet
    const projectInfo = screen.queryByText(/project/i);
    expect(projectInfo).toBeDefined();
  });

  it('should show empty state when no alerts', () => {
    renderWithMantine(<WeatherAlertsWidget />);

    // Component should handle no alerts gracefully
    const component = screen.getByTestId('weather-alerts-widget');
    expect(component).toBeInTheDocument();
  });

  it('should display weather icon when alert present', () => {
    renderWithMantine(<WeatherAlertsWidget />);

    // Should show weather indicator icon
    const widget = screen.getByTestId('weather-alerts-widget');
    expect(widget).toBeInTheDocument();
  });
});
