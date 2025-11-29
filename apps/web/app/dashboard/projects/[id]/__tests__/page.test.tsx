import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectDetailPage from '../page';

// Mock useParams - will be configured per test
const mockUseParams = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    // Default to project id '1'
    mockUseParams.mockReturnValue({ id: '1' });
  });

  it('should render project header with name and address', () => {
    render(<ProjectDetailPage />);

    expect(screen.getByText('Mill Street Construction')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Reno NV')).toBeInTheDocument();
  });

  it('should render all 5 tabs', () => {
    render(<ProjectDetailPage />);

    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('should switch tabs on click', () => {
    render(<ProjectDetailPage />);

    const photosTab = screen.getByText('Photos');
    fireEvent.click(photosTab);

    expect(screen.getByTestId('photos-tab-content')).toBeInTheDocument();
  });

  it('should show breadcrumbs with correct hierarchy', () => {
    render(<ProjectDetailPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Mill Street Construction')).toBeInTheDocument();
  });

  it('should render Edit Project button', () => {
    render(<ProjectDetailPage />);

    expect(screen.getByText('Edit Project')).toBeInTheDocument();
  });

  it('should show not found message for invalid project ID', () => {
    mockUseParams.mockReturnValue({ id: '999' });
    render(<ProjectDetailPage />);

    expect(screen.getByText('Project Not Found')).toBeInTheDocument();
  });
});
