/**
 * TanStack Query hooks for Photos
 *
 * ISSUE-171: Migrated from REST endpoint to GraphQL with TanStack Query
 *
 * Provides:
 * - usePhotosByProject - Infinite scroll photos by project
 * - usePhotosByInspection - Photos for a specific inspection
 * - usePhoto - Single photo by ID
 * - useUploadPhoto - Photo upload mutation
 * - useDeletePhoto - Photo delete mutation
 *
 * All hooks use offlineFirst networkMode for 30-day offline capability.
 *
 * @security Uses Clerk JWT authentication via useAppAuth()
 * @multi-tenancy All queries filtered by orgId from JWT
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  getPhotosByProject,
  getPhotosByInspection,
  getPhoto,
  uploadPhoto,
  deletePhoto,
  type Photo,
  type PhotoFilters,
  type PhotoPagination,
  type PhotosResponse,
  type UploadPhotoInput,
  type PhotoUploadResult,
} from '@/lib/api/photos';

/**
 * Query key factory for photos
 * Ensures consistent cache key generation across all photo queries
 */
export const photoKeys = {
  all: ['photos'] as const,
  byProject: (projectId: string, filters?: PhotoFilters) =>
    [...photoKeys.all, 'project', projectId, filters] as const,
  byInspection: (inspectionId: string) =>
    [...photoKeys.all, 'inspection', inspectionId] as const,
  detail: (id: string) => [...photoKeys.all, 'detail', id] as const,
};

/**
 * Hook for fetching photos by project with infinite scroll
 *
 * Uses useInfiniteQuery for paginated loading with scroll-to-load-more.
 *
 * @param projectId - Project ID to filter photos
 * @param filters - Optional filters (date range, GPS, etc.)
 * @param pageSize - Number of photos per page (default 20)
 * @returns Infinite query result with photos and pagination helpers
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = usePhotosByProject('project-123', {
 *   hasGps: true,
 *   startDate: new Date('2025-01-01'),
 * });
 */
export function usePhotosByProject(
  projectId: string | undefined,
  filters?: Omit<PhotoFilters, 'projectId'>,
  pageSize = 20
) {
  const { getToken, isSignedIn } = useAppAuth();

  return useInfiniteQuery<PhotosResponse>({
    queryKey: photoKeys.byProject(projectId || '', filters),
    queryFn: async ({ pageParam = 0 }) => {
      const token = getToken ? await getToken() : null;
      return getPhotosByProject(
        projectId!,
        filters,
        { take: pageSize, skip: pageParam as number },
        token
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      const totalLoaded = allPages.reduce((acc, page) => acc + page.photos.length, 0);
      return totalLoaded;
    },
    initialPageParam: 0,
    enabled: isSignedIn && !!projectId,
    // Offline-first configuration for 30-day capability
    networkMode: 'offlineFirst',
    staleTime: 1000 * 60 * 60, // 1 hour - photos rarely change
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days - EPA compliance requirement
  });
}

/**
 * Hook for fetching photos by inspection ID
 *
 * @param inspectionId - Inspection ID
 * @returns Query result with photos array
 */
export function usePhotosByInspection(inspectionId: string | null) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery<Photo[]>({
    queryKey: photoKeys.byInspection(inspectionId || ''),
    queryFn: async () => {
      const token = getToken ? await getToken() : null;
      return getPhotosByInspection(inspectionId!, token);
    },
    enabled: isSignedIn && !!inspectionId,
    networkMode: 'offlineFirst',
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24 * 30,
  });
}

/**
 * Hook for fetching a single photo by ID
 *
 * @param id - Photo ID
 * @returns Query result with photo data
 */
export function usePhoto(id: string | null) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery<Photo | null>({
    queryKey: photoKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const token = getToken ? await getToken() : null;
      return getPhoto(id, token);
    },
    enabled: isSignedIn && !!id,
    networkMode: 'offlineFirst',
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook for uploading photos via base64
 *
 * @returns Mutation for uploading photos
 *
 * @example
 * const { mutateAsync: upload } = useUploadPhoto();
 * const result = await upload({
 *   base64: 'image-data...',
 *   projectId: 'project-123',
 *   caption: 'Site inspection photo',
 * });
 */
export function useUploadPhoto() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation<PhotoUploadResult, Error, UploadPhotoInput>({
    mutationFn: async (input) => {
      const token = getToken ? await getToken() : null;
      return uploadPhoto(input, token);
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant photo queries
      queryClient.invalidateQueries({ queryKey: photoKeys.all });

      // If projectId was provided, specifically invalidate that project's photos
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: photoKeys.byProject(variables.projectId),
        });
      }
    },
  });
}

/**
 * Hook for deleting photos
 *
 * @returns Mutation for deleting photos
 *
 * @example
 * const { mutateAsync: remove } = useDeletePhoto();
 * await remove('photo-123');
 */
export function useDeletePhoto() {
  const { getToken } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: async (id) => {
      const token = getToken ? await getToken() : null;
      return deletePhoto(id, token);
    },
    onSuccess: () => {
      // Invalidate all photo queries
      queryClient.invalidateQueries({ queryKey: photoKeys.all });
    },
  });
}

// Re-export types for convenience
export type { Photo, PhotoFilters, PhotosResponse, UploadPhotoInput, PhotoUploadResult };
