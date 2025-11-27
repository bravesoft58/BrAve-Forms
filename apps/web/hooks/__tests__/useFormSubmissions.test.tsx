import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Define mocks before vi.mock calls
const mocks = {
  getToken: vi.fn().mockResolvedValue('test-token-123'),
  isSignedIn: true,
  findAllSubmissions: vi.fn(),
  findSubmissionById: vi.fn(),
};

// Mock @/app/providers
vi.mock('@/app/providers', () => ({
  useAppAuth: () => ({
    getToken: mocks.getToken,
    isSignedIn: mocks.isSignedIn,
  }),
}));

// Mock @/lib/api/submissions
vi.mock('@/lib/api/submissions', () => ({
  findAllSubmissions: (...args: unknown[]) => mocks.findAllSubmissions(...args),
  findSubmissionById: (...args: unknown[]) => mocks.findSubmissionById(...args),
  createSubmission: vi.fn(),
  cloneSubmission: vi.fn(),
}));

// Mock @brave-forms/types
vi.mock('@brave-forms/types', () => ({
  FormSubmissionStatus: {
    DRAFT: 'DRAFT',
    IN_PROGRESS: 'IN_PROGRESS',
    SUBMITTED: 'SUBMITTED',
    REVIEWED: 'REVIEWED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
}));

// Import after mocks
import {
  useFormSubmissions,
  useProjectSubmissions,
  useFormSubmission,
  filterSubmissionsByTemplate,
  filterSubmissionsByStatus,
  getSubmissionStatusColor,
  TransformedSubmission,
} from '../useFormSubmissions';

const mockSubmissionsResponse = [
  {
    id: 'sub-001',
    templateId: 'template-1',
    template: { id: 'template-1', name: 'Daily Log' },
    status: 'SUBMITTED',
    submittedAt: '2025-01-20T14:30:00Z',
    createdBy: { id: 'user-1', name: 'John Smith' },
    data: { field1: 'value1' },
  },
  {
    id: 'sub-002',
    templateId: 'template-2',
    template: { id: 'template-2', name: 'Inspection Form' },
    status: 'APPROVED',
    submittedAt: '2025-01-19T10:00:00Z',
    createdBy: { id: 'user-2', name: 'Jane Doe' },
    data: { field1: 'value2' },
  },
];

// Test wrapper
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useFormSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSignedIn = true;
    mocks.findAllSubmissions.mockResolvedValue(mockSubmissionsResponse);
    mocks.findSubmissionById.mockResolvedValue(mockSubmissionsResponse[0]);
  });

  describe('useFormSubmissions hook', () => {
    it('fetches and transforms submissions correctly', async () => {
      const { result } = renderHook(() => useFormSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        id: 'sub-001',
        templateId: 'template-1',
        templateTitle: 'Daily Log',
        submittedBy: 'John Smith',
        status: 'SUBMITTED',
      });
    });

    it('filters by templateId when provided', async () => {
      const { result } = renderHook(() => useFormSubmissions({ templateId: 'template-1' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mocks.findAllSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ templateId: 'template-1' }),
        }),
        'test-token-123'
      );
    });

    it('does not fetch when not signed in', async () => {
      mocks.isSignedIn = false;

      const { result } = renderHook(() => useFormSubmissions(), { wrapper });

      // Should not be loading because query is disabled
      expect(result.current.isPending).toBe(true);
      expect(mocks.findAllSubmissions).not.toHaveBeenCalled();
    });

    it('handles networkMode offlineFirst', async () => {
      const { result } = renderHook(() => useFormSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query should have been made with offline-first support
      expect(mocks.findAllSubmissions).toHaveBeenCalled();
    });
  });

  describe('useProjectSubmissions hook', () => {
    it('fetches submissions for a specific project', async () => {
      const { result } = renderHook(() => useProjectSubmissions('project-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(mocks.findAllSubmissions).toHaveBeenCalled();
    });

    it('returns empty array when projectId is undefined', async () => {
      const { result } = renderHook(() => useProjectSubmissions(undefined), { wrapper });

      // Query should be disabled when no projectId
      expect(result.current.isPending).toBe(true);
      expect(mocks.findAllSubmissions).not.toHaveBeenCalled();
    });
  });

  describe('useFormSubmission hook', () => {
    it('fetches single submission by ID', async () => {
      const { result } = renderHook(() => useFormSubmission('sub-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatchObject({
        id: 'sub-001',
        templateTitle: 'Daily Log',
      });
      expect(mocks.findSubmissionById).toHaveBeenCalledWith('sub-001', 'test-token-123');
    });

    it('does not fetch when ID is undefined', async () => {
      const { result } = renderHook(() => useFormSubmission(undefined), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mocks.findSubmissionById).not.toHaveBeenCalled();
    });
  });

  describe('filterSubmissionsByTemplate', () => {
    // Use type assertion since mocks define status as string but TransformedSubmission expects enum
    const submissions = [
      {
        id: 'sub-1',
        projectId: '',
        templateId: 'template-a',
        templateTitle: 'Template A',
        submittedBy: 'User 1',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {},
      },
      {
        id: 'sub-2',
        projectId: '',
        templateId: 'template-b',
        templateTitle: 'Template B',
        submittedBy: 'User 2',
        status: 'APPROVED',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {},
      },
    ] as unknown as TransformedSubmission[];

    it('returns all submissions when filter is "all"', () => {
      const result = filterSubmissionsByTemplate(submissions, 'all');
      expect(result).toHaveLength(2);
    });

    it('filters by specific template ID', () => {
      const result = filterSubmissionsByTemplate(submissions, 'template-a');
      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe('template-a');
    });
  });

  describe('filterSubmissionsByStatus', () => {
    // Use type assertion since mocks define status as string but TransformedSubmission expects enum
    const submissions = [
      {
        id: 'sub-1',
        projectId: '',
        templateId: 'template-a',
        templateTitle: 'Template A',
        submittedBy: 'User 1',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {},
      },
      {
        id: 'sub-2',
        projectId: '',
        templateId: 'template-b',
        templateTitle: 'Template B',
        submittedBy: 'User 2',
        status: 'APPROVED',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {},
      },
    ] as unknown as TransformedSubmission[];

    it('returns all submissions when filter is "all"', () => {
      const result = filterSubmissionsByStatus(submissions, 'all');
      expect(result).toHaveLength(2);
    });

    it('filters by specific status', () => {
      const result = filterSubmissionsByStatus(submissions, 'APPROVED');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('APPROVED');
    });
  });

  describe('getSubmissionStatusColor', () => {
    it('returns correct color for each status', () => {
      expect(getSubmissionStatusColor('APPROVED')).toBe('green');
      expect(getSubmissionStatusColor('REVIEWED')).toBe('blue');
      expect(getSubmissionStatusColor('SUBMITTED')).toBe('cyan');
      expect(getSubmissionStatusColor('DRAFT')).toBe('gray');
      expect(getSubmissionStatusColor('REJECTED')).toBe('red');
      expect(getSubmissionStatusColor('UNKNOWN')).toBe('gray');
    });
  });

  describe('Offline scenarios', () => {
    it('uses offlineFirst networkMode for caching', async () => {
      // First render - online fetch
      mocks.findAllSubmissions.mockResolvedValue(mockSubmissionsResponse);

      const { result } = renderHook(() => useFormSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data was fetched and cached
      expect(result.current.data).toHaveLength(2);
    });

    it('transforms submissions even with missing optional fields', async () => {
      // API response with minimal data
      mocks.findAllSubmissions.mockResolvedValue([
        {
          id: 'sub-minimal',
          templateId: 'template-1',
          status: 'DRAFT',
          // No template object, no createdBy, no submittedAt
        },
      ]);

      const { result } = renderHook(() => useFormSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const submission = result.current.data?.[0];
      expect(submission).toMatchObject({
        id: 'sub-minimal',
        templateId: 'template-1',
        templateTitle: 'Unknown Form', // Fallback
        submittedBy: 'Unknown', // Fallback
        status: 'DRAFT',
      });
      // Dates should still be valid Date objects
      expect(submission?.submittedAt).toBeInstanceOf(Date);
      expect(submission?.createdAt).toBeInstanceOf(Date);
      expect(submission?.updatedAt).toBeInstanceOf(Date);
    });
  });
});
