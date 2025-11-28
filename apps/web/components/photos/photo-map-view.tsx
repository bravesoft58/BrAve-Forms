'use client';

import { Map, Marker, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useCallback } from 'react';
import { Stack, Card, Image, Text, Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconMapPin, IconX } from '@tabler/icons-react';
import type { Photo } from './photo-gallery-grid';
import { formatDate } from '@/lib/format-utils';

/**
 * Default map center (Reno, NV) when no photos have GPS data
 */
const DEFAULT_CENTER = {
  longitude: -119.8138,
  latitude: 39.5296,
};

/**
 * Default zoom level for map view
 */
const DEFAULT_ZOOM = 14;

/**
 * Props for PhotoMapView component
 */
interface PhotoMapViewProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
}

/**
 * PhotoMapView - Interactive map displaying photo locations
 *
 * IMPORTANT: Multi-Tenancy Consideration
 * This component trusts that the photos array is already filtered by orgId.
 * Always pass photos from PhotoGalleryGrid or ensure orgId filtering at the query level.
 * DO NOT pass unfiltered photos - this would be a multi-tenancy violation risk.
 *
 * Features:
 * - MapLibre GL JS with free Stadia Maps tiles (no Mapbox billing)
 * - Photo markers at GPS coordinates
 * - Click marker to preview photo details
 * - Navigation and fullscreen controls
 * - Accessible with keyboard navigation
 *
 * License: BSD 3-Clause (MapLibre is fully open source)
 */
export function PhotoMapView({ photos, onPhotoClick }: PhotoMapViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Filter photos that have GPS coordinates
  const photosWithGPS = photos.filter((photo) => photo.latitude != null && photo.longitude != null);

  // Calculate map center from first photo with GPS, or use default
  const center =
    photosWithGPS.length > 0
      ? {
          longitude: photosWithGPS[0].longitude!,
          latitude: photosWithGPS[0].latitude!,
        }
      : DEFAULT_CENTER;

  /**
   * Handle marker click - select photo and notify parent
   */
  const handleMarkerClick = useCallback(
    (photo: Photo) => {
      setSelectedPhoto(photo);
      onPhotoClick?.(photo);
    },
    [onPhotoClick]
  );

  /**
   * Close photo preview card
   */
  const handleClosePreview = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  return (
    <Stack gap="md">
      <div
        data-testid="photo-map-container"
        aria-label="Photo location map"
        style={{ height: '600px', width: '100%', position: 'relative' }}
      >
        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude: center.longitude,
            latitude: center.latitude,
            zoom: DEFAULT_ZOOM,
          }}
          mapStyle="https://tiles.stadiamaps.com/styles/osm_bright.json"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />

          {/* Photo markers */}
          {photosWithGPS.map((photo) => (
            <Marker
              key={photo.id}
              longitude={photo.longitude!}
              latitude={photo.latitude!}
              anchor="bottom"
              onClick={() => handleMarkerClick(photo)}
            >
              <IconMapPin
                size={32}
                color={selectedPhoto?.id === photo.id ? '#228be6' : '#fa5252'}
                fill={selectedPhoto?.id === photo.id ? '#228be6' : '#fa5252'}
                style={{ cursor: 'pointer', opacity: 0.9 }}
                aria-label={`Photo marker: ${photo.caption || 'Photo'}`}
              />
            </Marker>
          ))}
        </Map>

        {/* Photo preview card */}
        {selectedPhoto && (
          <Card
            shadow="lg"
            padding="md"
            radius="md"
            withBorder
            data-testid="photo-preview-card"
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              maxWidth: 320,
              zIndex: 10,
            }}
          >
            <Card.Section pos="relative">
              <Image
                src={selectedPhoto.thumbnailUrl || selectedPhoto.url}
                alt={selectedPhoto.caption || 'Selected photo'}
                height={160}
                fit="cover"
              />
              <Tooltip label="Close preview" position="left">
                <ActionIcon
                  variant="filled"
                  color="dark"
                  size="sm"
                  pos="absolute"
                  top={8}
                  right={8}
                  onClick={handleClosePreview}
                  aria-label="Close photo preview"
                >
                  <IconX size={14} />
                </ActionIcon>
              </Tooltip>
            </Card.Section>

            <Stack gap="xs" mt="md">
              <Text size="sm" fw={500} lineClamp={2}>
                {selectedPhoto.caption || 'No description'}
              </Text>

              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed">
                  {formatDate(selectedPhoto.takenAt)}
                </Text>
                {selectedPhoto.formName && (
                  <Badge size="xs" variant="light" color="blue">
                    {selectedPhoto.formName}
                  </Badge>
                )}
              </Group>

              {selectedPhoto.latitude != null && selectedPhoto.longitude != null && (
                <Text size="xs" c="dimmed">
                  GPS: {selectedPhoto.latitude.toFixed(4)}, {selectedPhoto.longitude.toFixed(4)}
                </Text>
              )}
            </Stack>
          </Card>
        )}
      </div>

      <Text size="sm" c="dimmed" ta="center">
        Showing {photosWithGPS.length} photos with GPS data
      </Text>
    </Stack>
  );
}

export default PhotoMapView;
