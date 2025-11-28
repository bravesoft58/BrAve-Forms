import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * GraphQL endpoint for backend API
 */
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

/**
 * GraphQL query for fetching photos with filters
 * Extended to support search, user, form type, weather, and GPS radius filters
 */
const PHOTOS_BY_PROJECT_QUERY = `
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
      weather
      formType
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
 * - search: Search by description/tags
 * - userId: Filter by user who uploaded
 * - weather: Filter by weather conditions (comma-separated)
 * - gpsLat: GPS latitude for radius filter
 * - gpsLng: GPS longitude for radius filter
 * - gpsRadiusKm: GPS radius in kilometers
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hasGps = searchParams.get('hasGps');

    // New filter parameters with validation
    const search = searchParams.get('search');
    const filterUserId = searchParams.get('userId');
    const formType = searchParams.get('formType');
    const weatherRaw = searchParams.get('weather');
    const gpsLatRaw = searchParams.get('gpsLat');
    const gpsLngRaw = searchParams.get('gpsLng');
    const gpsRadiusKmRaw = searchParams.get('gpsRadiusKm');

    // Validate and parse GPS coordinates
    let gpsLat: number | undefined;
    let gpsLng: number | undefined;
    let gpsRadiusKm: number | undefined;

    if (gpsLatRaw || gpsLngRaw || gpsRadiusKmRaw) {
      // All three must be provided together
      if (!gpsLatRaw || !gpsLngRaw || !gpsRadiusKmRaw) {
        return NextResponse.json(
          { error: 'GPS filter requires all three parameters: gpsLat, gpsLng, and gpsRadiusKm' },
          { status: 400 }
        );
      }

      gpsLat = parseFloat(gpsLatRaw);
      gpsLng = parseFloat(gpsLngRaw);
      gpsRadiusKm = parseFloat(gpsRadiusKmRaw);

      // Check for NaN
      if (isNaN(gpsLat) || isNaN(gpsLng) || isNaN(gpsRadiusKm)) {
        return NextResponse.json(
          { error: 'GPS parameters must be valid numbers' },
          { status: 400 }
        );
      }

      // Validate coordinate ranges
      if (gpsLat < -90 || gpsLat > 90) {
        return NextResponse.json({ error: 'gpsLat must be between -90 and 90' }, { status: 400 });
      }
      if (gpsLng < -180 || gpsLng > 180) {
        return NextResponse.json({ error: 'gpsLng must be between -180 and 180' }, { status: 400 });
      }
      if (gpsRadiusKm <= 0 || gpsRadiusKm > 100) {
        return NextResponse.json(
          { error: 'gpsRadiusKm must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Sanitize weather array - only allow safe characters
    let weather: string[] | undefined;
    if (weatherRaw) {
      const validWeatherPattern = /^[a-zA-Z0-9\s-]+$/;
      weather = weatherRaw
        .split(',')
        .map((w) => w.trim())
        .filter((w) => w.length > 0 && w.length <= 50 && validWeatherPattern.test(w));
    }

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

    // Add new filter variables
    if (search) {
      variables.search = search;
    }
    if (filterUserId) {
      variables.userId = filterUserId;
    }
    if (formType) {
      variables.formType = formType;
    }
    if (weather && weather.length > 0) {
      variables.weather = weather;
    }
    if (gpsLat !== undefined && gpsLng !== undefined && gpsRadiusKm !== undefined) {
      variables.gpsLat = gpsLat;
      variables.gpsLng = gpsLng;
      variables.gpsRadiusKm = gpsRadiusKm;
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
      weather: photo.weather,
      formType: photo.formType,
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
