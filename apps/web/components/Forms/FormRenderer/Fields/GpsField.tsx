'use client';

import React, { useState, useCallback } from 'react';
import { Control, Controller, FieldError } from 'react-hook-form';
import { Stack, Group, Button, Text, Paper, Badge, Alert, Loader } from '@mantine/core';
import { IconMapPin, IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';
import {
  getCurrentPosition,
  isGeolocationError,
  formatCoordinates,
  formatAccuracy,
  getAccuracyColor,
  isGeolocationAvailable,
  GPSCoordinates,
} from '@/lib/geolocation';

interface GpsFieldProps {
  field: FormField;
  control: Control<any>;
  error?: FieldError;
  disabled?: boolean;
}

/**
 * GPS Field Component - Sprint 5 ISSUE-166
 *
 * Captures real GPS coordinates using Web Geolocation API.
 * Stores structured GPS data (lat, lng, accuracy, altitude, timestamp).
 * Field-optimized with large touch targets for construction site use.
 */
export function GpsField({ field, control, error, disabled }: GpsFieldProps) {
  const [loading, setLoading] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const available = isGeolocationAvailable();

  const captureLocation = useCallback(
    async (onChange: (value: GPSCoordinates | null) => void) => {
      if (!available || disabled) return;

      setLoading(true);
      setCaptureError(null);

      const result = await getCurrentPosition(true, 30000);

      if (isGeolocationError(result)) {
        setCaptureError(result.message);
        setLoading(false);
        return;
      }

      // Store full GPS coordinates object
      onChange(result);
      setLoading(false);
    },
    [available, disabled]
  );

  if (!available) {
    return (
      <FieldWrapper id={field.id} label={field.label} required={field.required}>
        <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
          GPS is not available on this device or browser
        </Alert>
      </FieldWrapper>
    );
  }

  return (
    <Controller
      name={field.id}
      control={control}
      render={({ field: controllerField }) => {
        const value = controllerField.value as GPSCoordinates | null | undefined;

        return (
          <FieldWrapper id={field.id} label={field.label} required={field.required}>
            <Stack gap="xs">
              {value ? (
                // GPS coordinates captured - show result
                <Paper p="sm" withBorder>
                  <Stack gap="xs">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs">
                        <IconMapPin size={18} style={{ flexShrink: 0 }} />
                        <Text size="sm" fw={500}>
                          {formatCoordinates(value)}
                        </Text>
                      </Group>
                      <Badge size="sm" color={getAccuracyColor(value.accuracy)} variant="light">
                        {formatAccuracy(value.accuracy)}
                      </Badge>
                    </Group>

                    <Group gap="md">
                      <Text size="xs" c="dimmed">
                        Accuracy: {Math.round(value.accuracy)}m
                      </Text>
                      {value.altitude !== undefined && (
                        <Text size="xs" c="dimmed">
                          Altitude: {Math.round(value.altitude)}m
                        </Text>
                      )}
                      <Text size="xs" c="dimmed">
                        Captured: {new Date(value.timestamp).toLocaleTimeString()}
                      </Text>
                    </Group>

                    {!disabled && (
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={loading ? <Loader size={14} /> : <IconRefresh size={14} />}
                        onClick={() => captureLocation(controllerField.onChange)}
                        loading={loading}
                        disabled={loading}
                      >
                        Update Location
                      </Button>
                    )}
                  </Stack>
                </Paper>
              ) : (
                // No coordinates yet - show capture button
                <Button
                  leftSection={loading ? <Loader size={16} /> : <IconMapPin size={18} />}
                  onClick={() => captureLocation(controllerField.onChange)}
                  loading={loading}
                  disabled={loading || disabled}
                  size="md"
                  h={48}
                >
                  {loading ? 'Getting Location...' : 'Capture GPS Location'}
                </Button>
              )}

              {/* Capture error message */}
              {captureError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  variant="light"
                  title="Location Error"
                  withCloseButton
                  onClose={() => setCaptureError(null)}
                >
                  {captureError}
                </Alert>
              )}

              {/* Validation error */}
              {error && (
                <Text size="xs" c="red">
                  {error.message}
                </Text>
              )}
            </Stack>
          </FieldWrapper>
        );
      }}
    />
  );
}
