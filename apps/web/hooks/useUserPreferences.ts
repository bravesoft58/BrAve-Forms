/**
 * User Preferences TanStack Query Hooks
 *
 * ISSUE-173: User preferences with backend persistence for cross-device sync.
 * CRITICAL: Timezone affects EPA compliance deadline calculations.
 *
 * These hooks sync notification and account preferences to the backend.
 * Display and offline settings remain device-local (in localStorage/Valtio).
 *
 * @see apps/web/lib/api/user-preferences.ts for GraphQL API functions
 * @see apps/web/lib/stores/settings-store.ts for local-only settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  getMyPreferences,
  updateNotificationPreferences,
  updateAccountPreferences,
  type UserPreferences,
  type NotificationPreferencesInput,
  type AccountPreferencesInput,
} from '@/lib/api/user-preferences';

/**
 * Query key factory for user preferences
 * Uses consistent pattern with other hooks for cache invalidation
 */
export const userPreferencesKeys = {
  all: ['userPreferences'] as const,
  mine: () => [...userPreferencesKeys.all, 'mine'] as const,
};

/**
 * Hook to fetch current user preferences
 *
 * Creates default preferences if none exist (upsert behavior).
 * Uses 30-day gcTime for EPA compliance data retention.
 *
 * @returns Query result with user preferences
 *
 * @example
 * ```tsx
 * const { data: prefs, isLoading } = useMyPreferences();
 * if (prefs) {
 *   console.log(prefs.timezone); // "America/Los_Angeles"
 * }
 * ```
 */
export function useMyPreferences() {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: userPreferencesKeys.mine(),
    queryFn: async () => {
      const token = getToken ? await getToken() : null;
      return getMyPreferences(token);
    },
    enabled: isSignedIn,
    // 30-day retention for EPA compliance
    gcTime: 1000 * 60 * 60 * 24 * 30,
    staleTime: 1000 * 60 * 5, // 5 minutes
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to update notification preferences
 *
 * Supports partial updates - only provided fields are changed.
 * Invalidates preferences cache on success.
 *
 * @returns Mutation result
 *
 * @example
 * ```tsx
 * const mutation = useUpdateNotificationPreferences();
 * mutation.mutate({
 *   emailWeatherAlerts: false,
 *   quietHoursEnabled: true,
 * });
 * ```
 */
export function useUpdateNotificationPreferences() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NotificationPreferencesInput) => {
      const token = getToken ? await getToken() : null;
      return updateNotificationPreferences(input, token);
    },
    onSuccess: (data) => {
      // Update cache with new preferences
      queryClient.setQueryData(userPreferencesKeys.mine(), data);
    },
  });
}

/**
 * Hook to update account/regional preferences
 *
 * CRITICAL: Timezone changes affect EPA compliance deadline calculations.
 * Changes are logged in backend for compliance audit trail.
 *
 * Supports partial updates - only provided fields are changed.
 * Invalidates preferences cache on success.
 *
 * @returns Mutation result
 *
 * @example
 * ```tsx
 * const mutation = useUpdateAccountPreferences();
 * // CRITICAL: Changing timezone affects EPA compliance deadlines
 * mutation.mutate({
 *   timezone: 'America/New_York',
 *   timeFormat: '24h',
 * });
 * ```
 */
export function useUpdateAccountPreferences() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AccountPreferencesInput) => {
      const token = getToken ? await getToken() : null;
      return updateAccountPreferences(input, token);
    },
    onSuccess: (data) => {
      // Update cache with new preferences
      queryClient.setQueryData(userPreferencesKeys.mine(), data);
    },
  });
}

/**
 * Sync local settings store with backend preferences
 *
 * This utility function can be used to sync Valtio settings store
 * with the backend preferences on initial load.
 *
 * @param prefs - Backend preferences
 * @param updateLocalStore - Function to update local Valtio store
 *
 * @example
 * ```tsx
 * const { data: prefs } = useMyPreferences();
 * useEffect(() => {
 *   if (prefs) {
 *     syncLocalWithBackend(prefs, updateNotificationSettings);
 *   }
 * }, [prefs]);
 * ```
 */
export function getNotificationPrefsFromBackend(
  prefs: UserPreferences
): NotificationPreferencesInput {
  return {
    emailWeatherAlerts: prefs.emailWeatherAlerts,
    emailInspectionReminders: prefs.emailInspectionReminders,
    emailFormConfirmations: prefs.emailFormConfirmations,
    emailWeeklySummary: prefs.emailWeeklySummary,
    pushRealTimeAlerts: prefs.pushRealTimeAlerts,
    pushInspectionReminders: prefs.pushInspectionReminders,
    quietHoursEnabled: prefs.quietHoursEnabled,
    quietHoursStart: prefs.quietHoursStart,
    quietHoursEnd: prefs.quietHoursEnd,
  };
}

/**
 * Extract account preferences from backend response
 */
export function getAccountPrefsFromBackend(
  prefs: UserPreferences
): AccountPreferencesInput {
  return {
    timezone: prefs.timezone,
    timeFormat: prefs.timeFormat,
    language: prefs.language,
  };
}
