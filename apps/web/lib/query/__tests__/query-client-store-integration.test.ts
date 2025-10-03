import { describe, it, expect, beforeEach } from 'vitest';
import { createQueryClient, queryKeys } from '../client';
import { appStore, appActions } from '../../store/app.store';

/**
 * Query Client + Valtio Store Integration Tests
 *
 * CRITICAL: These tests verify the hard dependencies between query client and app store.
 * Query client REQUIRES these store exports:
 * - appActions.addToOfflineQueue (line 88 in client.ts)
 * - appActions.setSyncStatus (line 100 in client.ts)
 * - appActions.setNetworkStatus (line 176 in client.ts)
 *
 * DO NOT modify store exports without updating these tests.
 *
 * @see apps/web/lib/query/client.ts
 * @see apps/web/lib/store/app.store.ts
 */

describe('Query Client + Valtio Store Integration', () => {
  let queryClient: ReturnType<typeof createQueryClient>;

  beforeEach(() => {
    // Clear offline queue before each test
    appStore.offlineQueue = [];
    appStore.syncStatus = 'idle';
    appStore.networkStatus = 'online';

    // Create fresh query client
    queryClient = createQueryClient();
  });

  describe('App Store Contract Verification', () => {
    it('should export appStore proxy', () => {
      expect(appStore).toBeDefined();
      expect(appStore.offlineQueue).toEqual([]);
      expect(appStore.syncStatus).toBe('idle');
      expect(appStore.networkStatus).toBe('online');
    });

    it('should export appActions.addToOfflineQueue function', () => {
      expect(typeof appActions.addToOfflineQueue).toBe('function');

      // Test adding item to queue
      appActions.addToOfflineQueue({
        type: 'form_submission',
        payload: { test: true },
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3,
        priority: 'medium',
      });

      expect(appStore.offlineQueue.length).toBe(1);
      expect(appStore.offlineQueue[0].type).toBe('form_submission');
    });

    it('should export appActions.setSyncStatus function', () => {
      expect(typeof appActions.setSyncStatus).toBe('function');

      // Test setting sync status
      appActions.setSyncStatus('syncing');
      expect(appStore.syncStatus).toBe('syncing');

      appActions.setSyncStatus('success');
      expect(appStore.syncStatus).toBe('success');
      expect(appStore.lastSync).toBeDefined();
    });

    it('should export appActions.setNetworkStatus function', () => {
      expect(typeof appActions.setNetworkStatus).toBe('function');

      // Test setting network status
      appActions.setNetworkStatus('offline');
      expect(appStore.networkStatus).toBe('offline');

      appActions.setNetworkStatus('online');
      expect(appStore.networkStatus).toBe('online');
    });
  });

  describe('Query Client Configuration', () => {
    it('should configure queries with 30-day garbage collection time', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      // 30 days in milliseconds
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      expect(defaultOptions.queries?.gcTime).toBe(thirtyDaysMs);
    });

    it('should configure queries with offlineFirst network mode', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.networkMode).toBe('offlineFirst');
    });

    it('should configure mutations with offlineFirst network mode', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.mutations?.networkMode).toBe('offlineFirst');
    });

    it('should configure query retry logic for construction site connectivity', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(typeof defaultOptions.queries?.retry).toBe('function');

      const retryFn = defaultOptions.queries?.retry as (
        failureCount: number,
        error: unknown
      ) => boolean;

      // Should retry network errors
      expect(retryFn(1, { code: 'NETWORK_ERROR' })).toBe(true);
      expect(retryFn(2, { code: 'NETWORK_ERROR' })).toBe(true);
      expect(retryFn(3, { code: 'NETWORK_ERROR' })).toBe(false); // Max retries

      // Should retry 408 and 429
      expect(retryFn(1, { response: { status: 408 } })).toBe(true);
      expect(retryFn(1, { response: { status: 429 } })).toBe(true);

      // Should NOT retry other 4xx errors
      expect(retryFn(1, { response: { status: 400 } })).toBe(false);
      expect(retryFn(1, { response: { status: 404 } })).toBe(false);

      // Should retry 5xx errors
      expect(retryFn(1, { response: { status: 500 } })).toBe(true);
    });
  });

  describe('Mutation Offline Queue Integration', () => {
    it('should add failed mutations to offline queue on network error', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const onError = defaultOptions.mutations?.onError;

      expect(typeof onError).toBe('function');

      // Clear queue
      appStore.offlineQueue = [];

      // Simulate network error
      const error = { code: 'NETWORK_ERROR', message: 'Network request failed' };
      const variables = { formId: '123', data: { field: 'value' } };
      const context = {};

      onError?.(error, variables, context);

      // Verify added to queue
      expect(appStore.offlineQueue.length).toBe(1);
      expect(appStore.offlineQueue[0].type).toBe('form_submission');
      expect(appStore.offlineQueue[0].payload.variables).toEqual(variables);
    });

    it('should NOT add client errors (4xx except 408/429) to offline queue', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const onError = defaultOptions.mutations?.onError;

      // Clear queue
      appStore.offlineQueue = [];

      // Simulate 400 error
      const error = { response: { status: 400 }, message: 'Bad request' };
      const variables = { formId: '123' };

      onError?.(error, variables, {});

      // Queue should be empty (400 is client error, not network issue)
      expect(appStore.offlineQueue.length).toBe(0);
    });

    it('should set sync status to success on mutation success', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const onSuccess = defaultOptions.mutations?.onSuccess;

      expect(typeof onSuccess).toBe('function');

      // Reset sync status
      appStore.syncStatus = 'idle';

      onSuccess?.(null, null, null);

      expect(appStore.syncStatus).toBe('success');
    });
  });

  describe('Network Status Integration', () => {
    it('should update app store when network status changes', () => {
      // Simulate offline
      appActions.setNetworkStatus('offline');
      expect(appStore.networkStatus).toBe('offline');

      // Simulate back online
      appActions.setNetworkStatus('online');
      expect(appStore.networkStatus).toBe('online');
    });

    it('should trigger sync when network comes back online with queued items', () => {
      // Add item to queue while offline
      appStore.networkStatus = 'offline';
      appActions.addToOfflineQueue({
        type: 'form_submission',
        payload: { test: true },
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3,
        priority: 'high',
      });

      expect(appStore.offlineQueue.length).toBe(1);

      // Mock triggerSync to track if called
      const originalTriggerSync = appActions.triggerSync;
      let syncTriggered = false;
      appActions.triggerSync = async () => {
        syncTriggered = true;
        return originalTriggerSync();
      };

      // Come back online
      appActions.setNetworkStatus('online');

      // Sync should be triggered (note: actual sync is async)
      expect(syncTriggered).toBe(true);

      // Restore original
      appActions.triggerSync = originalTriggerSync;
    });
  });

  describe('30-Day Offline Persistence', () => {
    it('should configure cache with 30-day max age for persistence', () => {
      // This test verifies the persistence configuration
      // Actual persistence is handled by @tanstack/react-query-persist-client
      const defaultOptions = queryClient.getDefaultOptions();

      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(defaultOptions.queries?.gcTime).toBe(thirtyDaysMs);
    });

    it('should set staleTime for background refetching', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      // 5 minutes stale time allows fresh data when online
      const fiveMinutesMs = 5 * 60 * 1000;
      expect(defaultOptions.queries?.staleTime).toBe(fiveMinutesMs);
    });
  });

  describe('Query Key Factory', () => {
    it('should provide consistent query keys for cache management', () => {
      // Verify structure
      expect(queryKeys.user).toEqual(['user']);
      expect(queryKeys.projects).toEqual(['projects']);
      expect(queryKeys.project('123')).toEqual(['projects', '123']);
      expect(queryKeys.projectInspections('123')).toEqual(['projects', '123', 'inspections']);

      // Weather keys (critical for EPA compliance)
      expect(queryKeys.weather).toEqual(['weather']);
      expect(queryKeys.currentWeather('site-1')).toEqual(['weather', 'current', 'site-1']);
      expect(queryKeys.weatherHistory('site-1', 7)).toEqual(['weather', 'history', 'site-1', 7]);

      // Compliance keys
      expect(queryKeys.compliance).toEqual(['compliance']);
      expect(queryKeys.complianceStatus('proj-1')).toEqual(['compliance', 'status', 'proj-1']);
    });
  });

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff for retries', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryDelay = defaultOptions.queries?.retryDelay;

      expect(typeof retryDelay).toBe('function');

      if (typeof retryDelay === 'function') {
        // First retry: 1000ms (2^0 * 1000)
        expect(retryDelay(0)).toBe(1000);

        // Second retry: 2000ms (2^1 * 1000)
        expect(retryDelay(1)).toBe(2000);

        // Third retry: 4000ms (2^2 * 1000)
        expect(retryDelay(2)).toBe(4000);

        // Fourth retry: 8000ms (2^3 * 1000)
        expect(retryDelay(3)).toBe(8000);

        // Max at 30000ms
        expect(retryDelay(10)).toBe(30000);
      }
    });
  });
});
