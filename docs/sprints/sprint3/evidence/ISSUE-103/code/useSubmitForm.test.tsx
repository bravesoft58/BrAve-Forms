import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useSubmitForm } from '../useSubmitForm';
import { createSubmission } from '@/lib/api/submissions';
import { useNetworkStatus } from '../useNetworkStatus';
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
  createSubmission: vi.fn(),
}));

vi.mock('../useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(),
}));

describe('useSubmitForm', () => {
  let queryClient: QueryClient;
  let mockRouter: { push: ReturnType<typeof vi.fn> };
  let mockIndexedDB: {
    open: ReturnType<typeof vi.fn>;
    databases: Map<string, any>;
  };

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

    // Mock online by default
    (useNetworkStatus as any).mockReturnValue({ isOnline: true });

    // Mock IndexedDB
    mockIndexedDB = {
      open: vi.fn(),
      databases: new Map(),
    };

    const mockDB = {
      transaction: vi.fn((_storeNames, _mode) => ({
        objectStore: vi.fn((_name) => ({
          add: vi.fn().mockResolvedValue(undefined),
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
        })),
      })),
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      createObjectStore: vi.fn(),
    };

    const mockRequest = {
      result: mockDB,
      error: null,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    };

    mockIndexedDB.open.mockReturnValue(mockRequest);

    (global as any).indexedDB = {
      open: (_dbName: string, _version: number) => {
        const request = mockRequest;
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({ target: request } as any);
          }
        }, 0);
        return request;
      },
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Online Submission', () => {
    it('should submit form successfully when online', async () => {
      const mockSubmission = {
        id: 'sub-123',
        templateId: 'tmpl-1',
        data: { field1: 'value1' },
        status: 'submitted' as const,
      };

      (createSubmission as any).mockResolvedValue(mockSubmission);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      const input = {
        templateId: 'tmpl-1',
        data: { field1: 'value1' },
        status: 'submitted' as const,
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createSubmission).toHaveBeenCalledWith(input);
      expect(result.current.data).toEqual(mockSubmission);
    });

    it('should show success notification for submitted form', async () => {
      const mockSubmission = {
        id: 'sub-123',
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted' as const,
      };

      (createSubmission as any).mockResolvedValue(mockSubmission);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Form Submitted',
          message: 'Your submission has been recorded.',
          color: 'green',
        });
      });
    });

    it('should navigate to submission detail page after successful submission', async () => {
      const mockSubmission = {
        id: 'sub-123',
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted' as const,
      };

      (createSubmission as any).mockResolvedValue(mockSubmission);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/submissions/sub-123');
      });
    });

    it('should invalidate submissions query after successful submission', async () => {
      const mockSubmission = {
        id: 'sub-123',
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted' as const,
      };

      (createSubmission as any).mockResolvedValue(mockSubmission);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['submissions'] });
      });
    });
  });

  describe('Draft Submission', () => {
    it('should save draft successfully', async () => {
      const mockDraft = {
        id: 'draft-123',
        templateId: 'tmpl-1',
        data: { field1: 'partial' },
        status: 'draft' as const,
      };

      (createSubmission as any).mockResolvedValue(mockDraft);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: { field1: 'partial' },
        status: 'draft',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDraft);
    });

    it('should show draft saved notification', async () => {
      const mockDraft = {
        id: 'draft-123',
        templateId: 'tmpl-1',
        data: {},
        status: 'draft' as const,
      };

      (createSubmission as any).mockResolvedValue(mockDraft);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'draft',
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Draft Saved',
          message: 'Draft saved successfully',
          color: 'blue',
        });
      });
    });

    it('should not navigate after saving draft', async () => {
      const mockDraft = {
        id: 'draft-123',
        templateId: 'tmpl-1',
        data: {},
        status: 'draft' as const,
      };

      (createSubmission as any).mockResolvedValue(mockDraft);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'draft',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Offline Submission', () => {
    beforeEach(() => {
      (useNetworkStatus as any).mockReturnValue({ isOnline: false });
    });

    it('should queue submission when offline', async () => {
      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      const input = {
        templateId: 'tmpl-1',
        data: { field1: 'value1' },
        status: 'submitted' as const,
      };

      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createSubmission).not.toHaveBeenCalled();
      expect(result.current.data?.id).toMatch(/^offline-/);
    });

    it('should show queued notification when offline', async () => {
      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Queued for Sync',
          message: 'Will submit when connection is restored',
          color: 'yellow',
        });
      });
    });

    it('should not navigate after offline submission', async () => {
      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle IndexedDB unavailable gracefully', async () => {
      // Remove IndexedDB
      (global as any).indexedDB = undefined;

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Offline Mode',
          message: 'Submission will be synced when connection is restored',
          color: 'yellow',
        });
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (useNetworkStatus as any).mockReturnValue({ isOnline: true });
    });

    it('should show error notification on submission failure', async () => {
      const errorMessage = 'Network error';
      (createSubmission as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Submission Failed',
          message: errorMessage,
          color: 'red',
        });
      });
    });

    it('should show generic error message when no message provided', async () => {
      (createSubmission as any).mockRejectedValue(new Error());

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Submission Failed',
          message: 'Please try again',
          color: 'red',
        });
      });
    });

    it('should set error state on mutation failure', async () => {
      (createSubmission as any).mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should not navigate on submission error', async () => {
      (createSubmission as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Mutation State', () => {
    it('should set isPending state during submission', async () => {
      let resolveFn: any;
      const promise = new Promise((resolve) => {
        resolveFn = resolve;
      });

      (createSubmission as any).mockReturnValue(promise);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolveFn({ id: 'sub-123', templateId: 'tmpl-1', data: {}, status: 'submitted' });
    });

    it('should reset state when using reset', async () => {
      const mockSubmission = {
        id: 'sub-123',
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted' as const,
      };

      (createSubmission as any).mockResolvedValue(mockSubmission);

      const { result } = renderHook(() => useSubmitForm(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        templateId: 'tmpl-1',
        data: {},
        status: 'submitted',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.reset();

      // Wait for reset to take effect
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(false);
      });
      expect(result.current.data).toBeUndefined();
    });
  });
});
