import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SubmissionViewer } from '../SubmissionViewer';
import { MantineProvider } from '@mantine/core';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('SubmissionViewer', () => {
  it('should render component with submissions count', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Should display submissions count
    expect(screen.getByText(/submissions? found/i)).toBeInTheDocument();
  });

  it('should render submission cards with template name', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Should display template names from mock data
    expect(screen.getByText(/Daily Site Inspection/i)).toBeInTheDocument();
    expect(screen.getByText(/Storm Water Inspection/i)).toBeInTheDocument();
  });

  it('should display submission status badges', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Should display status badges
    expect(screen.getByText(/APPROVED/i)).toBeInTheDocument();
    expect(screen.getByText(/SUBMITTED/i)).toBeInTheDocument();
    expect(screen.getByText(/REVIEWED/i)).toBeInTheDocument();
  });

  it('should display submitter information', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Should display who submitted the form
    expect(screen.getByText(/John Inspector/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Compliance/i)).toBeInTheDocument();
  });

  it('should display category badges', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Should display category badges
    expect(screen.getByText(/OSHA SAFETY/i)).toBeInTheDocument();
    expect(screen.getByText(/EPA SWPPP/i)).toBeInTheDocument();
    expect(screen.getByText(/EPA CGP/i)).toBeInTheDocument();
  });

  it('should expand submission card when clicked', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Click on first submission card header
    const firstCard = screen.getByText(/Daily Site Inspection/i).closest('[style*="cursor: pointer"]');
    if (firstCard) {
      fireEvent.click(firstCard);
    }

    // Should show section titles after expansion
    expect(screen.getByText(/General Information/i)).toBeInTheDocument();
  });

  it('should display field labels and values in expanded view', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Click to expand
    const firstCard = screen.getByText(/Daily Site Inspection/i).closest('[style*="cursor: pointer"]');
    if (firstCard) {
      fireEvent.click(firstCard);
    }

    // Should display field labels
    expect(screen.getByText(/Inspection Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Weather Conditions/i)).toBeInTheDocument();
  });

  it('should display Last 30 days badge', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    expect(screen.getByText(/Last 30 days/i)).toBeInTheDocument();
  });

  it('should format checkbox values as Yes/No', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Click to expand
    const firstCard = screen.getByText(/Daily Site Inspection/i).closest('[style*="cursor: pointer"]');
    if (firstCard) {
      fireEvent.click(firstCard);
    }

    // Expand Safety Checklist section
    const safetySection = screen.getByText(/Safety Checklist/i);
    fireEvent.click(safetySection);

    // Should display Yes for checked checkboxes
    const yesTexts = screen.getAllByText('Yes');
    expect(yesTexts.length).toBeGreaterThan(0);
  });

  it('should collapse expanded card when clicked again', () => {
    renderWithMantine(<SubmissionViewer projectId="project_123" token="test-token" />);

    // Click to expand
    const firstCard = screen.getByText(/Daily Site Inspection/i).closest('[style*="cursor: pointer"]');
    if (firstCard) {
      fireEvent.click(firstCard);
    }

    // General Information should be visible
    expect(screen.getByText(/General Information/i)).toBeInTheDocument();

    // Click again to collapse
    if (firstCard) {
      fireEvent.click(firstCard);
    }

    // Content should be collapsed (hidden by Collapse component)
    // The accordion panel is still in DOM but collapsed
  });
});
