/**
 * TanStack Query hooks for form templates
 *
 * Provides data fetching hooks with offline persistence for form templates.
 *
 * @security All hooks require authentication
 * @offline Cached in TanStack Query for offline access
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  getFormTemplates,
  getFormTemplateById,
  FormTemplate,
  FormCategory,
  GetFormTemplatesParams,
} from '@/lib/api/forms';

// Query keys for cache management
export const formTemplateKeys = {
  all: ['formTemplates'] as const,
  lists: () => [...formTemplateKeys.all, 'list'] as const,
  list: (params: GetFormTemplatesParams) => [...formTemplateKeys.lists(), params] as const,
  details: () => [...formTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...formTemplateKeys.details(), id] as const,
};

/**
 * Hook to fetch form templates with optional filters
 *
 * @param params - Optional filters (category, isActive, take, skip)
 * @returns Query result with templates array
 *
 * @example
 * const { data: templates, isLoading } = useFormTemplates({ category: 'EPA_SWPPP' });
 *
 * @offline Returns cached data when offline
 */
export function useFormTemplates(params?: GetFormTemplatesParams) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: formTemplateKeys.list(params || {}),
    queryFn: async () => {
      const token = getToken ? await getToken() : null;
      return getFormTemplates(params, token);
    },
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to fetch a single form template by ID
 *
 * @param id - Template ID
 * @returns Query result with template object
 *
 * @example
 * const { data: template, isLoading } = useFormTemplate('template-123');
 *
 * @offline Returns cached data when offline
 */
export function useFormTemplate(id: string | undefined) {
  const { getToken, isSignedIn } = useAppAuth();

  return useQuery({
    queryKey: formTemplateKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Template ID is required');
      const token = getToken ? await getToken() : null;
      return getFormTemplateById(id, token);
    },
    enabled: isSignedIn && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes (templates change less frequently)
    gcTime: 60 * 60 * 1000, // 1 hour
    networkMode: 'offlineFirst',
  });
}

/**
 * Hook to fetch templates by category
 *
 * Convenience wrapper around useFormTemplates with category filter.
 *
 * @param category - Form category to filter by
 * @returns Query result with templates array
 *
 * @example
 * const { data: swpppTemplates } = useFormTemplatesByCategory('EPA_SWPPP');
 */
export function useFormTemplatesByCategory(category: FormCategory) {
  return useFormTemplates({ category, isActive: true });
}

/**
 * Hook to prefetch a template (useful for hover/preview)
 *
 * @returns Function to prefetch template by ID
 *
 * @example
 * const prefetchTemplate = usePrefetchTemplate();
 * onMouseEnter={() => prefetchTemplate('template-123')}
 */
export function usePrefetchTemplate() {
  const queryClient = useQueryClient();
  const { getToken } = useAppAuth();

  return async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: formTemplateKeys.detail(id),
      queryFn: async () => {
        const token = getToken ? await getToken() : null;
        return getFormTemplateById(id, token);
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate template cache
 *
 * Use after creating/updating templates to refresh data.
 *
 * @returns Function to invalidate template cache
 *
 * @example
 * const invalidateTemplates = useInvalidateTemplates();
 * onTemplateCreated(() => invalidateTemplates());
 */
export function useInvalidateTemplates() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: formTemplateKeys.all });
  };
}

// Re-export types for convenience
export type { FormTemplate, FormCategory, GetFormTemplatesParams };
