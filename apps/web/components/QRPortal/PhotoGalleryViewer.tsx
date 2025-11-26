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
} from '@tabler/icons-react';

interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  takenAt: string;
  uploadedBy: string;
  location?: GeoLocation;
  fileSize: number;
  mimeType: string;
}

interface PhotoGalleryViewerProps {
  projectId: string;
}

/**
 * PhotoGalleryViewer Component - Sprint 4 ISSUE-104
 *
 * Read-only photo gallery for the inspector portal.
 * Displays inspection photos with GPS coordinates and lightbox view.
 *
 * Features:
 * - Grid view with thumbnails
 * - Lightbox with full-size images
 * - GPS location display (lat/lng)
 * - Photo metadata (date, caption, size)
 * - Navigation between photos
 */
export function PhotoGalleryViewer({ projectId: _projectId }: PhotoGalleryViewerProps) {
  const theme = useMantineTheme();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Mock photos for development
  // TODO: Replace with actual GraphQL query when backend integration is complete
  const mockPhotos: Photo[] = [
    {
      id: 'photo_001',
      url: '/placeholder-photo-1.jpg',
      thumbnailUrl: '/placeholder-photo-1-thumb.jpg',
      caption: 'Sediment basin - east side',
      takenAt: '2025-11-25T10:30:00Z',
      uploadedBy: 'John Inspector',
      location: {
        latitude: 39.5296,
        longitude: -119.8138,
        altitude: 1373,
      },
      fileSize: 2456789,
      mimeType: 'image/jpeg',
    },
    {
      id: 'photo_002',
      url: '/placeholder-photo-2.jpg',
      thumbnailUrl: '/placeholder-photo-2-thumb.jpg',
      caption: 'Erosion control measures - north entrance',
      takenAt: '2025-11-25T10:45:00Z',
      uploadedBy: 'John Inspector',
      location: {
        latitude: 39.5301,
        longitude: -119.8142,
      },
      fileSize: 1987654,
      mimeType: 'image/jpeg',
    },
    {
      id: 'photo_003',
      url: '/placeholder-photo-3.jpg',
      thumbnailUrl: '/placeholder-photo-3-thumb.jpg',
      caption: 'Silt fence installation',
      takenAt: '2025-11-24T14:20:00Z',
      uploadedBy: 'Jane Compliance',
      location: {
        latitude: 39.5289,
        longitude: -119.8150,
      },
      fileSize: 3124567,
      mimeType: 'image/jpeg',
    },
    {
      id: 'photo_004',
      url: '/placeholder-photo-4.jpg',
      thumbnailUrl: '/placeholder-photo-4-thumb.jpg',
      caption: 'Storm drain inlet protection',
      takenAt: '2025-11-24T14:35:00Z',
      uploadedBy: 'Jane Compliance',
      fileSize: 2654321,
      mimeType: 'image/jpeg',
    },
    {
      id: 'photo_005',
      url: '/placeholder-photo-5.jpg',
      thumbnailUrl: '/placeholder-photo-5-thumb.jpg',
      caption: 'Material storage area',
      takenAt: '2025-11-23T09:15:00Z',
      uploadedBy: 'Mike Supervisor',
      location: {
        latitude: 39.5295,
        longitude: -119.8135,
      },
      fileSize: 1876543,
      mimeType: 'image/jpeg',
    },
    {
      id: 'photo_006',
      url: '/placeholder-photo-6.jpg',
      thumbnailUrl: '/placeholder-photo-6-thumb.jpg',
      caption: 'Vehicle tracking pad',
      takenAt: '2025-11-23T09:30:00Z',
      uploadedBy: 'Mike Supervisor',
      location: {
        latitude: 39.5302,
        longitude: -119.8128,
      },
      fileSize: 2234567,
      mimeType: 'image/jpeg',
    },
  ];

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format coordinates
  const formatCoordinates = (location: GeoLocation): string => {
    const lat = location.latitude.toFixed(4);
    const lng = location.longitude.toFixed(4);
    return `${lat}, ${lng}`;
  };

  // Open lightbox
  const openLightbox = (photo: Photo) => {
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
    if (!selectedPhoto) return;
    const currentIndex = mockPhotos.findIndex((p) => p.id === selectedPhoto.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? mockPhotos.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === mockPhotos.length - 1 ? 0 : currentIndex + 1;
    }

    setSelectedPhoto(mockPhotos[newIndex]);
  };

  // Empty state
  if (mockPhotos.length === 0) {
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
          {mockPhotos.length} photo{mockPhotos.length !== 1 ? 's' : ''}
        </Text>
        <Badge variant="light" color="blue" leftSection={<IconMapPin size={10} />}>
          GPS Tagged
        </Badge>
      </Group>

      {/* Photo Grid */}
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
        {mockPhotos.map((photo) => (
          <Paper
            key={photo.id}
            shadow="xs"
            radius="md"
            p={0}
            withBorder
            style={{ cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => openLightbox(photo)}
          >
            {/* Thumbnail placeholder - using colored box since we don't have real images */}
            <Box
              h={140}
              bg={`${theme.colors.blue[1]}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                <IconPhoto size={24} />
              </ThemeIcon>
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
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
            >
              <IconChevronLeft size={24} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              onClick={() => navigatePhoto('next')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
            >
              <IconChevronRight size={24} />
            </ActionIcon>

            {/* Image placeholder */}
            <Box
              h={400}
              bg={theme.colors.gray[8]}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stack align="center" gap="md">
                <ThemeIcon size={80} variant="light" color="gray" radius="xl">
                  <IconZoomIn size={40} />
                </ThemeIcon>
                <Text c="gray.4" size="sm">
                  Photo Preview
                </Text>
              </Stack>
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
                    <ActionIcon variant="light" size="lg">
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
