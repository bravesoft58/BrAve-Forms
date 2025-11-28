'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import {
  Button,
  Image,
  Group,
  Stack,
  Text,
  Progress,
  Paper,
  Badge,
} from '@mantine/core';
import { IconCamera, IconTrash, IconRefresh, IconPhoto } from '@tabler/icons-react';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@clerk/nextjs';
import {
  capturePhoto,
  selectPhoto,
  uploadPhoto,
  isPhotoUploadError,
  isCapturedPhoto,
  PhotoUploadResult,
} from '@/lib/photo-upload';

interface PhotoFieldProps {
  field: FormField;
  control: Control<any>;
  error?: FieldError;
  disabled?: boolean;
}

interface PhotoData {
  id: string;
  url: string;
  thumbnailUrl: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
}

export function PhotoField({ field, control, error, disabled }: PhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { getToken } = useAuth();

  const handleCapture = useCallback(
    async (onChange: (value: PhotoData | null) => void) => {
      setIsUploading(true);
      setUploadProgress(10);

      try {
        // Capture photo
        const captured = await capturePhoto();

        if (isPhotoUploadError(captured)) {
          notifications.show({
            title: 'Capture Failed',
            message: captured.message,
            color: 'red',
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        if (!isCapturedPhoto(captured)) {
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        setUploadProgress(40);

        // Get auth token
        const token = await getToken();
        if (!token) {
          notifications.show({
            title: 'Upload Failed',
            message: 'Authentication required. Please sign in.',
            color: 'red',
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        setUploadProgress(50);

        // Upload to MinIO
        const result = await uploadPhoto(captured, token, {
          fieldName: field.id,
        });

        if (isPhotoUploadError(result)) {
          notifications.show({
            title: 'Upload Failed',
            message: result.message,
            color: 'red',
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        setUploadProgress(100);

        // Store photo data in form
        const photoData: PhotoData = {
          id: result.id,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          latitude: result.latitude,
          longitude: result.longitude,
          takenAt: result.takenAt,
        };

        onChange(photoData);

        notifications.show({
          title: 'Photo Uploaded',
          message: 'Photo uploaded to storage successfully',
          color: 'green',
        });
      } catch (err) {
        console.error('Photo capture error:', err);
        notifications.show({
          title: 'Upload Failed',
          message: 'An unexpected error occurred',
          color: 'red',
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [getToken, field.id]
  );

  const handleSelect = useCallback(
    async (onChange: (value: PhotoData | null) => void) => {
      setIsUploading(true);
      setUploadProgress(10);

      try {
        // Select photo from gallery
        const captured = await selectPhoto();

        if (isPhotoUploadError(captured)) {
          notifications.show({
            title: 'Selection Failed',
            message: captured.message,
            color: 'red',
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        if (!isCapturedPhoto(captured)) {
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        setUploadProgress(40);

        // Get auth token
        const token = await getToken();
        if (!token) {
          notifications.show({
            title: 'Upload Failed',
            message: 'Authentication required. Please sign in.',
            color: 'red',
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        setUploadProgress(50);

        // Upload to MinIO
        const result = await uploadPhoto(captured, token, {
          fieldName: field.id,
        });

        if (isPhotoUploadError(result)) {
          notifications.show({
            title: 'Upload Failed',
            message: result.message,
            color: 'red',
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        setUploadProgress(100);

        // Store photo data in form
        const photoData: PhotoData = {
          id: result.id,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          latitude: result.latitude,
          longitude: result.longitude,
          takenAt: result.takenAt,
        };

        onChange(photoData);

        notifications.show({
          title: 'Photo Uploaded',
          message: 'Photo uploaded to storage successfully',
          color: 'green',
        });
      } catch (err) {
        console.error('Photo selection error:', err);
        notifications.show({
          title: 'Upload Failed',
          message: 'An unexpected error occurred',
          color: 'red',
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [getToken, field.id]
  );

  const handleDelete = useCallback((onChange: (value: PhotoData | null) => void) => {
    onChange(null);
    notifications.show({
      title: 'Photo Removed',
      message: 'Photo has been removed from the form',
      color: 'blue',
    });
  }, []);

  return (
    <FieldWrapper id={field.id} label={field.label} required={field.required}>
      <Controller
        name={field.id}
        control={control}
        render={({ field: formField }) => {
          const value = formField.value as PhotoData | string | null | undefined;

          // Handle both old format (string URL) and new format (PhotoData object)
          const photoData: PhotoData | null =
            typeof value === 'string'
              ? value
                ? { id: '', url: value, thumbnailUrl: value }
                : null
              : value || null;

          return (
            <Stack gap="sm">
              {/* Upload Progress */}
              {isUploading && (
                <Paper p="sm" withBorder>
                  <Stack gap="xs">
                    <Text size="sm">Uploading photo to storage...</Text>
                    <Progress value={uploadProgress} animated size="sm" />
                  </Stack>
                </Paper>
              )}

              {!photoData && !isUploading ? (
                <Group gap="sm">
                  <Button
                    leftSection={<IconCamera size={18} />}
                    onClick={() => handleCapture(formField.onChange)}
                    disabled={disabled}
                    h={48}
                  >
                    Take Photo
                  </Button>
                  <Button
                    leftSection={<IconPhoto size={18} />}
                    variant="light"
                    onClick={() => handleSelect(formField.onChange)}
                    disabled={disabled}
                    h={48}
                  >
                    Choose Photo
                  </Button>
                </Group>
              ) : photoData ? (
                <Stack gap="sm">
                  <Paper p="xs" withBorder style={{ position: 'relative', display: 'inline-block' }}>
                    <Image
                      src={photoData.thumbnailUrl || photoData.url}
                      alt={field.label}
                      w={200}
                      h={200}
                      fit="cover"
                      radius="sm"
                    />
                    {photoData.latitude && photoData.longitude && (
                      <Badge
                        size="sm"
                        variant="filled"
                        color="dark"
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                        }}
                      >
                        GPS: {photoData.latitude.toFixed(4)}, {photoData.longitude.toFixed(4)}
                      </Badge>
                    )}
                  </Paper>
                  <Group gap="sm">
                    <Button
                      leftSection={<IconRefresh size={16} />}
                      variant="light"
                      size="sm"
                      onClick={() => handleCapture(formField.onChange)}
                      disabled={disabled || isUploading}
                      h={40}
                    >
                      Retake
                    </Button>
                    <Button
                      leftSection={<IconTrash size={16} />}
                      variant="light"
                      color="red"
                      size="sm"
                      onClick={() => handleDelete(formField.onChange)}
                      disabled={disabled || isUploading}
                      h={40}
                    >
                      Delete
                    </Button>
                  </Group>
                </Stack>
              ) : null}

              {error && (
                <Text size="xs" c="red">
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
