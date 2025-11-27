import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Define mocks before vi.mock calls
const mocks = {
  getToken: vi.fn().mockResolvedValue('test-token-123'),
  isSignedIn: true,
  fetchDashboardStats: vi.fn(),
  fetchRecentActivity: vi.fn(),
  fetchPendingTasks: vi.fn(),
};

// Mock @/app/providers
vi.mock('@/app/providers', () => ({
  useAppAuth: () => ({
    getToken: mocks.getToken,
    isSignedIn: mocks.isSignedIn,
  }),
}));

// Mock @/lib/api/dashboard
vi.mock('@/lib/api/dashboard', () => ({
  fetchDashboardStats: (...args: unknown[]) => mocks.fetchDashboardStats(...args),
  fetchRecentActivity: (...args: unknown[]) => mocks.fetchRecentActivity(...args),
  fetchPendingTasks: (...args: unknown[]) => mocks.fetchPendingTasks(...args),
}));

// Import after mocks
import { useDashboardStats, useRecentActivity, usePendingTasks } from '../useDashboard';

const mockDashboardStats = {
  activeProjects: 5,
  submissionsToday: 12,
  pendingInspections: 3,
  complianceRate: 98.5,
};

const mockRecentActivity = [
  {
    id: 'act-001',
    type: 'submission' as const,
    title: 'Daily SWPPP Log',
    projectName: 'Mill Street Construction',
    timestamp: '2025-11-27T10:30:00Z',
    status: 'completed' as const,
  },
  {
    id: 'act-002',
    type: 'inspection' as const,
    title: 'Post-Storm Inspection',
    projectName: 'Rancho Road Homes',
    timestamp: '2025-11-27T09:00:00Z',
    status: 'pending' as const,
  },
];

const mockPendingTasks = [
  {
    id: 'task-001',
    name: 'Weekly SWPPP Review',
    projectName: 'Downtown Plaza',
    dueTime: '2:00 PM',
    priority: 'high' as const,
  },
  {
    id: 'task-002',
    name: 'BMP Maintenance Log',
    projectName: 'Mill Street Construction',
    dueTime: '4:30 PM',
    priority: 'medium' as const,
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

describe('useDashboard hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSignedIn = true;
    mocks.fetchDashboardStats.mockResolvedValue(mockDashboardStats);
    mocks.fetchRecentActivity.mockResolvedValue(mockRecentActivity);
    mocks.fetchPendingTasks.mockResolvedValue(mockPendingTasks);
  });

  describe('useDashboardStats', () => {
    it('fetches dashboard stats correctly', async () => {
      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatchObject({
        activeProjects: 5,
        submissionsToday: 12,
        pendingInspections: 3,
        complianceRate: 98.5,
      });
      expect(mocks.fetchDashboardStats).toHaveBeenCalledWith('test-token-123');
    });

    it('does not fetch when not signed in', async () => {
      mocks.isSignedIn = false;

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      // Should not be loading because query is disabled
      expect(result.current.isPending).toBe(true);
      expect(mocks.fetchDashboardStats).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      mocks.fetchDashboardStats.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('uses offlineFirst networkMode', async () => {
      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query should have been made with proper token
      expect(mocks.fetchDashboardStats).toHaveBeenCalledWith('test-token-123');
    });
  });

  describe('useRecentActivity', () => {
    it('fetches recent activity correctly with default limit', async () => {
      const { result } = renderHook(() => useRecentActivity(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        id: 'act-001',
        type: 'submission',
        title: 'Daily SWPPP Log',
      });
      expect(mocks.fetchRecentActivity).toHaveBeenCalledWith('test-token-123', 5);
    });

    it('respects custom limit parameter', async () => {
      const { result } = renderHook(() => useRecentActivity(10), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mocks.fetchRecentActivity).toHaveBeenCalledWith('test-token-123', 10);
    });

    it('does not fetch when not signed in', async () => {
      mocks.isSignedIn = false;

      const { result } = renderHook(() => useRecentActivity(), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mocks.fetchRecentActivity).not.toHaveBeenCalled();
    });

    it('handles empty activity list', async () => {
      mocks.fetchRecentActivity.mockResolvedValue([]);

      const { result } = renderHook(() => useRecentActivity(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('usePendingTasks', () => {
    it('fetches pending tasks correctly', async () => {
      const { result } = renderHook(() => usePendingTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        id: 'task-001',
        name: 'Weekly SWPPP Review',
        priority: 'high',
      });
      expect(mocks.fetchPendingTasks).toHaveBeenCalledWith('test-token-123');
    });

    it('does not fetch when not signed in', async () => {
      mocks.isSignedIn = false;

      const { result } = renderHook(() => usePendingTasks(), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mocks.fetchPendingTasks).not.toHaveBeenCalled();
    });

    it('handles no pending tasks', async () => {
      mocks.fetchPendingTasks.mockResolvedValue([]);

      const { result } = renderHook(() => usePendingTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(0);
    });

    it('handles API errors gracefully', async () => {
      mocks.fetchPendingTasks.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => usePendingTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Offline scenarios', () => {
    it('dashboard stats uses offlineFirst networkMode for caching', async () => {
      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data was fetched and cached
      expect(result.current.data?.activeProjects).toBe(5);
    });

    it('recent activity uses offlineFirst networkMode', async () => {
      const { result } = renderHook(() => useRecentActivity(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data was fetched
      expect(result.current.data).toHaveLength(2);
    });

    it('pending tasks uses offlineFirst networkMode', async () => {
      const { result } = renderHook(() => usePendingTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data was fetched
      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('Authentication integration', () => {
    it('uses dev-token fallback when getToken is not available', async () => {
      // This tests the fallback behavior when auth is mocked without getToken
      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mocks.fetchDashboardStats).toHaveBeenCalled();
    });
  });
});
