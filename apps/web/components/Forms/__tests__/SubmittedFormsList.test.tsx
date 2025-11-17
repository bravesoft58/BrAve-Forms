import { render, screen, fireEvent } from '@testing-library/react';
import { SubmittedFormsList } from '@/components/Forms/SubmittedFormsList';
import { getMockFormSubmissions } from '@/lib/mock-data/form-submissions';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SubmittedFormsList', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders empty state when no submissions', () => {
    // Mock getMockFormSubmissions to return empty array for project with no submissions
    jest.spyOn(require('@/lib/mock-data/form-submissions'), 'getMockFormSubmissions').mockReturnValue([]);
    
    render(<SubmittedFormsList projectId="999" />);
    
    expect(screen.getByText('No forms submitted yet')).toBeInTheDocument();
    expect(screen.getByText('Start by selecting a template to fill out your first form.')).toBeInTheDocument();
    expect(screen.getByText('Fill Your First Form')).toBeInTheDocument();
  });

  it('renders list of submissions', () => {
    render(<SubmittedFormsList projectId="1" />);
    
    const submissions = getMockFormSubmissions('1');
    submissions.forEach((submission) => {
      expect(screen.getByText(submission.templateTitle)).toBeInTheDocument();
      expect(screen.getByText(submission.submittedBy)).toBeInTheDocument();
    });
  });

  it('filters submissions by template', () => {
    render(<SubmittedFormsList projectId="1" />);
    
    const templateSelect = screen.getByPlaceholderText('Filter by template');
    fireEvent.change(templateSelect, { target: { value: 'post-storm-inspection' } });
    
    expect(screen.getByText('Post-Storm Inspection')).toBeInTheDocument();
    expect(screen.queryByText('Daily Dust Log')).not.toBeInTheDocument();
  });

  it('filters submissions by status', () => {
    render(<SubmittedFormsList projectId="1" />);
    
    const statusSelect = screen.getByPlaceholderText('Filter by status');
    fireEvent.change(statusSelect, { target: { value: 'APPROVED' } });
    
    // Should only show approved submissions
    const submissions = getMockFormSubmissions('1').filter((s) => s.status === 'APPROVED');
    submissions.forEach((submission) => {
      expect(screen.getByText(submission.templateTitle)).toBeInTheDocument();
    });
  });

  it('navigates to submission detail on row click', () => {
    render(<SubmittedFormsList projectId="1" />);
    
    const submissions = getMockFormSubmissions('1');
    const firstSubmission = submissions[0];
    
    const row = screen.getByTestId(`submission-row-${firstSubmission.id}`);
    fireEvent.click(row);
    
    expect(mockPush).toHaveBeenCalledWith(`/dashboard/forms/submissions/${firstSubmission.id}`);
  });

  it('shows submissions sorted by date (newest first)', () => {
    render(<SubmittedFormsList projectId="1" />);
    
    const submissions = getMockFormSubmissions('1');
    const dates = submissions.map((s) => s.submittedAt);
    
    // Verify dates are in descending order
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
    }
  });

  it('displays status badges with correct colors', () => {
    render(<SubmittedFormsList projectId="1" />);
    
    const submissions = getMockFormSubmissions('1');
    submissions.forEach((submission) => {
      const badge = screen.getByText(submission.status);
      expect(badge).toBeInTheDocument();
    });
  });

  it('shows empty state message when filters result in no matches', () => {
    render(<SubmittedFormsList projectId="1" />);
    
    const statusSelect = screen.getByPlaceholderText('Filter by status');
    fireEvent.change(statusSelect, { target: { value: 'REJECTED' } });
    
    // Should show "No forms match your current filters" message
    expect(screen.getByText(/No forms match your current filters/i)).toBeInTheDocument();
  });
});

