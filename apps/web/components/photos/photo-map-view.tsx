'use client';

import { Map, Marker, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useCallback } from 'react';
import {
  Stack,
  Card,
  Image,
  Text,
  Group,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { IconMapPin, IconX, IconAlertCircle } from '@tabler/icons-react';
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
 * Tile server URL - configurable via environment variable for offline/self-hosted tiles
 */
const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://tiles.stadiamaps.com/styles/osm_bright.json';

/**
 * Validate GPS coordinates are within valid ranges
 * @param lat - Latitude value to validate
 * @param lon - Longitude value to validate
 * @returns true if coordinates are valid
 */
function isValidGPS(lat: number | null | undefined, lon: number | null | undefined): boolean {
  if (lat == null || lon == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

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
 * - Photo markers at GPS coordinates with validation
 * - Click marker to preview photo details
 * - Navigation and fullscreen controls
 * - Error handling for tile/map failures
 * - Loading state while map tiles load
 * - Glove-friendly 44x44px touch targets
 * - Accessible with keyboard navigation
 *
 * License: BSD 3-Clause (MapLibre is fully open source)
 */
export function PhotoMapView({ photos, onPhotoClick }: PhotoMapViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Filter photos that have valid GPS coordinates
  const photosWithGPS = photos.filter((photo) => isValidGPS(photo.latitude, photo.longitude));

  // Calculate map center from first photo with GPS, or use default
  const center =
    photosWithGPS.length > 0
      ? {
          longitude: photosWithGPS[0].longitude!,
          latitude: photosWithGPS[0].latitude!,
        }
      : DEFAULT_CENTER;

  /**
   * Handle map load completion
   */
  const handleMapLoad = useCallback(() => {
    setIsMapLoading(false);
  }, []);

  /**
   * Handle map errors (tile loading, WebGL, etc.)
   */
  const handleMapError = useCallback((event: { error: Error }) => {
    console.error('Map error:', event.error);
    setMapError('Failed to load map. Check your internet connection and try again.');
    setIsMapLoading(false);
  }, []);

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

  // Error state - show alert when map fails to load
  if (mapError) {
    return (
      <Stack gap="md">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Map Error"
          color="red"
          data-testid="map-error-alert"
        >
          {mapError}
        </Alert>
        <Text size="sm" c="dimmed" ta="center">
          {photosWithGPS.length} photos have GPS data but cannot be displayed on map.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <div
        data-testid="photo-map-container"
        aria-label="Photo location map"
        style={{ height: '600px', width: '100%', position: 'relative' }}
      >
        {/* Loading overlay */}
        {isMapLoading && (
          <Center
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 5,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
            data-testid="map-loading"
          >
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">
                Loading map...
              </Text>
            </Stack>
          </Center>
        )}

        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude: center.longitude,
            latitude: center.latitude,
            zoom: DEFAULT_ZOOM,
          }}
          mapStyle={MAP_STYLE_URL}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onError={handleMapError}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />

          {/* Photo markers with glove-friendly 44x44px touch targets */}
          {photosWithGPS.map((photo) => (
            <Marker
              key={photo.id}
              longitude={photo.longitude!}
              latitude={photo.latitude!}
              anchor="bottom"
              onClick={() => handleMarkerClick(photo)}
            >
              <IconMapPin
                size={44}
                color={selectedPhoto?.id === photo.id ? '#1864ab' : '#c92a2a'}
                fill={selectedPhoto?.id === photo.id ? '#1864ab' : '#c92a2a'}
                style={{
                  cursor: 'pointer',
                  opacity: 1,
                  filter: 'drop-shadow(0 0 2px white)',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
                aria-label={`Photo marker: ${photo.caption || 'Photo'}`}
              />
            </Marker>
          ))}
        </Map>

        {/* Photo preview card - responsive for mobile */}
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
              right: 20,
              maxWidth: 320,
              width: 'calc(100% - 40px)',
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
                  size="md"
                  pos="absolute"
                  top={8}
                  right={8}
                  onClick={handleClosePreview}
                  aria-label="Close photo preview"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <IconX size={18} />
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

              {isValidGPS(selectedPhoto.latitude, selectedPhoto.longitude) && (
                <Text size="xs" c="dimmed">
                  GPS: {selectedPhoto.latitude!.toFixed(4)}, {selectedPhoto.longitude!.toFixed(4)}
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
