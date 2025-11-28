'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { Stack, Text, Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconDownload, IconShare, IconMapPin, IconCalendar, IconFile } from '@tabler/icons-react';
import { useCallback } from 'react';
import type { Photo } from './photo-gallery-grid';
import { formatFileSize, formatDate } from '@/lib/format-utils';

/**
 * Icon size constants for consistent sizing
 */
const ICON_SIZES = {
  /** Action button icons (download, share) */
  ACTION: 18,
  /** Metadata indicator icons (GPS, calendar, file) */
  METADATA: 14,
} as const;

/**
 * Props for PhotoLightbox component
 */
interface PhotoLightboxProps {
  photos: Photo[];
  index: number;
  open: boolean;
  onClose: () => void;
}

/**
 * Generate descriptive alt text for photos
 *
 * @param photo - Photo object with optional caption, formName, projectName
 * @returns Descriptive alt text for accessibility
 */
function generateAltText(photo: Photo): string {
  if (photo.caption) {
    return photo.caption;
  }

  const parts: string[] = [];

  if (photo.formName) {
    parts.push(photo.formName);
  } else {
    parts.push('Photo');
  }

  parts.push(`from ${formatDate(photo.takenAt)}`);

  if (photo.projectName) {
    parts.push(`- ${photo.projectName}`);
  }

  return parts.join(' ');
}

/**
 * PhotoLightbox - Full-screen photo viewer with zoom, navigation, and actions
 *
 * IMPORTANT: Multi-Tenancy Consideration
 * This component trusts that the photos array is already filtered by orgId.
 * Always pass photos from PhotoGalleryGrid or ensure orgId filtering at the query level.
 * DO NOT pass unfiltered photos - this would be a multi-tenancy violation risk.
 *
 * Features:
 * - Full-size photo display with zoom plugin (maxZoomPixelRatio: 3, scrollToZoom)
 * - Keyboard navigation (arrow keys, ESC to close)
 * - Touch/swipe support for mobile
 * - Photo metadata display (caption, GPS, date, file size)
 * - Download and share actions with offline awareness
 * - Accessibility compliant (WCAG AA)
 */
export function PhotoLightbox({ photos, index, open, onClose }: PhotoLightboxProps) {
  // Compute safe values for hooks (before any conditional returns)
  const hasPhotos = photos && photos.length > 0 && index >= 0;
  const safeIndex = hasPhotos ? Math.min(index, photos.length - 1) : 0;
  const currentPhoto = hasPhotos ? photos[safeIndex] : null;

  // Create slides array for lightbox (always create, even if empty)
  const slides = hasPhotos
    ? photos.map((photo) => ({
        src: photo.url,
        alt: generateAltText(photo),
      }))
    : [];

  /**
   * Handle photo download with error handling and offline awareness
   *
   * Attempts to download the photo file. If offline or if the download fails,
   * logs the error for debugging. In a future enhancement, this could queue
   * the download for when connectivity is restored.
   */
  const handleDownload = useCallback(async () => {
    if (!currentPhoto) return;

    try {
      // Check if we're online before attempting download
      if (!navigator.onLine) {
        console.warn(
          `Download requested while offline for photo ${currentPhoto.id}. ` +
            'Photo may be available from cache.'
        );
        // Still attempt download - browser may serve from cache
      }

      const link = document.createElement('a');
      link.href = currentPhoto.url;
      link.download = `photo-${currentPhoto.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Download failed for photo ${currentPhoto.id}:`, error);
      // TODO: Add user notification (toast/alert) - track in backlog
    }
  }, [currentPhoto]);

  /**
   * Handle photo share with offline awareness
   *
   * Uses Web Share API if available, falls back to clipboard copy.
   * Handles offline scenarios gracefully - share URL can still be copied
   * even if the photo itself is not immediately accessible.
   */
  const handleShare = useCallback(async () => {
    if (!currentPhoto) return;

    try {
      // Note: Sharing URL works offline (just copies the URL)
      // The URL itself may not be accessible until online
      if (navigator.share) {
        await navigator.share({
          title: currentPhoto.caption || 'Photo',
          url: currentPhoto.url,
        });
      } else {
        await navigator.clipboard.writeText(currentPhoto.url);
        // TODO: Add success notification (toast) - track in backlog
      }
    } catch (error) {
      // Share cancelled by user or failed
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(`Share failed for photo ${currentPhoto.id}:`, error);
      }
    }
  }, [currentPhoto]);

  /**
   * Render slide footer with metadata and actions
   */
  const renderSlideFooter = useCallback(
    ({ slide }: { slide: { src: string } }) => {
      const photo = photos.find((p) => p.url === slide.src);
      if (!photo) return null;

      return (
        <Stack
          gap="xs"
          p="md"
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              {/* Caption */}
              <Text size="sm" fw={500} c="white" truncate>
                {photo.caption || 'No description'}
              </Text>

              {/* Form name badge */}
              {photo.formName && (
                <Badge size="sm" variant="filled" color="blue">
                  {photo.formName}
                </Badge>
              )}
            </Group>

            {/* Action buttons */}
            <Group gap="xs" wrap="nowrap">
              <Tooltip label="Download photo" position="top">
                <ActionIcon
                  variant="subtle"
                  color="white"
                  onClick={handleDownload}
                  aria-label="Download photo"
                >
                  <IconDownload size={ICON_SIZES.ACTION} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Share photo" position="top">
                <ActionIcon
                  variant="subtle"
                  color="white"
                  onClick={handleShare}
                  aria-label="Share photo"
                >
                  <IconShare size={ICON_SIZES.ACTION} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Metadata row */}
          <Group gap="md" wrap="wrap">
            {/* GPS coordinates */}
            {photo.latitude != null && photo.longitude != null && (
              <Group gap={4} wrap="nowrap">
                <IconMapPin
                  size={ICON_SIZES.METADATA}
                  style={{ color: 'var(--mantine-color-dimmed)' }}
                />
                <Text size="xs" c="dimmed">
                  GPS: {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                </Text>
              </Group>
            )}

            {/* Date taken */}
            <Group gap={4} wrap="nowrap">
              <IconCalendar
                size={ICON_SIZES.METADATA}
                style={{ color: 'var(--mantine-color-dimmed)' }}
              />
              <Text size="xs" c="dimmed">
                {formatDate(photo.takenAt)}
              </Text>
            </Group>

            {/* File size */}
            <Group gap={4} wrap="nowrap">
              <IconFile
                size={ICON_SIZES.METADATA}
                style={{ color: 'var(--mantine-color-dimmed)' }}
              />
              <Text size="xs" c="dimmed">
                {formatFileSize(photo.fileSize)}
              </Text>
            </Group>
          </Group>
        </Stack>
      );
    },
    [photos, handleDownload, handleShare]
  );

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      index={safeIndex}
      plugins={[Zoom]}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      carousel={{
        preload: 2,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      render={{
        slideFooter: renderSlideFooter,
      }}
      styles={{
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
        },
      }}
    />
  );
}

export default PhotoLightbox;
