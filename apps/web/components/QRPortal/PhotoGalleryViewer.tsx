'use client';

import { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Paper,
  Center,
  ThemeIcon,
  SimpleGrid,
  Modal,
  ActionIcon,
  Box,
  Tooltip,
  Loader,
  Alert,
  Image,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPhoto,
  IconMapPin,
  IconCalendar,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconZoomIn,
  IconUser,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  useInspectorPhotos,
  InspectorPhoto,
  InspectorGeoLocation,
} from '@/hooks/useInspectorPortal';

interface PhotoGalleryViewerProps {
  projectId: string;
  token: string;
}

/**
 * PhotoGalleryViewer Component - Sprint 4 ISSUE-104, Updated Sprint 5 ISSUE-165
 *
 * Read-only photo gallery for the inspector portal.
 * Now fetches real data from the backend API.
 *
 * Features:
 * - Grid view with thumbnails
 * - Lightbox with full-size images
 * - GPS location display (lat/lng)
 * - Photo metadata (date, caption, size)
 * - Navigation between photos
 * - Loading and error states
 */
export function PhotoGalleryViewer({ projectId: _projectId, token }: PhotoGalleryViewerProps) {
  const theme = useMantineTheme();
  const [selectedPhoto, setSelectedPhoto] = useState<InspectorPhoto | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: photos, isLoading, error } = useInspectorPhotos(token);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format coordinates
  const formatCoordinates = (location: InspectorGeoLocation): string => {
    const lat = location.latitude.toFixed(4);
    const lng = location.longitude.toFixed(4);
    return `${lat}, ${lng}`;
  };

  // Open lightbox
  const openLightbox = (photo: InspectorPhoto) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedPhoto(null);
  };

  // Navigate to previous/next photo
  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto || !photos) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    }

    setSelectedPhoto(photos[newIndex]);
  };

  // Loading state
  if (isLoading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading photos...</Text>
        </Stack>
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={20} />}
        title="Failed to load photos"
        color="red"
        variant="light"
      >
        {error.message || 'Unable to load photos. Please try again.'}
      </Alert>
    );
  }

  // Empty state
  if (!photos || photos.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <ThemeIcon size={48} variant="light" color="gray" radius="xl">
            <IconPhoto size={24} />
          </ThemeIcon>
          <Text c="dimmed" ta="center">
            No photos found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Photos will appear here once uploaded
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </Text>
        <Badge variant="light" color="blue" leftSection={<IconMapPin size={10} />}>
          GPS Tagged
        </Badge>
      </Group>

      {/* Photo Grid */}
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
        {photos.map((photo) => (
          <Paper
            key={photo.id}
            shadow="xs"
            radius="md"
            p={0}
            withBorder
            style={{ cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => openLightbox(photo)}
          >
            {/* Thumbnail */}
            <Box
              h={140}
              style={{
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {photo.thumbnailUrl ? (
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.caption || 'Photo'}
                  h={140}
                  fit="cover"
                  fallbackSrc={undefined}
                />
              ) : (
                <Box
                  h={140}
                  bg={`${theme.colors.blue[1]}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                    <IconPhoto size={24} />
                  </ThemeIcon>
                </Box>
              )}
              {photo.location && (
                <Tooltip label="GPS tagged">
                  <Badge
                    size="xs"
                    variant="filled"
                    color="green"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    leftSection={<IconMapPin size={8} />}
                  >
                    GPS
                  </Badge>
                </Tooltip>
              )}
            </Box>

            {/* Photo info */}
            <Box p="xs">
              <Text size="xs" fw={500} lineClamp={1}>
                {photo.caption || 'No caption'}
              </Text>
              <Group gap={4} mt={4}>
                <IconCalendar size={10} color={theme.colors.gray[5]} />
                <Text size="10px" c="dimmed">
                  {new Date(photo.takenAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </Group>
            </Box>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Lightbox Modal */}
      <Modal
        opened={lightboxOpen}
        onClose={closeLightbox}
        size="xl"
        centered
        withCloseButton={false}
        padding={0}
        radius="md"
        overlayProps={{ backgroundOpacity: 0.85, blur: 4 }}
      >
        {selectedPhoto && (
          <Box pos="relative">
            {/* Close button */}
            <ActionIcon
              variant="filled"
              color="dark"
              size="lg"
              radius="xl"
              onClick={closeLightbox}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
            >
              <IconX size={18} />
            </ActionIcon>

            {/* Navigation buttons */}
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              onClick={() => navigatePhoto('prev')}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
              }}
            >
              <IconChevronLeft size={24} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              onClick={() => navigatePhoto('next')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
              }}
            >
              <IconChevronRight size={24} />
            </ActionIcon>

            {/* Full-size image */}
            <Box
              h={400}
              bg={theme.colors.gray[8]}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {selectedPhoto.url ? (
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || 'Photo'}
                  h={400}
                  fit="contain"
                  fallbackSrc={undefined}
                />
              ) : (
                <Stack align="center" gap="md">
                  <ThemeIcon size={80} variant="light" color="gray" radius="xl">
                    <IconZoomIn size={40} />
                  </ThemeIcon>
                  <Text c="gray.4" size="sm">
                    Photo Preview
                  </Text>
                </Stack>
              )}
            </Box>

            {/* Photo details */}
            <Paper p="md" radius={0}>
              <Stack gap="sm">
                <Text fw={600}>{selectedPhoto.caption || 'No caption'}</Text>

                <Group gap="lg" wrap="wrap">
                  <Group gap="xs">
                    <IconUser size={14} color={theme.colors.gray[6]} />
                    <Text size="sm" c="dimmed">
                      {selectedPhoto.uploadedBy}
                    </Text>
                  </Group>

                  <Group gap="xs">
                    <IconCalendar size={14} color={theme.colors.gray[6]} />
                    <Text size="sm" c="dimmed">
                      {new Date(selectedPhoto.takenAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Group>

                  {selectedPhoto.location && (
                    <Group gap="xs">
                      <IconMapPin size={14} color={theme.colors.green[6]} />
                      <Text size="sm" c="dimmed">
                        {formatCoordinates(selectedPhoto.location)}
                      </Text>
                    </Group>
                  )}

                  <Group gap="xs">
                    <IconPhoto size={14} color={theme.colors.gray[6]} />
                    <Text size="sm" c="dimmed">
                      {formatFileSize(selectedPhoto.fileSize)}
                    </Text>
                  </Group>
                </Group>

                {/* Action buttons */}
                <Group justify="flex-end" mt="xs">
                  <Tooltip label="Download photo">
                    <ActionIcon
                      variant="light"
                      size="lg"
                      component="a"
                      href={selectedPhoto.url}
                      download
                    >
                      <IconDownload size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Stack>
            </Paper>
          </Box>
        )}
      </Modal>
    </Stack>
  );
}
