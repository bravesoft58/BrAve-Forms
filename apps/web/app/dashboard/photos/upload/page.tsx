'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import {
  Text,
  Stack,
  Select,
  Button,
  Paper,
  Group,
  Loader,
  Alert,
  Image,
  SimpleGrid,
  Progress,
  ActionIcon,
  TextInput,
  Badge,
} from '@mantine/core';
import { IconCamera, IconUpload, IconX, IconCheck } from '@tabler/icons-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import { notifications } from '@mantine/notifications';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface PhotoPreview {
  id: string;
  file: File;
  preview: string;
  caption: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  originalSize: number;
  compressedSize?: number;
}

// ISSUE-191: Constants for image compression
const MAX_FILE_SIZE_MB = 50; // Max input file size
const MAX_DIMENSION = 2048; // Max width/height after compression
const COMPRESSION_QUALITY = 0.8; // JPEG quality (0-1)

/**
 * ISSUE-191: Compress image using Canvas API
 * Handles files up to 50MB, compresses to ~2MB for upload
 */
async function compressImage(file: File): Promise<{ blob: Blob; base64: string }> {
  return new Promise((resolve, reject) => {
    // Check file size limit
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      reject(new Error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`));
      return;
    }

    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to create canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Convert blob to base64
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ blob, base64 });
          };
          reader.onerror = () => reject(new Error('Failed to read compressed image'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * ISSUE-190: Upload Photos Page
 *
 * Allows users to:
 * 1. Select a project
 * 2. Select multiple photos from device
 * 3. Add captions to photos
 * 4. Upload photos with progress tracking
 */
export default function UploadPhotosPage() {
  const router = useRouter();
  const auth = useAppAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!auth.getToken) return [];
      const token = await auth.getToken();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query GetProjects {
            projects {
              id
              name
              address
            }
          }`,
        }),
      });
      const result = await response.json();
      return result.data?.projects || [];
    },
    enabled: auth.isLoaded,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      base64,
      caption,
      projectId,
    }: {
      base64: string;
      caption: string;
      projectId: string;
    }) => {
      if (!auth.getToken) throw new Error('Not authenticated');
      const token = await auth.getToken();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `mutation UploadPhoto($input: UploadPhotoBase64Input!) {
            uploadPhoto(input: $input) {
              id
              url
              thumbnailUrl
            }
          }`,
          variables: {
            input: {
              base64,
              projectId,
              caption,
              format: 'jpeg',
            },
          },
        }),
      });
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Upload failed');
      }
      return result.data?.uploadPhoto;
    },
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: PhotoPreview[] = [];
    let oversizedCount = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      // ISSUE-191: Check file size limit
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        oversizedCount++;
        return;
      }

      const preview = URL.createObjectURL(file);
      newPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        caption: '',
        status: 'pending',
        originalSize: file.size,
      });
    });

    if (oversizedCount > 0) {
      notifications.show({
        title: 'Files Too Large',
        message: `${oversizedCount} file(s) exceeded ${MAX_FILE_SIZE_MB}MB limit and were skipped`,
        color: 'yellow',
      });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemovePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleCaptionChange = useCallback((id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
  }, []);

  // ISSUE-191: Upload with compression
  const handleUploadAll = async () => {
    if (!selectedProject || photos.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const photo of photos) {
      if (photo.status === 'success') continue;

      // Update status to uploading
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: 'uploading' } : p)));

      try {
        // ISSUE-191: Compress image before upload
        const { blob, base64 } = await compressImage(photo.file);

        // Update compressed size for display
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, compressedSize: blob.size } : p))
        );

        await uploadMutation.mutateAsync({
          base64,
          caption: photo.caption,
          projectId: selectedProject,
        });

        // Update status to success
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: 'success' } : p)));
        successCount++;
      } catch (error) {
        // Update status to error
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? {
                  ...p,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : p
          )
        );
        errorCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      notifications.show({
        title: 'Photos Uploaded',
        message: `Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}`,
        color: 'green',
      });
    }

    if (errorCount > 0) {
      notifications.show({
        title: 'Upload Errors',
        message: `Failed to upload ${errorCount} photo${errorCount > 1 ? 's' : ''}`,
        color: 'red',
      });
    }
  };

  const pendingPhotos = photos.filter((p) => p.status === 'pending');
  const uploadedPhotos = photos.filter((p) => p.status === 'success');
  const uploadProgress =
    photos.length > 0 ? Math.round((uploadedPhotos.length / photos.length) * 100) : 0;

  return (
    <PageContainer
      title="Upload Photos"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Photos', href: '/dashboard/photos' },
            { label: 'Upload' },
          ]}
        />
      }
    >
      <Paper p="lg" withBorder>
        <Stack gap="lg">
          <Group gap="sm">
            <IconCamera size={24} />
            <Text fw={600} size="16px">
              Upload Site Photos
            </Text>
          </Group>

          {projectsLoading ? (
            <Stack align="center" py="lg">
              <Loader size="md" />
              <Text size="13px" c="dimmed">
                Loading projects...
              </Text>
            </Stack>
          ) : (
            <>
              <Select
                label="Select Project"
                placeholder="Choose a project for these photos"
                data={
                  projects?.map((p) => ({
                    value: p.id,
                    label: `${p.name} - ${p.address}`,
                  })) || []
                }
                value={selectedProject}
                onChange={setSelectedProject}
                searchable
                clearable
                size="md"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <Stack gap="xs">
                <Button
                  leftSection={<IconUpload size={18} />}
                  variant="light"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedProject}
                >
                  Select Photos
                </Button>
                <Text size="11px" c="dimmed">
                  Max {MAX_FILE_SIZE_MB}MB per photo. Images are automatically compressed for
                  upload.
                </Text>
              </Stack>

              {photos.length > 0 && (
                <>
                  <Progress value={uploadProgress} size="sm" />
                  <Text size="13px" c="dimmed">
                    {uploadedPhotos.length} of {photos.length} photos uploaded
                  </Text>

                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                    {photos.map((photo) => (
                      <Paper key={photo.id} p="xs" withBorder>
                        <Stack gap="xs">
                          <div style={{ position: 'relative' }}>
                            <Image
                              src={photo.preview}
                              alt="Preview"
                              height={120}
                              fit="cover"
                              radius="sm"
                            />
                            {photo.status === 'success' && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  background: 'rgba(0, 128, 0, 0.8)',
                                  borderRadius: '50%',
                                  padding: 4,
                                }}
                              >
                                <IconCheck size={16} color="white" />
                              </div>
                            )}
                            {photo.status === 'uploading' && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                }}
                              >
                                <Loader size="sm" color="white" />
                              </div>
                            )}
                            {photo.status === 'pending' && (
                              <ActionIcon
                                variant="filled"
                                color="red"
                                size="sm"
                                radius="xl"
                                style={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                }}
                                onClick={() => handleRemovePhoto(photo.id)}
                              >
                                <IconX size={12} />
                              </ActionIcon>
                            )}
                          </div>
                          {/* ISSUE-191: Show file size info */}
                          <Group gap={4}>
                            <Badge size="xs" variant="light" color="gray">
                              {formatFileSize(photo.originalSize)}
                            </Badge>
                            {photo.compressedSize && (
                              <Badge size="xs" variant="light" color="green">
                                {formatFileSize(photo.compressedSize)}
                              </Badge>
                            )}
                          </Group>
                          <TextInput
                            placeholder="Caption (optional)"
                            size="xs"
                            value={photo.caption}
                            onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                            disabled={photo.status !== 'pending'}
                          />
                          {photo.status === 'error' && (
                            <Text size="11px" c="red">
                              {photo.error}
                            </Text>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>

                  <Group>
                    <Button
                      onClick={handleUploadAll}
                      disabled={pendingPhotos.length === 0 || isUploading}
                      loading={isUploading}
                    >
                      Upload {pendingPhotos.length} Photo
                      {pendingPhotos.length !== 1 ? 's' : ''}
                    </Button>
                    {uploadedPhotos.length > 0 && !isUploading && (
                      <Button
                        variant="subtle"
                        onClick={() => router.push(`/dashboard/projects/${selectedProject}`)}
                      >
                        View Project
                      </Button>
                    )}
                  </Group>
                </>
              )}

              {!projects?.length && (
                <Alert color="yellow" title="No Projects">
                  You need to create a project first before uploading photos.
                  <Button
                    variant="subtle"
                    size="xs"
                    mt="xs"
                    onClick={() => router.push('/dashboard/projects/new')}
                  >
                    Create Project
                  </Button>
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </PageContainer>
  );
}
