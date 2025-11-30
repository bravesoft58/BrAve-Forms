/**
 * Photos API helpers for fetching and managing photos via GraphQL
 *
 * ISSUE-171: Migrated from REST endpoint to GraphQL
 *
 * @security All functions require Clerk JWT authentication
 * @multi-tenancy All queries automatically filtered by orgId from JWT
 */

import { makeAuthenticatedRequest } from './client';

export type StorageType = 'S3' | 'LOCAL' | 'AZURE';

/**
 * Photo type matching backend GraphQL schema
 * CRITICAL: orgId is required for multi-tenant data isolation
 */
export interface Photo {
  id: string;
  orgId: string;
  inspectionId: string;
  s3Key?: string;
  thumbnailKey?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  takenAt: string;
  caption?: string;
  fileSize: number;
  mimeType: string;
  storageType: StorageType;
  deviceModel?: string;
  deviceMake?: string;
  uploadedBy: string;
  uploadedAt: string;
  weather?: string;
  formType?: string;
  // Computed URLs (generated on frontend from s3Key)
  url?: string;
  thumbnailUrl?: string;
}

/**
 * Photo pair for before/after comparison
 * ISSUE-172: Used for construction progress tracking and EPA compliance documentation
 */
export interface PhotoPair {
  id: string;
  orgId: string;
  projectId: string;
  beforePhotoId: string;
  afterPhotoId: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Input for creating a photo pair
 */
export interface CreatePhotoPairInput {
  projectId: string;
  beforePhotoId: string;
  afterPhotoId: string;
  description?: string;
}

/**
 * Filter options for fetching photos
 */
export interface PhotoFilters {
  projectId?: string;
  inspectionId?: string;
  startDate?: Date;
  endDate?: Date;
  hasGps?: boolean;
  search?: string;
  userId?: string;
  formType?: string;
  weather?: string[];
  gpsLat?: number;
  gpsLng?: number;
  gpsRadiusKm?: number;
}

/**
 * Pagination parameters for photo queries
 */
export interface PhotoPagination {
  take?: number;
  skip?: number;
}

/**
 * Response type for paginated photos
 */
export interface PhotosResponse {
  photos: Photo[];
  hasMore: boolean;
  totalCount: number;
  nextCursor?: number;
}

/**
 * Input for uploading a photo via base64
 */
export interface UploadPhotoInput {
  base64: string;
  format?: string;
  projectId?: string;
  submissionId?: string;
  fieldName?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Result from photo upload
 */
export interface PhotoUploadResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
  mimeType: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
}

// S3 endpoint for generating URLs (should come from env in production)
const S3_ENDPOINT = process.env.NEXT_PUBLIC_S3_ENDPOINT || 'http://localhost:9000';
const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'braveforms-photos';

/**
 * Generate full URL from S3 key
 */
function generatePhotoUrl(s3Key?: string): string | undefined {
  if (!s3Key) return undefined;
  return `${S3_ENDPOINT}/${S3_BUCKET}/${s3Key}`;
}

/**
 * Transform backend photo to include computed URLs
 */
function transformPhoto(photo: Photo): Photo {
  return {
    ...photo,
    url: generatePhotoUrl(photo.s3Key),
    thumbnailUrl: generatePhotoUrl(photo.thumbnailKey) || generatePhotoUrl(photo.s3Key),
  };
}

/**
 * Get photos by project ID with optional filters
 *
 * @param projectId - Project ID to filter photos
 * @param filters - Optional filters (date range, GPS, etc.)
 * @param pagination - Optional pagination (take, skip)
 * @param token - Clerk JWT token
 * @returns Promise resolving to array of photos
 *
 * @security Requires valid Clerk JWT with orgId claim
 * @multi-tenancy Returns only photos for user's organization
 */
export async function getPhotosByProject(
  projectId: string,
  filters: Omit<PhotoFilters, 'projectId'> | undefined,
  pagination: PhotoPagination | undefined,
  token: string | null
): Promise<PhotosResponse> {
  const data = await makeAuthenticatedRequest<{ photosByProject: Photo[] }>(
    {
      query: `
        query PhotosByProject(
          $projectId: String!
          $startDate: DateTime
          $endDate: DateTime
          $hasGps: Boolean
          $take: Int
          $skip: Int
          $search: String
          $userId: String
          $formType: String
          $weather: [String!]
          $gpsLat: Float
          $gpsLng: Float
          $gpsRadiusKm: Float
        ) {
          photosByProject(
            projectId: $projectId
            startDate: $startDate
            endDate: $endDate
            hasGps: $hasGps
            take: $take
            skip: $skip
            search: $search
            userId: $userId
            formType: $formType
            weather: $weather
            gpsLat: $gpsLat
            gpsLng: $gpsLng
            gpsRadiusKm: $gpsRadiusKm
          ) {
            id
            orgId
            inspectionId
            s3Key
            thumbnailKey
            latitude
            longitude
            altitude
            takenAt
            caption
            fileSize
            mimeType
            storageType
            deviceModel
            deviceMake
            uploadedBy
            uploadedAt
            weather
            formType
          }
        }
      `,
      variables: {
        projectId,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
        hasGps: filters?.hasGps,
        take: pagination?.take,
        skip: pagination?.skip,
        search: filters?.search,
        userId: filters?.userId,
        formType: filters?.formType,
        weather: filters?.weather,
        gpsLat: filters?.gpsLat,
        gpsLng: filters?.gpsLng,
        gpsRadiusKm: filters?.gpsRadiusKm,
      },
    },
    token
  );

  const photos = (data.photosByProject || []).map(transformPhoto);
  const pageSize = pagination?.take || 20;

  return {
    photos,
    hasMore: photos.length === pageSize,
    totalCount: photos.length, // Backend doesn't return total count, estimate from results
    nextCursor: pagination?.skip ? pagination.skip + photos.length : photos.length,
  };
}

/**
 * Get photos by inspection ID
 *
 * @param inspectionId - Inspection ID
 * @param token - Clerk JWT token
 * @returns Promise resolving to array of photos
 */
export async function getPhotosByInspection(
  inspectionId: string,
  token: string | null
): Promise<Photo[]> {
  const data = await makeAuthenticatedRequest<{ photos: Photo[] }>(
    {
      query: `
        query PhotosByInspection($inspectionId: String!) {
          photos(inspectionId: $inspectionId) {
            id
            orgId
            inspectionId
            s3Key
            thumbnailKey
            latitude
            longitude
            altitude
            takenAt
            caption
            fileSize
            mimeType
            storageType
            deviceModel
            deviceMake
            uploadedBy
            uploadedAt
            weather
            formType
          }
        }
      `,
      variables: { inspectionId },
    },
    token
  );

  return (data.photos || []).map(transformPhoto);
}

/**
 * Get a single photo by ID
 *
 * @param id - Photo ID
 * @param token - Clerk JWT token
 * @returns Promise resolving to photo
 */
export async function getPhoto(id: string, token: string | null): Promise<Photo> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid photo ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ photo: Photo }>(
    {
      query: `
        query Photo($id: String!) {
          photo(id: $id) {
            id
            orgId
            inspectionId
            s3Key
            thumbnailKey
            latitude
            longitude
            altitude
            takenAt
            caption
            fileSize
            mimeType
            storageType
            deviceModel
            deviceMake
            uploadedBy
            uploadedAt
            weather
            formType
          }
        }
      `,
      variables: { id },
    },
    token
  );

  return transformPhoto(data.photo);
}

