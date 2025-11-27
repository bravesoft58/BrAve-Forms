'use client';

/**
 * Inspector Portal Hooks - Sprint 5 ISSUE-165
 *
 * React Query hooks for the inspector portal.
 * Fetches submissions and photos using QR token authentication.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getInspectorSubmissions,
  getInspectorPhotos,
  InspectorSubmission,
  InspectorPhoto,
  QRPortalAPIError,
} from '@/lib/api/qr-portal';

/**
 * Hook to fetch inspector submissions
 *
 * @param token - QR token for authentication
 * @param enabled - Whether to enable the query (requires valid token)
 */
export function useInspectorSubmissions(token: string | null, enabled = true) {
  return useQuery<InspectorSubmission[], QRPortalAPIError>({
    queryKey: ['inspector', 'submissions', token],
    queryFn: async () => {
      if (!token) {
        throw new QRPortalAPIError('No token provided', 'NO_TOKEN');
      }
      return getInspectorSubmissions(token);
    },
    enabled: !!token && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - submissions should be reasonably fresh
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof QRPortalAPIError) {
        if (['TOKEN_EXPIRED', 'TOKEN_REVOKED', 'TOKEN_NOT_FOUND'].includes(error.code)) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch inspector photos
 *
 * @param token - QR token for authentication
 * @param enabled - Whether to enable the query (requires valid token)
 */
export function useInspectorPhotos(token: string | null, enabled = true) {
  return useQuery<InspectorPhoto[], QRPortalAPIError>({
    queryKey: ['inspector', 'photos', token],
    queryFn: async () => {
      if (!token) {
        throw new QRPortalAPIError('No token provided', 'NO_TOKEN');
      }
      return getInspectorPhotos(token);
    },
    enabled: !!token && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - photos should be reasonably fresh
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof QRPortalAPIError) {
        if (['TOKEN_EXPIRED', 'TOKEN_REVOKED', 'TOKEN_NOT_FOUND'].includes(error.code)) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

// Re-export types for convenience
export type {
  InspectorSubmission,
  InspectorPhoto,
  InspectorFormField,
  InspectorFormSection,
  InspectorGeoLocation,
} from '@/lib/api/qr-portal';
