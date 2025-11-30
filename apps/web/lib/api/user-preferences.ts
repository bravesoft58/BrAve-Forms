/**
 * User Preferences API helpers for syncing to backend via GraphQL
 *
 * ISSUE-173: User preferences with backend persistence for cross-device sync.
 * CRITICAL: Timezone affects EPA compliance deadline calculations.
 *
 * @security All functions require Clerk JWT authentication
 * @multi-tenancy Preferences are isolated per user within their organization
 */

import { makeAuthenticatedRequest } from './client';

/**
 * User preferences as returned from backend
 */
export interface UserPreferences {
  id: string;
  userId: string;
  orgId: string;

  // Notification preferences
  emailWeatherAlerts: boolean;
  emailInspectionReminders: boolean;
  emailFormConfirmations: boolean;
  emailWeeklySummary: boolean;
  pushRealTimeAlerts: boolean;
  pushInspectionReminders: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // Account/Regional preferences
  timezone: string;
  timeFormat: string;
  language: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Input for updating notification preferences
 */
export interface NotificationPreferencesInput {
  emailWeatherAlerts?: boolean;
  emailInspectionReminders?: boolean;
  emailFormConfirmations?: boolean;
  emailWeeklySummary?: boolean;
  pushRealTimeAlerts?: boolean;
  pushInspectionReminders?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

/**
 * Input for updating account/regional preferences
 * CRITICAL: Timezone changes affect EPA compliance deadline calculations
 */
export interface AccountPreferencesInput {
  timezone?: string;
  timeFormat?: string;
  language?: string;
}

// GraphQL field selection for UserPreferences
const USER_PREFERENCES_FIELDS = `
  id
  userId
  orgId
  emailWeatherAlerts
  emailInspectionReminders
  emailFormConfirmations
  emailWeeklySummary
  pushRealTimeAlerts
  pushInspectionReminders
  quietHoursEnabled
  quietHoursStart
  quietHoursEnd
  timezone
  timeFormat
  language
  createdAt
  updatedAt
`;

/**
 * Get current user preferences
 * Creates default preferences if none exist
 *
 * @param token - Clerk JWT token
 * @returns User preferences
 */
export async function getMyPreferences(
  token: string | null
): Promise<UserPreferences> {
  const data = await makeAuthenticatedRequest<{ myPreferences: UserPreferences }>(
    {
      query: `
        query MyPreferences {
          myPreferences {
            ${USER_PREFERENCES_FIELDS}
          }
        }
      `,
    },
    token
  );

  return data.myPreferences;
}

/**
 * Update notification preferences
 *
 * @param input - Notification preference updates
 * @param token - Clerk JWT token
 * @returns Updated preferences
 */
export async function updateNotificationPreferences(
  input: NotificationPreferencesInput,
  token: string | null
): Promise<UserPreferences> {
  const data = await makeAuthenticatedRequest<{
    updateNotificationPreferences: UserPreferences;
  }>(
    {
      query: `
        mutation UpdateNotificationPreferences($input: NotificationPreferencesInput!) {
          updateNotificationPreferences(input: $input) {
            ${USER_PREFERENCES_FIELDS}
          }
        }
      `,
      variables: { input },
    },
    token
  );

  return data.updateNotificationPreferences;
}

/**
 * Update account/regional preferences
 *
 * CRITICAL: Timezone changes affect EPA compliance deadline calculations.
 * Changes are logged in backend for compliance audit trail.
 *
 * @param input - Account preference updates
 * @param token - Clerk JWT token
 * @returns Updated preferences
 */
export async function updateAccountPreferences(
  input: AccountPreferencesInput,
  token: string | null
): Promise<UserPreferences> {
  const data = await makeAuthenticatedRequest<{
    updateAccountPreferences: UserPreferences;
  }>(
    {
      query: `
        mutation UpdateAccountPreferences($input: AccountPreferencesInput!) {
          updateAccountPreferences(input: $input) {
            ${USER_PREFERENCES_FIELDS}
          }
        }
      `,
      variables: { input },
    },
    token
  );

  return data.updateAccountPreferences;
}
