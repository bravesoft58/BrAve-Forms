/**
 * Shared Photo API utilities for BrAve Forms
 *
 * These utilities are used across photo components for consistent
 * API parameter building and data fetching.
 */

/**
 * Filter options for photo queries
 */
export interface PhotoFilters {
  projectId?: string;
  formType?: string;
  dateRange?: [Date, Date];
  hasGps?: boolean;
}

/**
 * Pagination options for photo queries
 */
export interface PhotoPagination {
  skip?: number;
  take?: number;
}

/**
 * Build URLSearchParams for photo API requests
 *
 * @param filters - Optional filter criteria
 * @param pagination - Optional pagination settings
 * @returns URLSearchParams ready for API request
 *
 * @example
 * const params = buildPhotoParams({ projectId: '123' }, { skip: 0, take: 20 });
 * fetch(`/api/photos?${params.toString()}`);
 */
export function buildPhotoParams(
  filters?: PhotoFilters,
  pagination?: PhotoPagination
): URLSearchParams {
  const params = new URLSearchParams();

  // Pagination
  if (pagination?.skip !== undefined) {
    params.set('skip', String(pagination.skip));
  }
  if (pagination?.take !== undefined) {
    params.set('take', String(pagination.take));
  }

  // Filters
  if (filters?.projectId) {
    params.set('projectId', filters.projectId);
  }
  if (filters?.formType) {
    params.set('formType', filters.formType);
  }
  if (filters?.hasGps !== undefined) {
    params.set('hasGps', String(filters.hasGps));
  }
  if (filters?.dateRange) {
    params.set('startDate', filters.dateRange[0].toISOString());
    params.set('endDate', filters.dateRange[1].toISOString());
  }

  return params;
}

/**
 * Photo response from API
 */
export interface PhotoResponse {
  photos: Photo[];
  total: number;
  hasMore: boolean;
}

/**
 * Photo type matching backend GraphQL schema
 */
export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  latitude?: number | null;
  longitude?: number | null;
  takenAt: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  formName?: string;
  projectName?: string;
}

/**
 * Fetch photos from API with filters and pagination
 *
 * @param filters - Optional filter criteria
 * @param pagination - Optional pagination settings
 * @returns Promise resolving to PhotoResponse
 * @throws Error if API request fails
 *
 * @example
 * const response = await fetchPhotos({ projectId: '123' }, { skip: 0, take: 20 });
 * console.log(response.photos);
 */
export async function fetchPhotos(
  filters?: PhotoFilters,
  pagination?: PhotoPagination
): Promise<PhotoResponse> {
  const params = buildPhotoParams(filters, pagination);

  const response = await fetch(`/api/photos?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch photos: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    photos: data.photos || [],
    total: data.total || 0,
    hasMore: data.hasMore || false,
  };
}

/**
 * Fetch all photos for map view (larger batch)
 *
 * @param filters - Optional filter criteria
 * @returns Promise resolving to array of Photos
 * @throws Error if API request fails
 *
 * @example
 * const photos = await fetchAllPhotosForMap({ hasGps: true });
 */
export async function fetchAllPhotosForMap(filters?: PhotoFilters): Promise<Photo[]> {
  const response = await fetchPhotos(filters, { take: 100 });
  return response.photos;
}
