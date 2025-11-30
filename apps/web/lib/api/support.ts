/**
 * Support Request API helpers for GraphQL backend
 *
 * ISSUE-174: Support request backend integration for help/feedback system.
 * Supports offline queue processing when requests are synced.
 *
 * @security All functions require Clerk JWT authentication
 * @multi-tenancy Requests are isolated per user and organization
 */

import { makeAuthenticatedRequest } from './client';

// ============================================================================
// Constants
// ============================================================================

/**
 * Support request type values
 */
export const SUPPORT_REQUEST_TYPES = {
  BUG: 'bug',
  FEATURE: 'feature',
  HELP: 'help',
  FEEDBACK: 'feedback',
} as const;

/**
 * Support request type labels for UI display
 */
export const SUPPORT_REQUEST_TYPE_LABELS: Record<SupportRequestType, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  help: 'Help / Question',
  feedback: 'General Feedback',
};

/**
 * Support request status values
 */
export const SUPPORT_REQUEST_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

/**
 * Support request status labels for UI display
 */
export const SUPPORT_REQUEST_STATUS_LABELS: Record<SupportRequestStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

/**
 * Support request priority values
 */
export const SUPPORT_REQUEST_PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

/**
 * Support request priority labels for UI display
 */
export const SUPPORT_REQUEST_PRIORITY_LABELS: Record<SupportRequestPriority, string> = {
  LOW: 'Low Priority',
  NORMAL: 'Normal Priority',
  HIGH: 'High Priority',
  URGENT: 'Urgent',
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Support request type enum
 */
export type SupportRequestType = 'bug' | 'feature' | 'help' | 'feedback';

/**
 * Support request status enum
 */
export type SupportRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * Support request priority enum
 */
export type SupportRequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Support request as returned from backend
 */
export interface SupportRequest {
  id: string;
  userId: string;
  orgId: string;
  type: SupportRequestType;
  subject: string;
  description: string;
  status: SupportRequestStatus;
  priority: SupportRequestPriority;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a support request
 */
export interface CreateSupportRequestInput {
  type: SupportRequestType;
  subject: string;
  description: string;
  priority?: SupportRequestPriority;
}

// GraphQL field selection for SupportRequest
const SUPPORT_REQUEST_FIELDS = `
  id
  userId
  orgId
  type
  subject
  description
  status
  priority
  response
  respondedAt
  respondedBy
  createdAt
  updatedAt
`;

/**
 * Get current user's support requests
 *
 * @param token - Clerk JWT token
 * @returns List of support requests
 */
export async function getMySupportRequests(
  token: string | null
): Promise<SupportRequest[]> {
  const data = await makeAuthenticatedRequest<{ mySupportRequests: SupportRequest[] }>(
    {
      query: `
        query MySupportRequests {
          mySupportRequests {
            ${SUPPORT_REQUEST_FIELDS}
          }
        }
      `,
    },
    token
  );

  return data.mySupportRequests;
}

/**
 * Get a single support request by ID
 *
 * @param id - Support request ID
 * @param token - Clerk JWT token
 * @returns Support request or null
 */
export async function getSupportRequest(
  id: string,
  token: string | null
): Promise<SupportRequest | null> {
  const data = await makeAuthenticatedRequest<{ supportRequest: SupportRequest | null }>(
    {
      query: `
        query GetSupportRequest($id: ID!) {
          supportRequest(id: $id) {
            ${SUPPORT_REQUEST_FIELDS}
          }
        }
      `,
      variables: { id },
    },
    token
  );

  return data.supportRequest;
}

/**
 * Create a new support request
 *
 * @param input - Support request details
 * @param token - Clerk JWT token
 * @returns Created support request
 */
export async function createSupportRequest(
  input: CreateSupportRequestInput,
  token: string | null
): Promise<SupportRequest> {
  const data = await makeAuthenticatedRequest<{ createSupportRequest: SupportRequest }>(
    {
      query: `
        mutation CreateSupportRequest($input: CreateSupportRequestInput!) {
          createSupportRequest(input: $input) {
            ${SUPPORT_REQUEST_FIELDS}
          }
        }
      `,
      variables: { input },
    },
    token
  );

  return data.createSupportRequest;
}
