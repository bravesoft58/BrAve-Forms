import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useCopyYesterdaysLog } from '../useCopyYesterdaysLog';
import { copyYesterdaysLog } from '@/lib/api/submissions';
import React from 'react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

vi.mock('@/lib/api/submissions', () => ({
  copyYesterdaysLog: vi.fn(),
}));

describe('useCopyYesterdaysLog', () => {
  let queryClient: QueryClient;
  let mockRouter: { push: ReturnType<typeof vi.fn> };

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockRouter = {
      push: vi.fn(),
    };

    (useRouter as any).mockReturnValue(mockRouter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Successful Copy', () => {
    it("should copy yesterday's log successfully", async () => {
      const mockClonedSubmission = {
        id: 'cloned-id',
        templateId: 'template-id',
        data: { field1: 'value1' },
        status: 'draft',
        submittedAt: null,
      };

      (copyYesterdaysLog as any).mockResolvedValue(mockClonedSubmission);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ templateId: 'template-id' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(copyYesterdaysLog).toHaveBeenCalledWith('template-id');
      expect(result.current.data).toEqual(mockClonedSubmission);
    });

    it('should show success notification', async () => {
      const mockClonedSubmission = {
        id: 'cloned-id',
        templateId: 'template-id',
        data: {},
        status: 'draft',
        submittedAt: null,
      };

      (copyYesterdaysLog as any).mockResolvedValue(mockClonedSubmission);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ templateId: 'template-id' });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: "Yesterday's log copied!",
          message: 'Continue filling from where you left off',
          color: 'green',
        });
      });
    });

    it('should redirect to fill page with draft ID', async () => {
      const mockClonedSubmission = {
        id: 'cloned-id',
        templateId: 'template-id',
        data: {},
        status: 'draft',
        submittedAt: null,
      };

      (copyYesterdaysLog as any).mockResolvedValue(mockClonedSubmission);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ templateId: 'template-id' });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/dashboard/forms/template-id/fill?draftId=cloned-id'
        );
      });
    });

    it('should invalidate submissions query after successful copy', async () => {
      const mockClonedSubmission = {
        id: 'cloned-id',
        templateId: 'template-id',
        data: {},
        status: 'draft',
        submittedAt: null,
      };

      (copyYesterdaysLog as any).mockResolvedValue(mockClonedSubmission);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ templateId: 'template-id' });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['submissions'] });
      });
    });
  });

  describe('Error Handling', () => {
    it('should show "not found" error notification', async () => {
      const error = new Error('No submission found for yesterday');
      (copyYesterdaysLog as any).mockRejectedValue(error);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({ templateId: 'template-id' });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'No submission found for yesterday',
          message: 'Start a new form instead',
          color: 'yellow',
        });
      });
    });

    it('should show generic error notification for other errors', async () => {
      const error = new Error('Network error');
      (copyYesterdaysLog as any).mockRejectedValue(error);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({ templateId: 'template-id' });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: "Failed to copy yesterday's log",
          message: 'Network error',
          color: 'red',
        });
      });
    });

    it('should show generic error message when no message provided', async () => {
      const error = new Error();
      (copyYesterdaysLog as any).mockRejectedValue(error);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({ templateId: 'template-id' });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: "Failed to copy yesterday's log",
          message: 'Please try again',
          color: 'red',
        });
      });
    });

    it('should set error state on mutation failure', async () => {
      const error = new Error('API error');
      (copyYesterdaysLog as any).mockRejectedValue(error);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({ templateId: 'template-id' });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should not redirect on error', async () => {
      const error = new Error('Network error');
      (copyYesterdaysLog as any).mockRejectedValue(error);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({ templateId: 'template-id' });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Mutation State', () => {
    it('should set isPending state during copy', async () => {
      let resolveFn: any;
      const promise = new Promise((resolve) => {
        resolveFn = resolve;
      });

      (copyYesterdaysLog as any).mockReturnValue(promise);

      const { result } = renderHook(() => useCopyYesterdaysLog(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ templateId: 'template-id' });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolveFn({
        id: 'cloned-id',
        templateId: 'template-id',
        data: {},
        status: 'draft',
        submittedAt: null,
      });
    });
  });
});
