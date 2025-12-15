/**
 * TanStack Query hooks for projects
 *
 * Provides data fetching hooks with offline persistence for projects.
 *
 * @security All hooks require authentication
 * @offline Cached in TanStack Query for offline access
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  Project,
  ProjectStatus,
  GetProjectsParams,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/lib/api/projects';

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: GetProjectsParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Hook to fetch projects with optional filters
 *
 * @param params - Optional filters (status, take, skip)
 * @returns Query result with projects array
 *
 * @example
 * const { data: projects, isLoading } = useProjects({ status: 'ACTIVE' });
 *
 * @offline Returns cached data when offline
 */
export function useProjects(params?: GetProjectsParams) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: projectKeys.list(params || {}),
    queryFn: async () => {
      const token = getToken ? await getToken() : null;
      return getProjects(params, token);
    },
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to fetch a single project by ID
 *
 * @param id - Project ID
 * @returns Query result with project object
 *
 * @example
 * const { data: project, isLoading } = useProject('project-123');
 *
 * @offline Returns cached data when offline
 */
export function useProject(id: string | undefined) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: projectKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      const token = getToken ? await getToken() : null;
      return getProjectById(id, token);
    },
    enabled: isSignedIn && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to fetch projects by status
 *
 * Convenience wrapper around useProjects with status filter.
 *
 * @param status - Project status to filter by
 * @returns Query result with projects array
 *
 * @example
 * const { data: activeProjects } = useProjectsByStatus('ACTIVE');
 */
export function useProjectsByStatus(status: ProjectStatus) {
  return useProjects({ status });
}

/**
 * Hook to prefetch a project (useful for hover/preview)
 *
 * @returns Function to prefetch project by ID
 */
export function usePrefetchProject() {
  const queryClient = useQueryClient();
  const { getToken } = useAppAuth();

  return async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: projectKeys.detail(id),
      queryFn: async () => {
        const token = getToken ? await getToken() : null;
        return getProjectById(id, token);
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate project cache
 *
 * Use after creating/updating projects to refresh data.
 *
 * @returns Function to invalidate project cache
 */
export function useInvalidateProjects() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.all });
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a new project
 *
 * @returns Mutation result with create function
 *
 * @security Requires MANAGER role or above
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { getToken } = useAppAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      console.log('[useCreateProject] Starting mutation with input:', input);
      console.log('[useCreateProject] getToken function available:', !!getToken);

      let token: string | null = null;
      try {
        token = getToken ? await getToken() : null;
        console.log(
          '[useCreateProject] Token retrieved:',
          token ? `${token.substring(0, 20)}...` : 'null'
        );
      } catch (tokenError) {
        console.error('[useCreateProject] Error getting token:', tokenError);
        throw new Error(
          `Failed to get authentication token: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`
        );
      }

      console.log('[useCreateProject] Calling createProject API...');
      return createProject(input, token);
    },
    onSuccess: (data) => {
      console.log('[useCreateProject] Mutation succeeded, invalidating queries:', data);
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      console.error('[useCreateProject] Mutation failed:', error);
    },
  });
}

/**
 * Hook to update an existing project
 *
 * @returns Mutation result with update function
 *
 * @security Requires MANAGER role or above
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { getToken } = useAppAuth();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateProjectInput }) => {
      const token = getToken ? await getToken() : null;
      return updateProject(id, input, token);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(projectKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook to delete a project
 *
 * @returns Mutation result with delete function
 *
 * @security Requires ADMIN role or above
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { getToken } = useAppAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = getToken ? await getToken() : null;
      return deleteProject(id, token);
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Re-export types for convenience
export type { Project, ProjectStatus, GetProjectsParams, CreateProjectInput, UpdateProjectInput };
