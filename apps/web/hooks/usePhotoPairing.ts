/**
 * TanStack Query hooks for Photo Pairing
 *
 * ISSUE-172: Photo Pairing for Before/After Comparison
 *
 * Provides:
 * - usePhotoPairsByProject - Get photo pairs for a project
 * - useCreatePhotoPair - Create a new photo pair
 * - useDeletePhotoPair - Delete a photo pair
 *
 * Used for construction progress tracking and EPA compliance documentation.
 * All hooks use offlineFirst networkMode for 30-day offline capability.
 *
 * @security Uses Clerk JWT authentication via useAppAuth()
 * @multi-tenancy All queries filtered by orgId from JWT
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  getPhotoPairsByProject,
  createPhotoPair,
  deletePhotoPair,
  type PhotoPair,
  type CreatePhotoPairInput,
} from '@/lib/api/photos';
import { photoKeys } from './usePhotos';

/**
 * Query key factory for photo pairs
 * Ensures consistent cache key generation across all photo pair queries
 */
export const photoPairKeys = {
  all: ['photoPairs'] as const,
  byProject: (projectId: string) => [...photoPairKeys.all, 'project', projectId] as const,
};

/**
 * Hook for fetching photo pairs by project
 *
 * @param projectId - Project ID to filter photo pairs
 * @returns Query result with photo pairs array
 *
 * @example
 * const { data: pairs, isLoading } = usePhotoPairsByProject('project-123');
 * pairs?.forEach(pair => console.log(pair.beforePhotoId, pair.afterPhotoId));
 */
export function usePhotoPairsByProject(projectId: string | undefined) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery<PhotoPair[]>({
    queryKey: photoPairKeys.byProject(projectId || ''),
    queryFn: async () => {
      const token = getToken ? await getToken() : null;
      return getPhotoPairsByProject(projectId!, token);
    },
    enabled: isSignedIn && !!projectId,
    // Offline-first configuration for 30-day capability
    networkMode: 'offlineFirst',
    staleTime: 1000 * 60 * 60, // 1 hour - pairs rarely change
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days - EPA compliance requirement
  });
}

/**
 * Hook for creating a photo pair
 *
 * @returns Mutation for creating photo pairs
 *
 * @example
 * const { mutateAsync: create } = useCreatePhotoPair();
 * const pair = await create({
 *   projectId: 'project-123',
 *   beforePhotoId: 'photo-1',
 *   afterPhotoId: 'photo-2',
 *   description: 'Site progress comparison',
 * });
 */
export function useCreatePhotoPair() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation<PhotoPair, Error, CreatePhotoPairInput>({
    mutationFn: async (input) => {
      const token = getToken ? await getToken() : null;
      return createPhotoPair(input, token);
    },
    onSuccess: (_data, variables) => {
      // Invalidate photo pairs for the project
      queryClient.invalidateQueries({
        queryKey: photoPairKeys.byProject(variables.projectId),
      });
      // Also invalidate all photo pairs (in case there's a global list)
      queryClient.invalidateQueries({
        queryKey: photoPairKeys.all,
      });
    },
  });
}

/**
 * Hook for deleting a photo pair
 *
 * @returns Mutation for deleting photo pairs
 *
 * @example
 * const { mutateAsync: remove } = useDeletePhotoPair();
 * await remove({ id: 'pair-123', projectId: 'project-123' });
 */
export function useDeletePhotoPair() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; projectId: string }>({
    mutationFn: async ({ id }) => {
      const token = getToken ? await getToken() : null;
      return deletePhotoPair(id, token);
    },
    onSuccess: (_data, variables) => {
      // Invalidate photo pairs for the project
      queryClient.invalidateQueries({
        queryKey: photoPairKeys.byProject(variables.projectId),
      });
      // Also invalidate all photo pairs
      queryClient.invalidateQueries({
        queryKey: photoPairKeys.all,
      });
    },
  });
}

// Re-export types for convenience
export type { PhotoPair, CreatePhotoPairInput };
