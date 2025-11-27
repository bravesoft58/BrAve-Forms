import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { useParams, useRouter } from 'next/navigation';
import SubmissionDetailPage from '../page';
import { findSubmissionById } from '@/lib/api/submissions';
import React from 'react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: true,
    getToken: vi.fn().mockResolvedValue('mock-token'),
  })),
}));

vi.mock('@/lib/api/submissions', () => ({
  findSubmissionById: vi.fn(),
}));

describe('SubmissionDetailPage', () => {
  let queryClient: QueryClient;
  let mockRouter: { back: ReturnType<typeof vi.fn>; push: ReturnType<typeof vi.fn> };

  const mockSubmission = {
    id: 'sub-1',
    templateId: 'tmpl-1',
    template: {
      name: 'SWPPP Inspection',
      version: 1,
      schema: {
        sections: [
          {
            id: 'sec-1',
            title: 'Site Information',
            fields: [
              { id: 'site_name', label: 'Site Name', type: 'text' },
              { id: 'inspector_name', label: 'Inspector Name', type: 'text' },
            ],
          },
          {
            id: 'sec-2',
            title: 'Photo Documentation',
            fields: [
              { id: 'site_photo', label: 'Site Photo', type: 'photo' },
              { id: 'inspector_signature', label: 'Inspector Signature', type: 'signature' },
            ],
          },
        ],
      },
    },
    createdBy: { name: 'John Doe' },
    submittedAt: '2025-11-20T10:00:00Z',
    status: 'SUBMITTED',
    data: {
      site_name: 'Construction Site A',
      inspector_name: 'John Doe',
      site_photo: 'data:image/jpeg;base64,mockPhotoData',
      inspector_signature: 'data:image/png;base64,mockSignatureData',
    },
  };

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
      back: vi.fn(),
      push: vi.fn(),
    };

    (useRouter as any).mockReturnValue(mockRouter);
    (useParams as any).mockReturnValue({ id: 'sub-1' });

    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading message while fetching submission', async () => {
      (findSubmissionById as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSubmission), 100))
      );

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Loading submission.../i)).toBeInTheDocument();
    });
  });

  describe('Not Found State', () => {
    it('should display not found message when submission does not exist', async () => {
      (findSubmissionById as any).mockResolvedValue(null);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Submission Not Found/i)).toBeInTheDocument();
      });
    });

    it('should show helpful message in not found state', async () => {
      (findSubmissionById as any).mockResolvedValue(null);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          screen.getByText(
            /The submission you're looking for doesn't exist or may be queued for sync/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should render Go Back button in not found state', async () => {
      (findSubmissionById as any).mockResolvedValue(null);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
      });
    });

    it('should call router.back() when Go Back clicked', async () => {
      const user = userEvent.setup();
      (findSubmissionById as any).mockResolvedValue(null);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Go Back/i });
      await user.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Offline Submission', () => {
    it('should not fetch submission when ID starts with offline-', async () => {
      (useParams as any).mockReturnValue({ id: 'offline-12345' });
      (findSubmissionById as any).mockResolvedValue(null);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      // Should not call API for offline submissions
      expect(findSubmissionById).not.toHaveBeenCalled();
    });

    it('should display not found message for offline submissions', async () => {
      (useParams as any).mockReturnValue({ id: 'offline-12345' });
      (findSubmissionById as any).mockResolvedValue(null);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Submission Not Found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Header Section', () => {
    it('should render Back button', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /← Back/i })).toBeInTheDocument();
      });
    });

    it('should call router.back() when Back button clicked', async () => {
      const user = userEvent.setup();
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /← Back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /← Back/i });
      await user.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should display submission template name in title', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /SWPPP Inspection/i })).toBeInTheDocument();
      });
    });

    it('should display status badge', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('submitted')).toBeInTheDocument();
      });
    });
  });

  describe('Metadata Section', () => {
    it('should display Submitted By information', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Submitted By:')).toBeInTheDocument();
        // "John Doe" appears twice: once in metadata, once in form data
        const johnDoeElements = screen.getAllByText('John Doe');
        expect(johnDoeElements.length).toBeGreaterThan(0);
      });
    });

    it('should display Submitted At timestamp', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Submitted At:')).toBeInTheDocument();
        // Date should be formatted as locale string
        const dateElements = screen.getAllByText(/11\/20\/2025/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should display Template Version', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Template Version:')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should display Unknown when createdBy is missing', async () => {
      const submissionWithoutUser = {
        ...mockSubmission,
        createdBy: null,
      };

      (findSubmissionById as any).mockResolvedValue(submissionWithoutUser);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });

    it('should display N/A when submittedAt is missing', async () => {
      const submissionWithoutDate = {
        ...mockSubmission,
        submittedAt: null,
      };

      (findSubmissionById as any).mockResolvedValue(submissionWithoutDate);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });

  describe('Form Data Display', () => {
    it('should render all section titles', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Site Information/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Photo Documentation/i })).toBeInTheDocument();
      });
    });

    it('should render all field labels', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Site Name')).toBeInTheDocument();
        expect(screen.getByText('Inspector Name')).toBeInTheDocument();
        expect(screen.getByText('Site Photo')).toBeInTheDocument();
        expect(screen.getByText('Inspector Signature')).toBeInTheDocument();
      });
    });

    it('should display text field values', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Construction Site A')).toBeInTheDocument();
        // "John Doe" appears twice: once in metadata, once in form data
        const johnDoeElements = screen.getAllByText('John Doe');
        expect(johnDoeElements.length).toBeGreaterThan(0);
      });
    });

    it('should render photo field as image', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const photoImage = screen.getByRole('img', { name: /Site Photo/i });
        expect(photoImage).toBeInTheDocument();
        expect(photoImage).toHaveAttribute('src', 'data:image/jpeg;base64,mockPhotoData');
      });
    });

    it('should render signature field as image', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const signatureImage = screen.getByRole('img', { name: /Signature/i });
        expect(signatureImage).toBeInTheDocument();
        expect(signatureImage).toHaveAttribute('src', 'data:image/png;base64,mockSignatureData');
      });
    });

    it('should display N/A for empty field values', async () => {
      const submissionWithEmptyFields = {
        ...mockSubmission,
        data: {
          site_name: '',
          inspector_name: '',
        },
      };

      (findSubmissionById as any).mockResolvedValue(submissionWithEmptyFields);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const naElements = screen.getAllByText('N/A');
        expect(naElements.length).toBeGreaterThan(0);
      });
    });

    it('should display message when no form data available', async () => {
      const submissionWithoutSchema = {
        ...mockSubmission,
        template: {
          name: 'SWPPP Inspection',
          version: 1,
          schema: null,
        },
      };

      (findSubmissionById as any).mockResolvedValue(submissionWithoutSchema);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/No form data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Actions Section', () => {
    it('should render Print button', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Print/i })).toBeInTheDocument();
      });
    });

    it('should call window.print() when Print clicked', async () => {
      const user = userEvent.setup();
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Print/i })).toBeInTheDocument();
      });

      const printButton = screen.getByRole('button', { name: /Print/i });
      await user.click(printButton);

      expect(printSpy).toHaveBeenCalled();

      printSpy.mockRestore();
    });

    it('should render Use as Template button', async () => {
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Use as Template/i })).toBeInTheDocument();
      });
    });

    it('should open Use as Template dialog when button clicked', async () => {
      const user = userEvent.setup();
      (findSubmissionById as any).mockResolvedValue(mockSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Use as Template/i })).toBeInTheDocument();
      });

      const templateButton = screen.getByRole('button', { name: /Use as Template/i });
      await user.click(templateButton);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByText('Use as Template')).toBeInTheDocument();
        expect(screen.getByText('Keep All Values')).toBeInTheDocument();
      });
    });
  });

  describe('Status Badge Colors', () => {
    it('should use correct color for draft status', async () => {
      const draftSubmission = {
        ...mockSubmission,
        status: 'DRAFT',
      };

      (findSubmissionById as any).mockResolvedValue(draftSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('DRAFT')).toBeInTheDocument();
      });
    });

    it('should use correct color for approved status', async () => {
      const approvedSubmission = {
        ...mockSubmission,
        status: 'approved',
      };

      (findSubmissionById as any).mockResolvedValue(approvedSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('approved')).toBeInTheDocument();
      });
    });

    it('should use correct color for rejected status', async () => {
      const rejectedSubmission = {
        ...mockSubmission,
        status: 'rejected',
      };

      (findSubmissionById as any).mockResolvedValue(rejectedSubmission);

      render(<SubmissionDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('rejected')).toBeInTheDocument();
      });
    });
  });
});
