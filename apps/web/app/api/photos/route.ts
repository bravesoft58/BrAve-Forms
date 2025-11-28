import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * GraphQL endpoint for backend API
 */
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

/**
 * GraphQL query for fetching photos with filters
 */
const PHOTOS_BY_PROJECT_QUERY = `
  query PhotosByProject(
    $projectId: String!
    $startDate: DateTime
    $endDate: DateTime
    $hasGps: Boolean
    $take: Int
    $skip: Int
  ) {
    photosByProject(
      projectId: $projectId
      startDate: $startDate
      endDate: $endDate
      hasGps: $hasGps
      take: $take
      skip: $skip
    ) {
      id
      s3Key
      thumbnailKey
      latitude
      longitude
      takenAt
      caption
      fileSize
      mimeType
      uploadedBy
      uploadedAt
    }
  }
`;

/**
 * GET /api/photos - Fetch photos with pagination and filters
 *
 * Query Parameters:
 * - projectId: Filter by project (required for now)
 * - skip: Pagination offset (default: 0)
 * - take: Pagination limit (default: 20)
 * - formType: Filter by form type
 * - startDate: Filter by date range start
 * - endDate: Filter by date range end
 * - hasGps: Filter by GPS coordinates presence
 *
 * Security:
 * - Requires valid Clerk JWT with orgId
 * - Backend validates orgId ownership of project
 * - Multi-tenant isolation enforced at API and database layers
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication context with orgId for multi-tenant isolation
    const { userId, orgId, getToken } = await auth();
    const token = await getToken();

    // Validate authentication - require both userId and orgId for multi-tenancy
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - organization context required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '20', 10);
    const projectId = searchParams.get('projectId');
    // TODO: Add formType filter to GraphQL query (ISSUE-128 follow-up)
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hasGps = searchParams.get('hasGps');

    // If no projectId, we need a different query to fetch all photos
    // For now, return empty if no projectId (to be implemented in backend)
    if (!projectId) {
      return NextResponse.json({
        photos: [],
        hasMore: false,
        totalCount: 0,
      });
    }

    // Build GraphQL variables
    const variables: Record<string, unknown> = {
      projectId,
      skip,
      take,
    };

    if (startDate) {
      variables.startDate = new Date(startDate).toISOString();
    }
    if (endDate) {
      variables.endDate = new Date(endDate).toISOString();
    }
    if (hasGps === 'true') {
      variables.hasGps = true;
    }

    // Execute GraphQL query
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: PHOTOS_BY_PROJECT_QUERY,
        variables,
      }),
    });

    if (!response.ok) {
      console.error(
        `GraphQL request failed for org ${orgId}, project ${projectId}:`,
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: `Failed to fetch photos for project ${projectId}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.errors) {
      console.error(`GraphQL errors for org ${orgId}, project ${projectId}:`, result.errors);
      return NextResponse.json(
        { error: result.errors[0]?.message || 'Failed to query photos' },
        { status: 400 }
      );
    }

    const photos = result.data?.photosByProject || [];

    // Generate URLs for photos
    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const bucketName = process.env.S3_BUCKET_NAME || 'braveforms-photos';

    const photosWithUrls = photos.map((photo: Record<string, unknown>) => ({
      id: photo.id,
      url: photo.s3Key ? `${s3Endpoint}/${bucketName}/${photo.s3Key}` : '',
      thumbnailUrl: photo.thumbnailKey
        ? `${s3Endpoint}/${bucketName}/${photo.thumbnailKey}`
        : photo.s3Key
          ? `${s3Endpoint}/${bucketName}/${photo.s3Key}`
          : '',
      caption: photo.caption,
      latitude: photo.latitude,
      longitude: photo.longitude,
      takenAt: photo.takenAt,
      uploadedAt: photo.uploadedAt,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      uploadedBy: photo.uploadedBy,
    }));

    return NextResponse.json({
      photos: photosWithUrls,
      hasMore: photos.length === take,
      totalCount: photos.length, // Note: Backend should return total count for accurate pagination
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching photos' },
      { status: 500 }
    );
  }
}
