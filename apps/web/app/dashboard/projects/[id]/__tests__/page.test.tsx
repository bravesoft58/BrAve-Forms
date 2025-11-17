import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectDetailPage from '../page';

// Mock useParams
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('ProjectDetailPage', () => {
  it('should render project header with name and address', () => {
    render(<ProjectDetailPage params={{ id: '1' }} />);

    expect(screen.getByText('Mill Street Construction')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Reno NV')).toBeInTheDocument();
  });

  it('should render all 5 tabs', () => {
    render(<ProjectDetailPage params={{ id: '1' }} />);

    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('should switch tabs on click', () => {
    render(<ProjectDetailPage params={{ id: '1' }} />);

    const photosTab = screen.getByText('Photos');
    fireEvent.click(photosTab);

    expect(screen.getByTestId('photos-tab-content')).toBeInTheDocument();
  });

  it('should show breadcrumbs with correct hierarchy', () => {
    render(<ProjectDetailPage params={{ id: '1' }} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Mill Street Construction')).toBeInTheDocument();
  });

  it('should render Edit Project button', () => {
    render(<ProjectDetailPage params={{ id: '1' }} />);

    expect(screen.getByText('Edit Project')).toBeInTheDocument();
  });

  it('should show not found message for invalid project ID', () => {
    render(<ProjectDetailPage params={{ id: '999' }} />);

    expect(screen.getByText('Project Not Found')).toBeInTheDocument();
  });
});
