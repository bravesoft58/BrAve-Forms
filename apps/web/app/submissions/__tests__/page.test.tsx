import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { useRouter } from 'next/navigation';
import SubmissionsPage from '../page';
import { findAllSubmissions } from '@/lib/api/submissions';
import { getMockFormTemplates } from '@/lib/mock-data/form-templates';
import React from 'react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/api/submissions', () => ({
  findAllSubmissions: vi.fn(),
}));

vi.mock('@/lib/mock-data/form-templates', () => ({
  getMockFormTemplates: vi.fn(),
}));

describe('SubmissionsPage', () => {
  let queryClient: QueryClient;
  let mockRouter: { push: ReturnType<typeof vi.fn> };

  const mockTemplates = [
    { id: 'tmpl-1', title: 'SWPPP Inspection' },
    { id: 'tmpl-2', title: 'Safety Checklist' },
  ];

  const mockSubmissions = [
    {
      id: 'sub-1',
      templateId: 'tmpl-1',
      template: { name: 'SWPPP Inspection', version: 1 },
      createdBy: { name: 'John Doe' },
      submittedAt: '2025-11-20T10:00:00Z',
      status: 'submitted',
      data: {},
    },
    {
      id: 'sub-2',
      templateId: 'tmpl-2',
      template: { name: 'Safety Checklist', version: 1 },
      createdBy: { name: 'Jane Smith' },
      submittedAt: '2025-11-19T14:30:00Z',
      status: 'draft',
      data: {},
    },
  ];

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MantineProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MantineProvider>
    );
    return wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockRouter = {
      push: vi.fn(),
    };

    (useRouter as any).mockReturnValue(mockRouter);
    (getMockFormTemplates as any).mockReturnValue(mockTemplates);

    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render page title', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('heading', { name: /Form Submissions/i })).toBeInTheDocument();
    });

    it('should render Fill New Form button', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      const button = screen.getByRole('link', { name: /Fill New Form/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/dashboard/forms');
    });

    it('should render all filter inputs', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      expect(screen.getByPlaceholderText(/Search submissions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
      // Use getAllByLabelText for labels that may appear multiple times
      const formTemplateLabels = screen.getAllByLabelText(/Form Template/i);
      expect(formTemplateLabels.length).toBeGreaterThan(0);
      const statusLabels = screen.getAllByLabelText(/Status/i);
      expect(statusLabels.length).toBeGreaterThan(0);
    });

    it('should render Clear Filters button', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading message while fetching submissions', async () => {
      (findAllSubmissions as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSubmissions), 100))
      );

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Loading submissions.../i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no submissions exist', async () => {
      (findAllSubmissions as any).mockResolvedValue([]);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/No submissions found/i)).toBeInTheDocument();
      });
    });

    it('should show Fill your first form button in empty state', async () => {
      (findAllSubmissions as any).mockResolvedValue([]);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const button = screen.getByRole('link', { name: /Fill your first form/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('href', '/dashboard/forms');
      });
    });
  });

  describe('Submissions Table', () => {
    it('should render table with correct headers', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Form Name')).toBeInTheDocument();
        expect(screen.getByText('Submitted By')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        // "Status" appears multiple times (filter label and table header)
        const statusElements = screen.getAllByText('Status');
        expect(statusElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('should display all submissions in table', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Form template names appear multiple times (table and filter dropdown)
        const swpppElements = screen.getAllByText('SWPPP Inspection');
        expect(swpppElements.length).toBeGreaterThan(0);
        const safetyElements = screen.getAllByText('Safety Checklist');
        expect(safetyElements.length).toBeGreaterThan(0);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display formatted date for submissions', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Dates should be formatted as locale date strings
        const dateElements = screen.getAllByText(/11\/\d{1,2}\/2025/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should display status badge with correct color for submitted', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const submittedBadge = screen.getByText('submitted');
        expect(submittedBadge).toBeInTheDocument();
      });
    });

    it('should display status badge with correct color for draft', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const draftBadge = screen.getByText('draft');
        expect(draftBadge).toBeInTheDocument();
      });
    });

    it('should render View button for each submission', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /View/i });
        expect(viewButtons).toHaveLength(2);
      });
    });

    it('should navigate to submission detail when View clicked', async () => {
      const user = userEvent.setup();
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /View/i })).toHaveLength(2);
      });

      const viewButtons = screen.getAllByRole('button', { name: /View/i });
      await user.click(viewButtons[0]);

      expect(mockRouter.push).toHaveBeenCalledWith('/submissions/sub-1');
    });
  });

  describe('Filters', () => {
    it('should update search filter on input', async () => {
      const user = userEvent.setup();
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/Search submissions/i);
      await user.type(searchInput, 'inspection');

      expect(searchInput).toHaveValue('inspection');
    });

    it('should update start date filter', async () => {
      const user = userEvent.setup();
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      const startDateInput = screen.getByLabelText(/Start Date/i);
      await user.type(startDateInput, '2025-11-01');

      expect(startDateInput).toHaveValue('2025-11-01');
    });

    it('should update end date filter', async () => {
      const user = userEvent.setup();
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      const endDateInput = screen.getByLabelText(/End Date/i);
      await user.type(endDateInput, '2025-11-30');

      expect(endDateInput).toHaveValue('2025-11-30');
    });

    it('should clear all filters when Clear Filters clicked', async () => {
      const user = userEvent.setup();
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      // Set filters
      const searchInput = screen.getByPlaceholderText(/Search submissions/i);
      await user.type(searchInput, 'test');

      const startDateInput = screen.getByLabelText(/Start Date/i);
      await user.type(startDateInput, '2025-11-01');

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(startDateInput).toHaveValue('');
    });

    it('should call findAllSubmissions with filter parameters', async () => {
      (findAllSubmissions as any).mockResolvedValue(mockSubmissions);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(findAllSubmissions).toHaveBeenCalledWith({
          filter: {
            startDate: undefined,
            endDate: undefined,
            templateId: undefined,
            status: undefined,
          },
          search: undefined,
          orderBy: { submittedAt: 'desc' },
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should display Unknown for missing template name', async () => {
      const submissionsWithoutTemplate = [
        {
          id: 'sub-1',
          templateId: 'tmpl-1',
          template: null,
          createdBy: { name: 'John Doe' },
          submittedAt: '2025-11-20T10:00:00Z',
          status: 'submitted',
          data: {},
        },
      ];

      (findAllSubmissions as any).mockResolvedValue(submissionsWithoutTemplate);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });

    it('should display Unknown for missing createdBy name', async () => {
      const submissionsWithoutUser = [
        {
          id: 'sub-1',
          templateId: 'tmpl-1',
          template: { name: 'SWPPP Inspection', version: 1 },
          createdBy: null,
          submittedAt: '2025-11-20T10:00:00Z',
          status: 'submitted',
          data: {},
        },
      ];

      (findAllSubmissions as any).mockResolvedValue(submissionsWithoutUser);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });

    it('should display N/A for missing submittedAt date', async () => {
      const submissionsWithoutDate = [
        {
          id: 'sub-1',
          templateId: 'tmpl-1',
          template: { name: 'SWPPP Inspection', version: 1 },
          createdBy: { name: 'John Doe' },
          submittedAt: null,
          status: 'draft',
          data: {},
        },
      ];

      (findAllSubmissions as any).mockResolvedValue(submissionsWithoutDate);

      render(<SubmissionsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });
});
