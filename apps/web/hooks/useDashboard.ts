'use client';

/**
 * Dashboard TanStack Query hooks
 *
 * Provides hooks for fetching dashboard data with:
 * - Automatic caching and background refetching
 * - Offline-first support with networkMode: 'offlineFirst'
 * - Proper loading and error states
 * - Multi-tenant cache isolation via orgId in query keys
 *
 * @security All queries require Clerk JWT authentication
 * @offline Uses cached data when offline, syncs when online
 */

import { useQuery } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  fetchDashboardStats,
  fetchRecentActivity,
  fetchPendingTasks,
  DashboardStats,
  RecentActivity,
  PendingTask,
} from '@/lib/api/dashboard';

/**
 * Hook for fetching dashboard statistics
 *
 * @returns Query result with dashboard stats (activeProjects, submissionsToday, pendingInspections, complianceRate)
 *
 * @example
 * const { data: stats, isLoading, error } = useDashboardStats();
 * // stats?.activeProjects, stats?.complianceRate, etc.
 */
export function useDashboardStats() {
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');
  const isSignedIn = auth.isSignedIn ?? true;
  const orgId = auth.orgId || 'default';

  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats', orgId],
    queryFn: async () => {
      const token = await getToken();
      return fetchDashboardStats(token);
    },
    enabled: isSignedIn,
    staleTime: 60 * 1000, // 1 minute - dashboard data should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    networkMode: 'offlineFirst',
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching recent activity
 *
 * @param limit - Maximum number of activities to return (default: 5)
 * @returns Query result with recent activity items
 *
 * @example
 * const { data: activities, isLoading } = useRecentActivity(5);
 * // activities?.map(a => a.title)
 */
export function useRecentActivity(limit: number = 5) {
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');
  const isSignedIn = auth.isSignedIn ?? true;
  const orgId = auth.orgId || 'default';

  return useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'activity', orgId, limit],
    queryFn: async () => {
      const token = await getToken();
      return fetchRecentActivity(token, limit);
    },
    enabled: isSignedIn,
    staleTime: 30 * 1000, // 30 seconds - activity updates frequently
    gcTime: 5 * 60 * 1000,
    networkMode: 'offlineFirst',
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching pending tasks
 *
 * @returns Query result with pending tasks (inspections due today)
 *
 * @example
 * const { data: tasks, isLoading } = usePendingTasks();
 * // tasks?.map(t => t.name)
 */
export function usePendingTasks() {
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');
  const isSignedIn = auth.isSignedIn ?? true;
  const orgId = auth.orgId || 'default';

  return useQuery<PendingTask[]>({
    queryKey: ['dashboard', 'tasks', orgId],
    queryFn: async () => {
      const token = await getToken();
      return fetchPendingTasks(token);
    },
    enabled: isSignedIn,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    networkMode: 'offlineFirst',
    refetchOnWindowFocus: true,
  });
}

// Re-export types for consumers
export type { DashboardStats, RecentActivity, PendingTask };
