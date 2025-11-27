import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import React from 'react';
import { SubmittedFormsList } from '@/components/Forms/SubmittedFormsList';

// Mock data
const mockSubmissions = [
  {
    id: 'sub-001',
    projectId: '1',
    templateId: 'post-storm-inspection',
    templateTitle: 'Post-Storm Inspection',
    submittedBy: 'John Smith',
    status: 'APPROVED' as const,
    submittedAt: new Date('2025-01-20T14:30:00'),
    createdAt: new Date('2025-01-20T14:00:00'),
    updatedAt: new Date('2025-01-20T15:00:00'),
  },
  {
    id: 'sub-002',
    projectId: '1',
    templateId: 'daily-dust-log',
    templateTitle: 'Daily Dust Log',
    submittedBy: 'Jane Doe',
    status: 'SUBMITTED' as const,
    submittedAt: new Date('2025-01-20T08:00:00'),
    createdAt: new Date('2025-01-20T07:45:00'),
    updatedAt: new Date('2025-01-20T08:00:00'),
  },
  {
    id: 'sub-003',
    projectId: '1',
    templateId: 'swppp-inspection',
    templateTitle: 'SWPPP Inspection',
    submittedBy: 'Bob Johnson',
    status: 'DRAFT' as const,
    submittedAt: new Date('2025-01-19T16:00:00'),
    createdAt: new Date('2025-01-19T15:30:00'),
    updatedAt: new Date('2025-01-19T17:00:00'),
  },
];

const mockTemplates = [
  {
    id: 'post-storm-inspection',
    name: 'Post-Storm Inspection',
    category: 'EPA_CGP',
    isActive: true,
  },
  { id: 'daily-dust-log', name: 'Daily Dust Log', category: 'EPA_SWPPP', isActive: true },
  { id: 'swppp-inspection', name: 'SWPPP Inspection', category: 'EPA_SWPPP', isActive: true },
];

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the hooks
const mockUseProjectSubmissions = vi.fn();
const mockUseFormTemplates = vi.fn();

vi.mock('@/hooks/useFormSubmissions', () => ({
  useProjectSubmissions: () => mockUseProjectSubmissions(),
  filterSubmissionsByTemplate: vi.fn((submissions, templateId) => {
    if (templateId === 'all') return submissions;
    return submissions.filter((s: { templateId: string }) => s.templateId === templateId);
  }),
  filterSubmissionsByStatus: vi.fn((submissions, status) => {
    if (status === 'all') return submissions;
    return submissions.filter((s: { status: string }) => s.status === status);
  }),
  getSubmissionStatusColor: vi.fn((status) => {
    const colors: Record<string, string> = {
      APPROVED: 'green',
      REVIEWED: 'blue',
      SUBMITTED: 'cyan',
      DRAFT: 'gray',
      REJECTED: 'red',
    };
    return colors[status] || 'gray';
  }),
}));

vi.mock('@/hooks/useFormTemplates', () => ({
  useFormTemplates: () => mockUseFormTemplates(),
}));

// Test wrapper with providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MantineProvider>
  );
};

describe('SubmittedFormsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    // Default mock responses
    mockUseProjectSubmissions.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
    });
    mockUseFormTemplates.mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
    });
  });

  it('renders loading state while fetching', () => {
    mockUseProjectSubmissions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<SubmittedFormsList projectId="1" />);

    expect(screen.getByText('Loading submissions...')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', () => {
    mockUseProjectSubmissions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    renderWithProviders(<SubmittedFormsList projectId="1" />);

    expect(screen.getByText('Error loading submissions')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty state when no submissions', () => {
    mockUseProjectSubmissions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithProviders(<SubmittedFormsList projectId="1" />);

    expect(screen.getByText('No forms submitted yet')).toBeInTheDocument();
    expect(
      screen.getByText('Start by selecting a template to fill out your first form.')
    ).toBeInTheDocument();
  });

  it('renders list of submissions', () => {
    renderWithProviders(<SubmittedFormsList projectId="1" />);

    // Use getAllByText because items appear in both desktop table and mobile cards
    mockSubmissions.forEach((submission) => {
      expect(screen.getAllByText(submission.templateTitle).length).toBeGreaterThan(0);
      expect(screen.getAllByText(submission.submittedBy).length).toBeGreaterThan(0);
    });
  });

  it('navigates to submission detail on row click', async () => {
    renderWithProviders(<SubmittedFormsList projectId="1" />);

    const row = screen.getByTestId('submission-row-sub-001');
    fireEvent.click(row);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/forms/submissions/sub-001');
  });

  it('displays status badges', () => {
    renderWithProviders(<SubmittedFormsList projectId="1" />);

    // Multiple badges due to desktop/mobile views
    expect(screen.getAllByText('APPROVED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SUBMITTED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DRAFT').length).toBeGreaterThan(0);
  });

  it('renders filter dropdowns', () => {
    renderWithProviders(<SubmittedFormsList projectId="1" />);

    expect(screen.getByPlaceholderText('Filter by template')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter by status')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    renderWithProviders(<SubmittedFormsList projectId="1" />);

    // Should display formatted dates (multiple due to desktop/mobile views)
    expect(screen.getAllByText(/Jan 20, 2025/).length).toBeGreaterThan(0);
  });
});
