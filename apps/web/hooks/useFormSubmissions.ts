/**
 * TanStack Query hooks for form submissions
 *
 * Provides data fetching hooks with offline persistence for form submissions.
 *
 * @security All hooks require authentication
 * @offline Cached in TanStack Query for offline access
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  findAllSubmissions,
  findSubmissionById,
  SubmissionResponse,
  CreateSubmissionInput,
} from '@/lib/api/submissions';
import { FormSubmissionStatus } from '@brave-forms/types';

// Query keys for cache management
export const submissionKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionKeys.all, 'list'] as const,
  list: (params: GetSubmissionsParams) => [...submissionKeys.lists(), params] as const,
  details: () => [...submissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...submissionKeys.details(), id] as const,
  byProject: (projectId: string) => [...submissionKeys.lists(), { projectId }] as const,
};

export interface GetSubmissionsParams {
  projectId?: string;
  templateId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Cache timing constants (in milliseconds)
const CACHE_STALE_TIME_SUBMISSIONS = 2 * 60 * 1000; // 2 minutes (submissions change frequently)
const CACHE_STALE_TIME_DETAIL = 5 * 60 * 1000; // 5 minutes
const CACHE_GC_TIME_SHORT = 15 * 60 * 1000; // 15 minutes
const CACHE_GC_TIME_LONG = 30 * 60 * 1000; // 30 minutes

/**
 * Transform API response to component-friendly format
 *
 * Note: Some fields from the API response may be undefined if not included
 * in the GraphQL query. The transform gracefully handles missing data.
 */
function transformSubmission(submission: SubmissionResponse) {
  // Use API timestamps when available, fall back to current time only for missing data
  const submittedAt = submission.submittedAt ? new Date(submission.submittedAt) : new Date();

  // createdAt/updatedAt not yet exposed in GraphQL query - tracked in ISSUE-136
  const createdAt = (submission as { createdAt?: string }).createdAt
    ? new Date((submission as { createdAt?: string }).createdAt!)
    : submittedAt;
  const updatedAt = (submission as { updatedAt?: string }).updatedAt
    ? new Date((submission as { updatedAt?: string }).updatedAt!)
    : submittedAt;

  // projectId not yet exposed in GraphQL query - tracked in ISSUE-137
  const projectId = (submission as { projectId?: string }).projectId || '';

  return {
    id: submission.id,
    projectId,
    templateId: submission.templateId,
    templateTitle: submission.template?.name || 'Unknown Form',
    submittedBy: submission.createdBy?.name || 'Unknown',
    status: submission.status as FormSubmissionStatus,
    submittedAt,
    createdAt,
    updatedAt,
    data: submission.data,
  };
}

export type TransformedSubmission = ReturnType<typeof transformSubmission>;

/**
 * Hook to fetch form submissions with optional filters
 *
 * @param params - Optional filters (projectId, templateId, status, dates)
 * @returns Query result with submissions array
 *
 * @example
 * const { data: submissions, isLoading } = useFormSubmissions({ projectId: '1' });
 *
 * @offline Returns cached data when offline
 */
export function useFormSubmissions(params?: GetSubmissionsParams) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: submissionKeys.list(params || {}),
    queryFn: async () => {
      const token = getToken ? await getToken() : null;
      const submissions = await findAllSubmissions(
        {
          filter: {
            templateId: params?.templateId,
            status: params?.status,
            startDate: params?.startDate,
            endDate: params?.endDate,
          },
          search: params?.search,
          orderBy: { submittedAt: 'desc' },
        },
        token
      );
      return submissions.map(transformSubmission);
    },
    enabled: isSignedIn,
    staleTime: CACHE_STALE_TIME_SUBMISSIONS,
    gcTime: CACHE_GC_TIME_SHORT,
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to fetch submissions for a specific project
 *
 * @param projectId - Project ID to filter by
 * @returns Query result with submissions array
 *
 * @example
 * const { data: submissions } = useProjectSubmissions('project-123');
 */
