'use client';

import React, { useState, useRef } from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { Button, Image, Group, Stack, Text } from '@mantine/core';
import { IconCamera, IconTrash, IconRefresh } from '@tabler/icons-react';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';
import { notifications } from '@mantine/notifications';

interface PhotoFieldProps {
  field: FormField;
  control: Control<any>;
  error?: FieldError;
  disabled?: boolean;
}

interface GPSData {
  lat: number;
  lng: number;
}

export function PhotoField({ field, control, error, disabled }: PhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);

  const getCurrentLocation = async (): Promise<GPSData | null> => {
    if (!navigator.geolocation) {
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (error) {
      console.warn('Failed to get GPS location:', error);
      return null;
    }
  };

  const handleFileUpload = async (file: File | null, onChange: (value: string) => void) => {
    if (!file) {
      onChange('');
      setGpsData(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notifications.show({
        title: 'Invalid File',
        message: 'Please select an image file (JPG, PNG, etc.)',
        color: 'red',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      notifications.show({
        title: 'File Too Large',
        message: 'Image must be less than 10MB',
        color: 'red',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get GPS location
      const gps = await getCurrentLocation();
      if (gps) {
        setGpsData(gps);
      }

      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
        setIsUploading(false);
        notifications.show({
          title: 'Photo Uploaded',
          message: 'Photo uploaded successfully',
          color: 'green',
        });
      };
      reader.onerror = () => {
        setIsUploading(false);
        notifications.show({
          title: 'Upload Failed',
          message: 'Failed to read file',
          color: 'red',
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      notifications.show({
        title: 'Upload Failed',
        message: 'Failed to upload photo',
        color: 'red',
      });
    }
  };

  return (
    <FieldWrapper id={field.id} label={field.label} required={field.required}>
      <Controller
        name={field.id}
        control={control}
        render={({ field: formField }) => {
          const value = formField.value as string | undefined;

          return (
            <Stack gap="sm">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleFileUpload(file, formField.onChange);
                }}
                disabled={disabled}
              />

              {!value ? (
                <Button
                  leftSection={<IconCamera size={18} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  loading={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              ) : (
                <Stack gap="sm">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Image
                      src={value}
                      alt={field.label}
                      width={200}
                      height={200}
                      fit="cover"
                      radius="md"
                      style={{ border: '1px solid #e2e8f0' }}
                    />
                    {gpsData && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          padding: '4px 8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          fontSize: '12px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}
                      >
                        GPS: {gpsData.lat.toFixed(4)}, {gpsData.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <Group gap="sm">
                    <Button
                      leftSection={<IconRefresh size={16} />}
                      variant="light"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                    >
                      Retake
                    </Button>
                    <Button
                      leftSection={<IconTrash size={16} />}
                      variant="light"
                      color="red"
                      size="sm"
                      onClick={() => {
                        formField.onChange('');
                        setGpsData(null);
                      }}
                      disabled={disabled}
                    >
                      Delete
                    </Button>
                  </Group>
                </Stack>
              )}

              {error && (
                <Text size="12px" c="red">
                  {error.message}
                </Text>
              )}
            </Stack>
          );
        }}
      />
    </FieldWrapper>
  );
}