/**
 * Upload a photo from base64 data
 *
 * @param input - Upload input with base64 data and metadata
 * @param token - Clerk JWT token
 * @returns Promise resolving to upload result
 */
export async function uploadPhoto(
  input: UploadPhotoInput,
  token: string | null
): Promise<PhotoUploadResult> {
  if (!input.base64 || input.base64.length === 0) {
    throw new Error('Base64 image data is required');
  }

  const data = await makeAuthenticatedRequest<{ uploadPhoto: PhotoUploadResult }>(
    {
      query: `
        mutation UploadPhoto($input: UploadPhotoBase64Input!) {
          uploadPhoto(input: $input) {
            id
            url
            thumbnailUrl
            filename
            size
            mimeType
            latitude
            longitude
            takenAt
          }
        }
      `,
      variables: {
        input: {
          base64: input.base64,
          format: input.format || 'jpeg',
          projectId: input.projectId,
          submissionId: input.submissionId,
          fieldName: input.fieldName,
          caption: input.caption,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      },
    },
    token
  );

  return data.uploadPhoto;
}

/**
 * Delete a photo
 *
 * @param id - Photo ID to delete
 * @param token - Clerk JWT token
 * @returns Promise resolving to true on success
 */
export async function deletePhoto(id: string, token: string | null): Promise<boolean> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid photo ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ deletePhoto: boolean }>(
    {
      query: `
        mutation DeletePhoto($id: String!) {
          deletePhoto(id: $id)
        }
      `,
      variables: { id },
    },
    token
  );

  return data.deletePhoto;
}

// ISSUE-172: Photo Pairing API Functions

/**
 * Get photo pairs for a project
 *
 * @param projectId - Project ID
 * @param token - Clerk JWT token
 * @returns Promise resolving to array of photo pairs
 */
export async function getPhotoPairsByProject(
  projectId: string,
  token: string | null
): Promise<PhotoPair[]> {
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    throw new Error('Invalid project ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ photoPairsByProject: PhotoPair[] }>(
    {
      query: `
        query PhotoPairsByProject($projectId: String!) {
          photoPairsByProject(projectId: $projectId) {
            id
            orgId
            projectId
            beforePhotoId
            afterPhotoId
            description
            createdBy
            createdAt
          }
        }
      `,
      variables: { projectId },
    },
    token
  );

  return data.photoPairsByProject || [];
}

/**
 * Create a photo pair for before/after comparison
 *
 * @param input - Photo pair input
 * @param token - Clerk JWT token
 * @returns Promise resolving to created photo pair
 */
export async function createPhotoPair(
  input: CreatePhotoPairInput,
  token: string | null
): Promise<PhotoPair> {
  if (!input.projectId || !input.beforePhotoId || !input.afterPhotoId) {
    throw new Error('projectId, beforePhotoId, and afterPhotoId are required');
  }

  const data = await makeAuthenticatedRequest<{ createPhotoPair: PhotoPair }>(
    {
      query: `
        mutation CreatePhotoPair($input: CreatePhotoPairInput!) {
          createPhotoPair(input: $input) {
            id
            orgId
            projectId
            beforePhotoId
            afterPhotoId
            description
            createdBy
            createdAt
          }
        }
      `,
      variables: { input },
    },
    token
  );

  return data.createPhotoPair;
}

/**
 * Delete a photo pair
 *
 * @param id - Photo pair ID to delete
 * @param token - Clerk JWT token
 * @returns Promise resolving to true on success
 */
export async function deletePhotoPair(id: string, token: string | null): Promise<boolean> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid photo pair ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ deletePhotoPair: boolean }>(
    {
      query: `
        mutation DeletePhotoPair($id: String!) {
          deletePhotoPair(id: $id)
        }
      `,
      variables: { id },
    },
    token
  );

  return data.deletePhotoPair;
}