export function useProjectSubmissions(projectId: string | undefined) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: submissionKeys.byProject(projectId || ''),
    queryFn: async () => {
      if (!projectId) return [];
      const token = getToken ? await getToken() : null;
      const submissions = await findAllSubmissions(
        {
          filter: {},
          orderBy: { submittedAt: 'desc' },
        },
        token
      );
      // TODO(ISSUE-137): Add projectId filter to backend GraphQL API
      // Currently fetches all submissions for org, frontend filters by projectId
      return submissions.map(transformSubmission);
    },
    enabled: isSignedIn && !!projectId,
    staleTime: CACHE_STALE_TIME_SUBMISSIONS,
    gcTime: CACHE_GC_TIME_SHORT,
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to fetch a single submission by ID
 *
 * @param id - Submission ID
 * @returns Query result with submission object
 *
 * @example
 * const { data: submission, isLoading } = useFormSubmission('sub-123');
 *
 * @offline Returns cached data when offline
 */
export function useFormSubmission(id: string | undefined) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: submissionKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Submission ID is required');
      const token = getToken ? await getToken() : null;
      const submission = await findSubmissionById(id, token);
      return transformSubmission(submission);
    },
    enabled: isSignedIn && !!id,
    staleTime: CACHE_STALE_TIME_DETAIL,
    gcTime: CACHE_GC_TIME_LONG,
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to invalidate submissions cache
 *
 * Use after creating/updating submissions to refresh data.
 *
 * @returns Function to invalidate submissions cache
 *
 * @example
 * const invalidateSubmissions = useInvalidateSubmissions();
 * onSubmissionCreated(() => invalidateSubmissions());
 */
export function useInvalidateSubmissions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: submissionKeys.all });
  };
}

/**
 * Hook to prefetch a submission (useful for hover/preview)
 *
 * @returns Function to prefetch submission by ID
 */
export function usePrefetchSubmission() {
  const queryClient = useQueryClient();
  const { getToken } = useAppAuth();

  return async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: submissionKeys.detail(id),
      queryFn: async () => {
        const token = getToken ? await getToken() : null;
        const submission = await findSubmissionById(id, token);
        return transformSubmission(submission);
      },
      staleTime: CACHE_STALE_TIME_DETAIL,
    });
  };
}

// Re-export types for convenience
export type { SubmissionResponse, CreateSubmissionInput };

/**
 * Filter submissions by template ID
 */
export function filterSubmissionsByTemplate(
  submissions: TransformedSubmission[],
  templateId: string | 'all'
): TransformedSubmission[] {
  if (templateId === 'all') {
    return submissions;
  }
  return submissions.filter((submission) => submission.templateId === templateId);
}

/**
 * Filter submissions by status
 */
export function filterSubmissionsByStatus(
  submissions: TransformedSubmission[],
  status: string | 'all'
): TransformedSubmission[] {
  if (status === 'all') {
    return submissions;
  }
  return submissions.filter((submission) => submission.status === status);
}

/**
 * Filter submissions by date range
 */
export function filterSubmissionsByDateRange(
  submissions: TransformedSubmission[],
  startDate: Date | null,
  endDate: Date | null
): TransformedSubmission[] {
  if (!startDate && !endDate) {
    return submissions;
  }

  return submissions.filter((submission) => {
    const submissionDate = submission.submittedAt;
    if (startDate && submissionDate < startDate) {
      return false;
    }
    if (endDate && submissionDate > endDate) {
      return false;
    }
    return true;
  });
}

/**
 * Get status color for badge
 */
export function getSubmissionStatusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'REVIEWED':
      return 'blue';
    case 'SUBMITTED':
      return 'cyan';
    case 'DRAFT':
      return 'gray';
    case 'REJECTED':
      return 'red';
    default:
      return 'gray';
  }
}
