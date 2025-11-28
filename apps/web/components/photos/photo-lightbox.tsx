'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { Stack, Text, Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconDownload, IconShare, IconMapPin, IconCalendar, IconFile } from '@tabler/icons-react';
import { useCallback } from 'react';
import type { Photo } from './photo-gallery-grid';

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
 * PhotoLightbox - Full-screen photo viewer with zoom, navigation, and actions
 *
 * Features:
 * - Full-size photo display with zoom plugin
 * - Keyboard navigation (arrow keys, ESC to close)
 * - Touch/swipe support for mobile
 * - Photo metadata display (caption, GPS, date, file size)
 * - Download and share actions
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
        alt: photo.caption || `Photo from ${formatDate(photo.takenAt)}`,
      }))
    : [];

  /**
   * Handle photo download
   */
  const handleDownload = useCallback(() => {
    if (!currentPhoto) return;

    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = `photo-${currentPhoto.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentPhoto]);

  /**
   * Handle photo share (Web Share API or clipboard fallback)
   */
  const handleShare = useCallback(async () => {
    if (!currentPhoto) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: currentPhoto.caption || 'Photo',
          url: currentPhoto.url,
        });
      } else {
        await navigator.clipboard.writeText(currentPhoto.url);
      }
    } catch {
      // Share cancelled or failed - ignore silently
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
                  <IconDownload size={18} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Share photo" position="top">
                <ActionIcon
                  variant="subtle"
                  color="white"
                  onClick={handleShare}
                  aria-label="Share photo"
                >
                  <IconShare size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Metadata row */}
          <Group gap="md" wrap="wrap">
            {/* GPS coordinates */}
            {photo.latitude != null && photo.longitude != null && (
              <Group gap={4} wrap="nowrap">
                <IconMapPin size={14} color="#868e96" />
                <Text size="xs" c="dimmed">
                  GPS: {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                </Text>
              </Group>
            )}

            {/* Date taken */}
            <Group gap={4} wrap="nowrap">
              <IconCalendar size={14} color="#868e96" />
              <Text size="xs" c="dimmed">
                {formatDate(photo.takenAt)}
              </Text>
            </Group>

            {/* File size */}
            <Group gap={4} wrap="nowrap">
              <IconFile size={14} color="#868e96" />
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
