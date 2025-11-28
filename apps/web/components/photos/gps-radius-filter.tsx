'use client';

import { useState, useCallback } from 'react';
import { Group, Stack, NumberInput, Button, Text, Alert } from '@mantine/core';
import { IconMapPin, IconCurrentLocation, IconX, IconAlertCircle } from '@tabler/icons-react';

/**
 * GPS radius filter configuration
 */
export interface GPSRadiusConfig {
  lat: number;
  lng: number;
  radiusKm: number;
}

/**
 * Props for GPSRadiusFilter component
 */
interface GPSRadiusFilterProps {
  onApply: (filter: GPSRadiusConfig) => void;
  onClear?: () => void;
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
}

/**
 * GPSRadiusFilter - Filter photos by GPS proximity to a location
 *
 * Features:
 * - Latitude/Longitude input with 6 decimal precision (11cm accuracy)
 * - Configurable radius in kilometers (0.1 - 50 km)
 * - Use current location button (geolocation API)
 * - Apply and Clear buttons
 * - Accessible input labels
 *
 * @example
 * ```tsx
 * <GPSRadiusFilter
 *   onApply={(filter) => console.log(filter)}
 *   onClear={() => console.log('cleared')}
 * />
 * ```
 */
export function GPSRadiusFilter({
  onApply,
  onClear,
  initialLat = 39.5296,
  initialLng = -119.8138,
  initialRadius = 1,
}: GPSRadiusFilterProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [radius, setRadius] = useState<number>(initialRadius);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /**
   * Handle apply button click
   */
  const handleApply = useCallback(() => {
    onApply({
      lat,
      lng,
      radiusKm: radius,
    });
  }, [lat, lng, radius, onApply]);

  /**
   * Handle clear button click
   */
  const handleClear = useCallback(() => {
    setLat(initialLat);
    setLng(initialLng);
    setRadius(initialRadius);
    setLocationError(null);
    onClear?.();
  }, [initialLat, initialLng, initialRadius, onClear]);

  /**
   * Get current location using Geolocation API
   */
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      console.error('Geolocation not supported');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        const errorMessages: Record<number, string> = {
          1: 'Location permission denied',
          2: 'Location unavailable',
          3: 'Location request timed out',
        };
        const message = errorMessages[error.code] || 'Failed to get location';
        setLocationError(message);
        console.error('Geolocation error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return (
    <Stack gap="md">
      <Text size="sm" fw={500}>
        Filter by GPS Location
      </Text>

      {locationError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="orange"
          title="Location Error"
          variant="light"
          withCloseButton
          onClose={() => setLocationError(null)}
        >
          {locationError}
        </Alert>
      )}

      <Group gap="md" wrap="wrap">
        <NumberInput
          label="Latitude"
          aria-label="Latitude"
          value={lat}
          onChange={(value) => setLat(Number(value) || 0)}
          decimalScale={6}
          min={-90}
          max={90}
          step={0.000001}
          w={150}
          size="sm"
        />

        <NumberInput
          label="Longitude"
          aria-label="Longitude"
          value={lng}
          onChange={(value) => setLng(Number(value) || 0)}
          decimalScale={6}
          min={-180}
          max={180}
          step={0.000001}
          w={150}
          size="sm"
        />

        <NumberInput
          label="Radius (km)"
          aria-label="Radius (km)"
          value={radius}
          onChange={(value) => setRadius(Number(value) || 0.1)}
          decimalScale={1}
          min={0.1}
          max={50}
          step={0.1}
          w={120}
          size="sm"
        />
      </Group>

      <Group gap="sm">
        <Button
          variant="light"
          size="sm"
          leftSection={<IconCurrentLocation size={16} />}
          onClick={getCurrentLocation}
          loading={isLoadingLocation}
          disabled={isLoadingLocation}
        >
          Use Current Location
        </Button>

        <Button
          variant="filled"
          size="sm"
          leftSection={<IconMapPin size={16} />}
          onClick={handleApply}
        >
          Apply
        </Button>

        {onClear && (
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconX size={16} />}
            onClick={handleClear}
            color="gray"
          >
            Clear
          </Button>
        )}
      </Group>
    </Stack>
  );
}

export default GPSRadiusFilter;
