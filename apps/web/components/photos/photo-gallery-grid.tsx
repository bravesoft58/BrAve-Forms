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
  Skeleton,
  Tooltip,
} from '@mantine/core';
import { useInView } from 'react-intersection-observer';
import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { IconMapPin, IconAlertCircle, IconPhoto } from '@tabler/icons-react';
import { PhotoLightbox } from './photo-lightbox';
import { formatFileSize, formatDate } from '@/lib/format-utils';

/**
 * Photo type matching backend GraphQL schema
 * CRITICAL: orgId is required for multi-tenant data isolation
 */
export interface Photo {
  id: string;
  orgId: string; // REQUIRED for multi-tenant isolation
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
  // Get orgId for multi-tenant cache isolation
  const { orgId } = useAuth();

  // Lightbox state for full-screen photo viewing
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useInfiniteQuery({
      // Include orgId in queryKey for multi-tenant cache isolation
      queryKey: ['photos', orgId, projectId, filters],
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
      // Offline-first configuration for 30-day capability
      networkMode: 'offlineFirst',
      staleTime: 1000 * 60 * 60, // 1 hour - photos rarely change
      gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days - EPA compliance requirement
    });

  // Trigger fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle photo click - opens lightbox and calls external handler
  const handlePhotoClick = useCallback(
    (photo: Photo, index: number) => {
      setLightboxIndex(index);
      onPhotoClick?.(photo);
    },
    [onPhotoClick]
  );

  // Handle keyboard navigation for photo cards
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, photo: Photo, index: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handlePhotoClick(photo, index);
      }
    },
    [handlePhotoClick]
  );

  // Close lightbox
  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(-1);
  }, []);

  // Loading state with skeleton cards for better perceived performance
  if (isLoading) {
    return (
      <Stack gap="lg" data-testid="photo-gallery-loading">
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing="md">
          {Array.from({ length: pageSize }).map((_, i) => (
            <Card key={`skeleton-${i}`} shadow="sm" padding="xs" radius="md" withBorder>
              <Card.Section>
                <Skeleton height={160} />
              </Card.Section>
              <Stack gap={4} mt="xs">
                <Skeleton height={16} width="80%" />
                <Skeleton height={12} width="60%" />
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
        <Center>
          <Group gap="sm">
            <Loader size="sm" />
            <Text c="dimmed" size="sm">
              Loading photos...
            </Text>
          </Group>
        </Center>
      </Stack>
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
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
            shadow="sm"
            padding="xs"
            radius="md"
            withBorder
            data-testid={`photo-card-${photo.id}`}
            role="button"
            tabIndex={0}
            onClick={() => handlePhotoClick(photo, index)}
            onKeyDown={(e) => handleKeyDown(e, photo, index)}
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
                loading="lazy"
              />

              {/* GPS Badge with coordinate tooltip for EPA compliance documentation */}
              {photo.latitude != null && photo.longitude != null && (
                <Tooltip
                  label={`Lat: ${photo.latitude.toFixed(6)}, Lon: ${photo.longitude.toFixed(6)}`}
                  position="bottom"
                  withArrow
                >
                  <Badge
                    size="xs"
                    variant="filled"
                    color="blue"
                    leftSection={<IconMapPin size={10} />}
                    pos="absolute"
                    top={8}
                    right={8}
                    data-testid={`gps-badge-${photo.id}`}
                    style={{ cursor: 'help' }}
                  >
                    GPS
                  </Badge>
                </Tooltip>
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

      {/* Photo Lightbox for full-screen viewing */}
      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={handleCloseLightbox}
      />
    </Stack>
  );
}

export default PhotoGalleryGrid;
