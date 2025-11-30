'use client';

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
  Overlay,
  ActionIcon,
  Notification,
} from '@mantine/core';
import { useInView } from 'react-intersection-observer';
import { useEffect, useCallback, useState, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { IconMapPin, IconAlertCircle, IconPhoto, IconCheck, IconLink } from '@tabler/icons-react';
import { PhotoLightbox } from './photo-lightbox';
import { formatFileSize, formatDate } from '@/lib/format-utils';
import { usePhotosByProject, type Photo as ApiPhoto } from '@/hooks/usePhotos';

/**
 * Photo type for gallery display
 * Maps from backend GraphQL schema to component-friendly format
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
 * Map API photo to gallery photo format
 */
function mapApiPhotoToGalleryPhoto(apiPhoto: ApiPhoto): Photo {
  return {
    id: apiPhoto.id,
    orgId: apiPhoto.orgId,
    url: apiPhoto.url || '',
    thumbnailUrl: apiPhoto.thumbnailUrl,
    caption: apiPhoto.caption,
    latitude: apiPhoto.latitude ?? null,
    longitude: apiPhoto.longitude ?? null,
    takenAt: apiPhoto.takenAt,
    uploadedAt: apiPhoto.uploadedAt,
    fileSize: apiPhoto.fileSize,
    mimeType: apiPhoto.mimeType,
    uploadedBy: apiPhoto.uploadedBy,
    formName: apiPhoto.formType,
    projectName: undefined, // Not returned from API
  };
}

/**
 * Photo pair for before/after comparison
 * ISSUE-172: Updated to match backend GraphQL schema
 *
 * IMPORTANT: Both photos MUST belong to same orgId (multi-tenant isolation)
 * Used for construction progress tracking and EPA compliance documentation.
 */
export interface PhotoPair {
  id: string;
  orgId: string; // REQUIRED for multi-tenant isolation
  projectId: string;
  beforePhotoId: string;
  afterPhotoId: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

/** Duration in ms to show pairing notifications before auto-dismiss */
const NOTIFICATION_DURATION_MS = 2000;

/**
 * Filter options for photo gallery
 */
export interface PhotoFilters {
  formType?: string;
  dateRange?: [Date, Date];
  userId?: string;
  hasGps?: boolean;
  onlyPaired?: boolean;
}

/**
 * Props for PhotoGalleryGrid component
 */
interface PhotoGalleryGridProps {
  projectId?: string;
  filters?: PhotoFilters;
  onPhotoClick?: (photo: Photo) => void;
  pageSize?: number;
  /** Enable pairing mode for before/after comparison */
  pairingMode?: boolean;
  /** Callback when pairing mode changes */
  onPairingModeChange?: (enabled: boolean) => void;
  /** Callback when a pair is created */
  onPairCreated?: (beforePhoto: Photo, afterPhoto: Photo) => void;
  /** Existing photo pairs for visual indication */
  pairs?: PhotoPair[];
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
  pairingMode = false,
  onPairingModeChange,
  onPairCreated,
  pairs = [],
}: PhotoGalleryGridProps) {
  // Get orgId for multi-tenant cache isolation
  const { orgId } = useAuth();

  // Lightbox state for full-screen photo viewing
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  // Pairing mode state
  const [selectedForPairing, setSelectedForPairing] = useState<Photo[]>([]);
  const [pairingNotification, setPairingNotification] = useState<string | null>(null);

  // Get set of paired photo IDs for quick lookup
  // ISSUE-172: Updated to use photo ID fields from backend schema
  const pairedPhotoIds = useMemo(() => {
    const ids = new Set<string>();
    pairs.forEach((pair) => {
      ids.add(pair.beforePhotoId);
      ids.add(pair.afterPhotoId);
    });
    return ids;
  }, [pairs]);

  // Clear selection when pairing mode is disabled
  useEffect(() => {
    if (!pairingMode) {
      setSelectedForPairing([]);
    }
  }, [pairingMode]);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Map local filters to API filter format
  const apiFilters = useMemo(() => {
    if (!filters) return undefined;
    return {
      formType: filters.formType,
      userId: filters.userId,
      hasGps: filters.hasGps,
      startDate: filters.dateRange?.[0],
      endDate: filters.dateRange?.[1],
    };
  }, [filters]);

  // ISSUE-171: Use GraphQL hook instead of REST endpoint
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    usePhotosByProject(projectId, apiFilters, pageSize);

  // Trigger fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle photo click - opens lightbox or handles pairing
  const handlePhotoClick = useCallback(
    async (photo: Photo, index: number) => {
      if (pairingMode) {
        // Handle pairing mode selection
        const isSelected = selectedForPairing.some((p) => p.id === photo.id);

        if (isSelected) {
          // Deselect if already selected
          setSelectedForPairing((prev) => prev.filter((p) => p.id !== photo.id));
          setPairingNotification(null);
        } else if (selectedForPairing.length === 0) {
          // First photo selected - mark as "before"
          setSelectedForPairing([photo]);
          setPairingNotification('Select the "After" photo to complete the pair');
        } else if (selectedForPairing.length === 1) {
          // Second photo selected - create the pair
          const firstPhoto = selectedForPairing[0];
          const secondPhoto = photo;

          // CRITICAL: Multi-tenant validation - both photos must belong to same org
          if (firstPhoto.orgId !== secondPhoto.orgId) {
            setPairingNotification('Error: Cannot pair photos from different organizations');
            setTimeout(() => setPairingNotification(null), NOTIFICATION_DURATION_MS);
            return;
          }

          // Validate current user's org matches photo org
          if (orgId && firstPhoto.orgId !== orgId) {
            setPairingNotification('Error: Unauthorized - photos belong to another organization');
            setTimeout(() => setPairingNotification(null), NOTIFICATION_DURATION_MS);
            return;
          }

          // Determine which is before/after by date
          const firstDate = new Date(firstPhoto.takenAt);
          const secondDate = new Date(secondPhoto.takenAt);
          const beforePhoto = firstDate <= secondDate ? firstPhoto : secondPhoto;
          const afterPhoto = firstDate <= secondDate ? secondPhoto : firstPhoto;

          try {
            // Check if offline - queue for sync when online
            if (!navigator.onLine) {
              // Queue pairing operation for offline sync
              const offlineQueue = JSON.parse(localStorage.getItem('offline-pair-queue') || '[]');
              offlineQueue.push({
                type: 'CREATE_PAIR',
                beforePhotoId: beforePhoto.id,
                afterPhotoId: afterPhoto.id,
                orgId: beforePhoto.orgId,
                timestamp: new Date().toISOString(),
              });
              localStorage.setItem('offline-pair-queue', JSON.stringify(offlineQueue));

              setSelectedForPairing([]);
              setPairingNotification('Pair queued for sync when online');
              setTimeout(() => setPairingNotification(null), NOTIFICATION_DURATION_MS);
              onPairingModeChange?.(false);
              return;
            }

            // Online - create pair immediately
            await onPairCreated?.(beforePhoto, afterPhoto);

            // Clear selection and show success
            setSelectedForPairing([]);
            setPairingNotification('Pair created successfully!');
            setTimeout(() => setPairingNotification(null), NOTIFICATION_DURATION_MS);
            onPairingModeChange?.(false);
          } catch (error) {
            // Handle pair creation error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setPairingNotification(`Error creating pair: ${errorMessage}`);
            // Don't clear selection on error - allow retry
            setTimeout(() => setPairingNotification(null), NOTIFICATION_DURATION_MS * 2);
          }
        }
      } else {
        // Normal mode - open lightbox
        setLightboxIndex(index);
        onPhotoClick?.(photo);
      }
    },
    [pairingMode, selectedForPairing, onPhotoClick, onPairCreated, onPairingModeChange, orgId]
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

  // Check if a photo is selected for pairing
  const isSelectedForPairing = useCallback(
    (photoId: string) => selectedForPairing.some((p) => p.id === photoId),
    [selectedForPairing]
  );

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

  // Flatten all pages into single array and map to gallery format
  // ISSUE-171: Map API photos to local Photo type for gallery display
  const photos = data?.pages.flatMap((page) => page.photos.map(mapApiPhotoToGalleryPhoto)) || [];
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
      {/* Pairing mode notification */}
      {pairingMode && pairingNotification && (
        <Notification
          color={pairingNotification.includes('success') ? 'green' : 'blue'}
          withCloseButton={false}
          data-testid="pairing-notification"
        >
          {pairingNotification}
        </Notification>
      )}

      {/* Pairing mode indicator */}
      {pairingMode && !pairingNotification && (
        <Alert color="blue" variant="light" data-testid="pairing-mode-indicator">
          <Group gap="xs">
            <IconLink size={16} />
            <Text size="sm">
              Pairing mode active. Select two photos to create a before/after comparison.
              {selectedForPairing.length === 1 && ' (1 photo selected)'}
            </Text>
          </Group>
        </Alert>
      )}

      <SimpleGrid
        cols={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
        spacing="md"
        data-testid="photo-gallery-grid"
        aria-label={`Photo gallery with ${totalCount} photos`}
      >
        {photos.map((photo, index) => {
          const isSelected = isSelectedForPairing(photo.id);
          const isPaired = pairedPhotoIds.has(photo.id);

          return (
            <Card
              key={photo.id}
              shadow="sm"
              padding="xs"
              radius="md"
              withBorder
              data-testid={`photo-card-${photo.id}`}
              data-selected={isSelected}
              data-paired={isPaired}
              role="button"
              tabIndex={0}
              onClick={() => handlePhotoClick(photo, index)}
              onKeyDown={(e) => handleKeyDown(e, photo, index)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                ...(isSelected && {
                  outline: '3px solid var(--mantine-color-blue-5)',
                  outlineOffset: '2px',
                }),
                ...(isPaired &&
                  !pairingMode && {
                    borderColor: 'var(--mantine-color-green-5)',
                  }),
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

                {/* Selection overlay when in pairing mode */}
                {isSelected && (
                  <Overlay color="blue" opacity={0.3} data-testid={`selection-overlay-${photo.id}`}>
                    <Center h="100%">
                      <ActionIcon size="xl" variant="filled" color="blue" radius="xl">
                        <IconCheck size={24} />
                      </ActionIcon>
                    </Center>
                  </Overlay>
                )}

                {/* Paired indicator badge */}
                {isPaired && !pairingMode && (
                  <Tooltip label="Part of a before/after pair" position="bottom" withArrow>
                    <Badge
                      size="xs"
                      variant="filled"
                      color="green"
                      leftSection={<IconLink size={10} />}
                      pos="absolute"
                      top={8}
                      left={8}
                      data-testid={`paired-badge-${photo.id}`}
                      style={{ cursor: 'help' }}
                    >
                      Paired
                    </Badge>
                  </Tooltip>
                )}

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
          );
        })}
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
