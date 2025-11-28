'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Stack,
  Loader,
  Center,
  Badge,
  Group,
  Alert,
} from '@mantine/core';
import { useInView } from 'react-intersection-observer';
import { useEffect, useCallback } from 'react';
import { IconMapPin, IconAlertCircle, IconPhoto } from '@tabler/icons-react';

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
 * Filter options for photo gallery
 */
export interface PhotoFilters {
  formType?: string;
  dateRange?: [Date, Date];
  userId?: string;
  hasGps?: boolean;
}

/**
 * API response for paginated photos
 */
interface PhotosResponse {
  photos: Photo[];
  hasMore: boolean;
  totalCount: number;
  nextCursor?: number;
}

/**
 * Props for PhotoGalleryGrid component
 */
interface PhotoGalleryGridProps {
  projectId?: string;
  filters?: PhotoFilters;
  onPhotoClick?: (photo: Photo) => void;
  pageSize?: number;
}

/**
 * Fetch photos from API with pagination and filters
 */
async function fetchPhotos(
  projectId: string | undefined,
  cursor: number,
  pageSize: number,
  filters?: PhotoFilters
): Promise<PhotosResponse> {
  const params = new URLSearchParams();
  params.set('skip', String(cursor));
  params.set('take', String(pageSize));

  if (projectId) {
    params.set('projectId', projectId);
  }

  if (filters?.formType) {
    params.set('formType', filters.formType);
  }

  if (filters?.userId) {
    params.set('userId', filters.userId);
  }

  if (filters?.hasGps !== undefined) {
    params.set('hasGps', String(filters.hasGps));
  }

  if (filters?.dateRange) {
    params.set('startDate', filters.dateRange[0].toISOString());
    params.set('endDate', filters.dateRange[1].toISOString());
  }

  const response = await fetch(`/api/photos?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch photos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
}

/**
 * PhotoGalleryGrid - Responsive photo gallery with infinite scroll
 *
 * Features:
 * - Responsive grid (2-6 columns based on viewport)
 * - Infinite scroll with TanStack Query
 * - GPS badge for photos with coordinates
 * - Keyboard accessible (Enter/Space to select)
 * - Loading, empty, and error states
 */
export function PhotoGalleryGrid({
  projectId,
  filters,
  onPhotoClick,
  pageSize = 20,
}: PhotoGalleryGridProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useInfiniteQuery({
      queryKey: ['photos', projectId, filters],
      queryFn: async ({ pageParam = 0 }) => {
        return fetchPhotos(projectId, pageParam, pageSize, filters);
      },
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage.hasMore) return undefined;
        // Calculate next cursor based on all loaded photos
        const totalLoaded = allPages.reduce((acc, page) => acc + page.photos.length, 0);
        return totalLoaded;
      },
      initialPageParam: 0,
    });

  // Trigger fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle keyboard navigation for photo cards
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, photo: Photo) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onPhotoClick?.(photo);
      }
    },
    [onPhotoClick]
  );

  // Loading state
  if (isLoading) {
    return (
      <Center h={400} data-testid="photo-gallery-loading">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading photos...</Text>
        </Stack>
      </Center>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error loading photos"
        color="red"
        data-testid="photo-gallery-error"
      >
        {error instanceof Error ? error.message : 'Failed to load photos. Please try again.'}
      </Alert>
    );
  }

  // Flatten all pages into single array
  const photos = data?.pages.flatMap((page) => page.photos) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Empty state
  if (photos.length === 0) {
    return (
      <Center h={300} data-testid="photo-gallery-empty">
        <Stack align="center" gap="md">
          <IconPhoto size={48} stroke={1.5} color="gray" />
          <Text c="dimmed" size="lg">
            No photos found
          </Text>
          <Text c="dimmed" size="sm">
            {projectId
              ? 'No photos have been uploaded for this project yet.'
              : 'No photos match your current filters.'}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <SimpleGrid
        cols={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
        spacing="md"
        data-testid="photo-gallery-grid"
        aria-label={`Photo gallery with ${totalCount} photos`}
      >
        {photos.map((photo) => (
          <Card
            key={photo.id}
            shadow="sm"
            padding="xs"
            radius="md"
            withBorder
            data-testid={`photo-card-${photo.id}`}
            role="button"
            tabIndex={0}
            onClick={() => onPhotoClick?.(photo)}
            onKeyDown={(e) => handleKeyDown(e, photo)}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            styles={{
              root: {
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--mantine-shadow-md)',
                },
                '&:focus-visible': {
                  outline: '2px solid var(--mantine-color-blue-5)',
                  outlineOffset: '2px',
                },
              },
            }}
          >
            <Card.Section pos="relative">
              <Image
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || `Photo from ${formatDate(photo.takenAt)}`}
                height={160}
                fit="cover"
                fallbackSrc="/images/photo-placeholder.png"
              />

              {/* GPS Badge */}
              {photo.latitude != null && photo.longitude != null && (
                <Badge
                  size="xs"
                  variant="filled"
                  color="blue"
                  leftSection={<IconMapPin size={10} />}
                  pos="absolute"
                  top={8}
                  right={8}
                  data-testid={`gps-badge-${photo.id}`}
                >
                  GPS
                </Badge>
              )}
            </Card.Section>

            <Stack gap={4} mt="xs">
              {photo.caption && (
                <Text size="sm" fw={500} lineClamp={1}>
                  {photo.caption}
                </Text>
              )}

              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed">
                  {formatDate(photo.takenAt)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatFileSize(photo.fileSize)}
                </Text>
              </Group>

              {photo.formName && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {photo.formName}
                </Text>
              )}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Infinite scroll sentinel */}
      {hasNextPage && (
        <div ref={ref} data-testid="load-more-sentinel">
          <Center py="xl">
            {isFetchingNextPage ? (
              <Group gap="sm">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Loading more photos...
                </Text>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                Scroll to load more
              </Text>
            )}
          </Center>
        </div>
      )}

      {/* End of list indicator */}
      {!hasNextPage && photos.length > 0 && (
        <Center py="md">
          <Text size="sm" c="dimmed">
            Showing all {totalCount} photos
          </Text>
        </Center>
      )}
    </Stack>
  );
}

export default PhotoGalleryGrid;
