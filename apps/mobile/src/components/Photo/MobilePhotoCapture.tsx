import React, { useState, useCallback, useRef } from 'react';
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Grid,
  ActionIcon,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Image,
  Alert,
  Progress,
  Tooltip,
  Center,
  Loader,
  Box,
} from '@mantine/core';
import {
  IconCamera,
  IconPhoto,
  IconMapPin,
  IconClock,
  IconTrash,
  IconEdit,
  IconUpload,
  IconDownload,
  IconAlertCircle,
  IconCheck,
  IconGps,
  IconCloudUpload,
} from '@tabler/icons-react';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// Hooks and utilities
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useMobileStore } from '../../hooks/useMobileStore';

interface CapturedPhoto {
  id: string;
  uri: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  description?: string;
  projectId?: string;
  inspectionType?: string;
  fileSize?: number;
  filename: string;
  isSynced: boolean;
}

interface MobilePhotoCaptureProps {
  projectId?: string;
  inspectionId?: string;
  maxPhotos?: number;
  onPhotosChange?: (photos: CapturedPhoto[]) => void;
}

export function MobilePhotoCapture({
  projectId,
  inspectionId,
  maxPhotos = 50,
  onPhotosChange
}: MobilePhotoCaptureProps) {
  const { width } = useViewportSize();
  const { isOnline } = useNetworkStatus();
  const { addToQueue } = useOfflineQueue();
  const { currentProject } = useMobileStore();

  // Local state
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<CapturedPhoto | null>(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [description, setDescription] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isMobile = width < 768;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current location for photo tagging
  const getCurrentLocation = useCallback(async (): Promise<Position | null> => {
    if (!locationEnabled) return null;

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds for construction sites
      });
      return position;
    } catch (error) {
      console.error('Failed to get location:', error);
      notifications.show({
        title: 'Location Error',
        message: 'Unable to get GPS location. Photo will be saved without location data.',
        color: 'orange',
        icon: <IconAlertCircle size={20} />,
        autoClose: 4000,
      });
      return null;
    }
  }, [locationEnabled]);

  // Generate unique filename with timestamp
  const generateFilename = useCallback((extension: string = 'jpg'): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectPrefix = currentProject?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'project';
    return `${projectPrefix}_${timestamp}.${extension}`;
  }, [currentProject]);

  // Save photo to device storage
  const savePhotoToDevice = useCallback(async (photoData: string, filename: string): Promise<string> => {
    try {
      const savedFile = await Filesystem.writeFile({
        path: `photos/${filename}`,
        data: photoData,
        directory: Directory.Data,
      });

      return savedFile.uri;
    } catch (error) {
      console.error('Failed to save photo:', error);
      throw new Error('Failed to save photo to device');
    }
  }, []);

  // Capture photo using device camera
  const capturePhoto = useCallback(async () => {
    if (photos.length >= maxPhotos) {
      notifications.show({
        title: 'Photo Limit Reached',
        message: `Maximum of ${maxPhotos} photos allowed`,
        color: 'orange',
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    setCapturing(true);

    try {
      // Get current location first
      const location = await getCurrentLocation();

      // Capture photo
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true,
        correctOrientation: true,
        presentationStyle: 'fullscreen',
      });

      if (!photo.dataUrl) {
        throw new Error('No photo data received');
      }

      // Generate filename and save to device
      const filename = generateFilename('jpg');
      const deviceUri = await savePhotoToDevice(photo.dataUrl, filename);

      // Create photo record
      const capturedPhoto: CapturedPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: deviceUri,
        timestamp: new Date(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        } : undefined,
        projectId: projectId || currentProject?.id,
        filename,
        isSynced: false,
        fileSize: Math.round(photo.dataUrl.length * 0.75), // Approximate file size
      };

      // Update state
      const updatedPhotos = [...photos, capturedPhoto];
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);

      // Provide haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }

      notifications.show({
        title: 'Photo Captured',
        message: `Photo saved ${location ? 'with GPS coordinates' : 'without location'}`,
        color: 'green',
        icon: <IconCheck size={20} />,
        autoClose: 3000,
      });

      // Auto-upload if online
      if (isOnline) {
        uploadPhotoToServer(capturedPhoto);
      } else {
        addToOfflineQueue(capturedPhoto);
      }

    } catch (error: any) {
      console.error('Failed to capture photo:', error);
      notifications.show({
        title: 'Camera Error',
        message: error.message || 'Failed to capture photo',
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
    } finally {
      setCapturing(false);
    }
  }, [photos, maxPhotos, getCurrentLocation, generateFilename, savePhotoToDevice, projectId, currentProject, onPhotosChange, isOnline]);

  // Select photo from gallery
  const selectFromGallery = useCallback(async () => {
    if (photos.length >= maxPhotos) {
      notifications.show({
        title: 'Photo Limit Reached',
        message: `Maximum of ${maxPhotos} photos allowed`,
        color: 'orange',
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (!photo.dataUrl) {
        throw new Error('No photo data received');
      }

      // Get location (current, not EXIF)
      const location = await getCurrentLocation();

      // Generate filename and save
      const filename = generateFilename('jpg');
      const deviceUri = await savePhotoToDevice(photo.dataUrl, filename);

      const selectedPhoto: CapturedPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: deviceUri,
        timestamp: new Date(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        } : undefined,
        projectId: projectId || currentProject?.id,
        filename,
        isSynced: false,
        fileSize: Math.round(photo.dataUrl.length * 0.75),
      };

      const updatedPhotos = [...photos, selectedPhoto];
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);

      notifications.show({
        title: 'Photo Added',
        message: 'Photo imported from gallery',
        color: 'green',
        icon: <IconCheck size={20} />,
        autoClose: 3000,
      });

      // Auto-upload if online
      if (isOnline) {
        uploadPhotoToServer(selectedPhoto);
      } else {
        addToOfflineQueue(selectedPhoto);
      }

    } catch (error: any) {
      console.error('Failed to select photo:', error);
      notifications.show({
        title: 'Gallery Error',
        message: error.message || 'Failed to select photo',
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
    }
  }, [photos, maxPhotos, getCurrentLocation, generateFilename, savePhotoToDevice, projectId, currentProject, onPhotosChange, isOnline]);

  // Upload photo to server
  const uploadPhotoToServer = useCallback(async (photo: CapturedPhoto) => {
    try {
      // Add to upload queue
      await addToQueue({
        type: 'photo_upload',
        payload: {
          ...photo,
          inspectionId,
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date(),
          },
        },
        priority: 'medium',
        retryCount: 0,
        maxRetries: 3,
        timestamp: new Date(),
      });

      // Mark as synced locally (will be updated when actual sync completes)
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, isSynced: true } : p
      ));

    } catch (error) {
      console.error('Failed to queue photo upload:', error);
    }
  }, [addToQueue, inspectionId]);

  // Add photo to offline queue
  const addToOfflineQueue = useCallback(async (photo: CapturedPhoto) => {
    await addToQueue({
      type: 'photo_upload',
      payload: photo,
      priority: 'medium',
      retryCount: 0,
      maxRetries: 3,
      timestamp: new Date(),
    });
  }, [addToQueue]);

  // Delete photo
  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

      // Delete from device storage
      if (photo.filename) {
        try {
          await Filesystem.deleteFile({
            path: `photos/${photo.filename}`,
            directory: Directory.Data,
          });
        } catch (error) {
          console.error('Failed to delete file from device:', error);
        }
      }

      // Remove from state
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);

      notifications.show({
        title: 'Photo Deleted',
        message: 'Photo removed successfully',
        color: 'orange',
        icon: <IconTrash size={20} />,
        autoClose: 2000,
      });

    } catch (error) {
      console.error('Failed to delete photo:', error);
      notifications.show({
        title: 'Delete Failed',
        message: 'Unable to delete photo',
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
    }
  }, [photos, onPhotosChange]);

  // Edit photo description
  const handleEditPhoto = useCallback((photo: CapturedPhoto) => {
    setEditingPhoto(photo);
    setDescription(photo.description || '');
    openEdit();
  }, [openEdit]);

  // Save photo description
  const savePhotoDescription = useCallback(() => {
    if (!editingPhoto) return;

    const updatedPhotos = photos.map(photo =>
      photo.id === editingPhoto.id
        ? { ...photo, description }
        : photo
    );

    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);

    setEditingPhoto(null);
    setDescription('');
    closeEdit();

    notifications.show({
      title: 'Description Updated',
      message: 'Photo description saved',
      color: 'green',
      icon: <IconCheck size={20} />,
      autoClose: 2000,
    });
  }, [editingPhoto, description, photos, onPhotosChange, closeEdit]);

  // Upload all pending photos
  const uploadAllPhotos = useCallback(async () => {
    if (!isOnline) {
      notifications.show({
        title: 'Offline Mode',
        message: 'Photos will be uploaded when connection is restored',
        color: 'orange',
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    const pendingPhotos = photos.filter(p => !p.isSynced);
    if (pendingPhotos.length === 0) {
      notifications.show({
        title: 'All Synced',
        message: 'All photos are already uploaded',
        color: 'green',
        icon: <IconCheck size={20} />,
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < pendingPhotos.length; i++) {
        await uploadPhotoToServer(pendingPhotos[i]);
        setUploadProgress(((i + 1) / pendingPhotos.length) * 100);
      }

      notifications.show({
        title: 'Upload Complete',
        message: `${pendingPhotos.length} photos uploaded successfully`,
        color: 'green',
        icon: <IconCloudUpload size={20} />,
      });

    } catch (error) {
      notifications.show({
        title: 'Upload Failed',
        message: 'Some photos failed to upload',
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [isOnline, photos, uploadPhotoToServer]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get total file size
  const totalFileSize = photos.reduce((total, photo) => total + (photo.fileSize || 0), 0);
  const pendingPhotos = photos.filter(p => !p.isSynced);

  return (
    <Container size="lg" p={isMobile ? 'xs' : 'md'}>
      {/* Header */}
      <Card shadow="sm" p="md" mb="md">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Title order={2} size="h3">
              Photo Documentation
            </Title>
            <Text size="sm" c="dimmed">
              Capture site conditions with GPS coordinates
            </Text>
          </div>

          <Group gap="xs">
            <Badge color="blue" variant="light">
              {photos.length}/{maxPhotos}
            </Badge>
            {pendingPhotos.length > 0 && (
              <Badge color="orange" variant="filled">
                {pendingPhotos.length} pending
              </Badge>
            )}
          </Group>
        </Group>

        {/* Quick stats */}
        <Group gap="md" mt="sm" wrap="wrap">
          <Text size="xs" c="dimmed">
            Total size: {formatFileSize(totalFileSize)}
          </Text>
          <Text size="xs" c="dimmed">
            GPS: {locationEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text size="xs" c="dimmed">
            Network: {isOnline ? 'Online' : 'Offline'}
          </Text>
        </Group>
      </Card>

      {/* Capture Controls */}
      <Card shadow="sm" p="md" mb="md">
        <Group justify="center" gap="md" wrap="wrap">
          <Button
            leftSection={<IconCamera size={24} />}
            onClick={capturePhoto}
            loading={capturing}
            disabled={photos.length >= maxPhotos}
            size={isMobile ? 'lg' : 'md'}
            style={{ minWidth: isMobile ? '160px' : '140px' }}
          >
            {capturing ? 'Capturing...' : 'Take Photo'}
          </Button>

          <Button
            leftSection={<IconPhoto size={24} />}
            onClick={selectFromGallery}
            variant="light"
            disabled={photos.length >= maxPhotos}
            size={isMobile ? 'lg' : 'md'}
            style={{ minWidth: isMobile ? '160px' : '140px' }}
          >
            From Gallery
          </Button>

          {pendingPhotos.length > 0 && (
            <Button
              leftSection={<IconUpload size={24} />}
              onClick={uploadAllPhotos}
              loading={uploading}
              variant="outline"
              color="blue"
              size={isMobile ? 'lg' : 'md'}
              disabled={!isOnline}
            >
              Upload All
            </Button>
          )}
        </Group>

        {/* Upload Progress */}
        {uploading && uploadProgress > 0 && (
          <Box mt="md">
            <Progress value={uploadProgress} animated />
            <Text size="xs" ta="center" mt="xs">
              Uploading... {Math.round(uploadProgress)}%
            </Text>
          </Box>
        )}
      </Card>

      {/* Network Status Alert */}
      {!isOnline && photos.length > 0 && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Offline Mode"
          color="orange"
          mb="md"
        >
          Photos are saved locally and will sync when internet connection is restored.
        </Alert>
      )}

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <Grid gutter="md">
          {photos.map((photo, index) => (
            <Grid.Col key={photo.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" p="sm" style={{ position: 'relative' }}>
                {/* Sync Status Badge */}
                <Badge
                  color={photo.isSynced ? 'green' : 'orange'}
                  variant="filled"
                  size="xs"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                >
                  {photo.isSynced ? 'Synced' : 'Pending'}
                </Badge>

                {/* Photo Image */}
                <Box style={{ position: 'relative', marginBottom: '12px' }}>
                  <Image
                    src={photo.uri}
                    alt={`Photo ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                    onError={(e) => {
                      console.error('Failed to load image:', photo.uri);
                      e.currentTarget.src = '/placeholder-image.png';
                    }}
                  />
                </Box>

                {/* Photo Info */}
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" c="dimmed">
                        {photo.timestamp.toLocaleString()}
                      </Text>
                      {photo.location && (
                        <Group gap="xs" mt="2px">
                          <IconGps size={12} color="#22c55e" />
                          <Text size="xs" c="dimmed" truncate>
                            GPS: {photo.location.latitude.toFixed(6)}, {photo.location.longitude.toFixed(6)}
                          </Text>
                        </Group>
                      )}
                      {photo.fileSize && (
                        <Text size="xs" c="dimmed">
                          Size: {formatFileSize(photo.fileSize)}
                        </Text>
                      )}
                    </div>
                  </Group>

                  {/* Description */}
                  {photo.description && (
                    <Text size="sm" style={{ wordBreak: 'break-word' }}>
                      {photo.description}
                    </Text>
                  )}

                  {/* Action Buttons */}
                  <Group gap="xs" justify="center">
                    <Tooltip label="Add description">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleEditPhoto(photo)}
                        size="sm"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Delete photo">
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => deletePhoto(photo.id)}
                        size="sm"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Card shadow="sm" p="xl">
          <Center>
            <Stack align="center" gap="md">
              <IconCamera size={64} style={{ opacity: 0.3 }} />
              <div style={{ textAlign: 'center' }}>
                <Text size="lg" fw={500} mb="xs">
                  No Photos Yet
                </Text>
                <Text size="sm" c="dimmed" mb="lg">
                  Start documenting the construction site by taking photos
                </Text>
                <Button
                  leftSection={<IconCamera size={20} />}
                  onClick={capturePhoto}
                  loading={capturing}
                  size="lg"
                >
                  Take First Photo
                </Button>
              </div>
            </Stack>
          </Center>
        </Card>
      )}

      {/* Edit Photo Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title="Edit Photo Description"
        centered
        size="md"
      >
        {editingPhoto && (
          <Stack gap="md">
            <Image
              src={editingPhoto.uri}
              alt="Photo to edit"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />

            <Textarea
              label="Description"
              placeholder="Describe what this photo shows..."
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              rows={4}
              maxLength={500}
            />

            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" onClick={closeEdit}>
                Cancel
              </Button>
              <Button onClick={savePhotoDescription}>
                Save Description
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}