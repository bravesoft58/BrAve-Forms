# ISSUE-167: Implement Photo Upload to Storage (8h)

**Sprint:** Sprint 5 | **Phase:** 0 - Production-Ready Fixes | **Priority:** P0
**Time:** 8 hours | **Complexity:** High
**Created:** 2025-11-27
**Completed:** 2025-11-27
**Dependencies:** MinIO/S3 storage configured, Backend photo upload endpoint exists
**Status:** COMPLETE (Code Review Fixes Applied)

## Implementation Summary

Implemented real photo upload functionality to MinIO storage with the following components:

### Backend Changes

- **photos.resolver.ts**: Added `uploadPhoto` mutation accepting base64 input
  - Added cross-tenant validation for projectId/submissionId (code review fix)
  - Added PrismaService for ownership checks
- **photos.service.ts**: Added `uploadPhotoFromBase64` method for form submissions
- **photos.types.ts**: Added `UploadPhotoBase64Input` and `PhotoUploadResult` GraphQL types
- **schema.prisma**: Made `inspectionId` optional, added `submissionId` and `fieldName` fields

### Frontend Changes

- **photo-upload.ts**: New utility library with capturePhoto, selectPhoto, uploadPhoto functions
  - Fixed BACKEND_URL to use NEXT_PUBLIC_GRAPHQL_ENDPOINT (code review fix)
  - Increased compression quality from 0.8 to 0.9 for construction detail (code review fix)
  - Added full offline queue implementation with IndexedDB (code review fix)
  - Added uploadPhotoWithOfflineSupport for 30-day offline capability
- **PhotoField.tsx**: Updated to use MinIO upload instead of base64 storage
- **geolocation.ts**: Increased GPS timeout from 30s to 60s (code review fix)
  - Added validateCoordinates and areCoordinatesValid functions (code review fix)
  - Added null island detection (0,0 coordinate validation)
- Includes progress bar, GPS display, error handling

### Code Review Fixes Applied

1. **CRITICAL-1**: Fixed hardcoded BACKEND_URL - now uses NEXT_PUBLIC_GRAPHQL_ENDPOINT
2. **CRITICAL-2**: Added offline queue for 30-day offline capability (IndexedDB-based)
3. **CRITICAL-3**: Verified StorageService.processAndStorePhoto exists
4. **HIGH-6**: Added cross-tenant validation for projectId/submissionId ownership
5. **HIGH-7**: Increased GPS timeout from 30s to 60s for construction sites
6. **HIGH-8**: Added GPS coordinate validation with range checks and null island detection
7. **HIGH-9**: Increased photo compression quality from 0.8 to 0.9

### Tests (94 passing)

- photo-upload.test.ts: 30 tests for utility functions (+7 for offline queue)
- PhotoField.test.tsx: 21 tests for component
- geolocation.test.ts: 43 tests (+17 for coordinate validation)

## What You'll Do

Implement real photo upload functionality to MinIO storage. Currently photo fields capture images but don't actually upload them - they need to upload to object storage with GPS EXIF extraction.

## Prerequisites

- [ ] MinIO running locally (port 30103 console)
- [ ] Backend photo upload mutation working
- [ ] S3-compatible bucket configured
- [ ] Capacitor Camera plugin available for mobile
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Review Current Photo Field Implementation (30 min)

Check current photo field and backend configuration:

```bash
cd apps/web
ls -la components/Forms/fields/
grep -r "photo\|Photo\|image\|Image" components/Forms/fields/ --include="*.tsx"

# Check backend photo service
cd ../backend
grep -r "photo\|Photo" src/modules/ --include="*.ts"
```

### Step 2: Create Photo Upload Service (90 min)

Create `apps/web/lib/photo-upload.ts`:

```typescript
/**
 * Photo upload service for form submissions
 *
 * Handles:
 * - File compression (Progressive JPEG)
 * - EXIF extraction (GPS coordinates, timestamp)
 * - Upload to S3/MinIO
 * - Thumbnail generation
 * - Offline queue for failed uploads
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:30101';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const THUMBNAIL_WIDTH = 200;
const COMPRESSION_QUALITY = 0.8;

export interface PhotoUploadResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
  mimeType: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  takenAt?: string;
}

export interface PhotoUploadError {
  code: 'FILE_TOO_LARGE' | 'UPLOAD_FAILED' | 'PERMISSION_DENIED' | 'CAMERA_ERROR' | 'NETWORK_ERROR';
  message: string;
}

/**
 * Capture photo from camera
 */
export async function capturePhoto(): Promise<Photo | PhotoUploadError> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: true,
      });
      return photo;
    } catch (error: any) {
      if (error.message?.includes('denied')) {
        return {
          code: 'PERMISSION_DENIED',
          message: 'Camera permission denied. Please enable in settings.',
        };
      }
      return {
        code: 'CAMERA_ERROR',
        message: error.message || 'Failed to capture photo',
      };
    }
  }

  // Web: Use file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({
          code: 'CAMERA_ERROR',
          message: 'No file selected',
        });
        return;
      }

      const base64 = await fileToBase64(file);
      resolve({
        base64: base64.split(',')[1],
        format: file.type.split('/')[1] as any,
      });
    };

    input.click();
  });
}

/**
 * Select photo from gallery
 */
export async function selectPhoto(): Promise<Photo | PhotoUploadError> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      return photo;
    } catch (error: any) {
      return {
        code: 'PERMISSION_DENIED',
        message: 'Photo library access denied. Please enable in settings.',
      };
    }
  }

  // Web: Use file input
  return capturePhoto(); // Same flow on web
}

/**
 * Upload photo to storage
 */
export async function uploadPhoto(
  photo: Photo,
  token: string,
  metadata?: {
    submissionId?: string;
    fieldName?: string;
    caption?: string;
  }
): Promise<PhotoUploadResult | PhotoUploadError> {
  if (!photo.base64) {
    return {
      code: 'CAMERA_ERROR',
      message: 'No photo data available',
    };
  }

  // Check file size
  const sizeInBytes = (photo.base64.length * 3) / 4;
  if (sizeInBytes > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `Photo is too large (${Math.round(sizeInBytes / 1024 / 1024)}MB). Maximum is 10MB.`,
    };
  }

  try {
    // Compress image
    const compressedBase64 = await compressImage(photo.base64, photo.format);

    // Upload to backend
    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation UploadPhoto($input: PhotoUploadInput!) {
            uploadPhoto(input: $input) {
              id
              url
              thumbnailUrl
              filename
              size
              mimeType
              gpsCoordinates {
                latitude
                longitude
              }
              takenAt
            }
          }
        `,
        variables: {
          input: {
            base64: compressedBase64,
            format: photo.format || 'jpeg',
            submissionId: metadata?.submissionId,
            fieldName: metadata?.fieldName,
            caption: metadata?.caption,
          },
        },
      }),
    });

    if (!response.ok) {
      return {
        code: 'NETWORK_ERROR',
        message: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[uploadPhoto] GraphQL errors:', result.errors);
      return {
        code: 'UPLOAD_FAILED',
        message: result.errors[0]?.message || 'Upload failed',
      };
    }

    return result.data.uploadPhoto;
  } catch (error: any) {
    console.error('[uploadPhoto] Error:', error);
    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network error during upload',
    };
  }
}

/**
 * Compress image using canvas
 */
async function compressImage(base64: string, format: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Calculate new dimensions (max 2000px)
      let { width, height } = img;
      const maxDimension = 2000;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with compression
      const compressed = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);
      resolve(compressed.split(',')[1]);
    };

    img.src = `data:image/${format};base64,${base64}`;
  });
}

/**
 * Convert File to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if result is an error
 */
export function isPhotoUploadError(
  result: PhotoUploadResult | PhotoUploadError
): result is PhotoUploadError {
  return 'code' in result && 'message' in result && !('url' in result);
}
```

### Step 3: Create Photo Field Component (90 min)

Create or update `apps/web/components/Forms/fields/PhotoField.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import {
  Stack,
  Group,
  Button,
  Text,
  Image,
  Paper,
  SimpleGrid,
  ActionIcon,
  Progress,
  Alert,
} from '@mantine/core';
import { IconCamera, IconPhoto, IconTrash, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { useAppAuth } from '@/app/providers';
import {
  capturePhoto,
  selectPhoto,
  uploadPhoto,
  isPhotoUploadError,
  PhotoUploadResult,
} from '@/lib/photo-upload';

interface PhotoFieldProps {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  maxPhotos?: number;
}

export function PhotoField({
  name,
  label,
  required,
  description,
  maxPhotos = 10,
}: PhotoFieldProps) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    setError(null);
    setUploading(true);
    setUploadProgress(10);

    const photo = await capturePhoto();

    if (isPhotoUploadError(photo)) {
      setError(photo.message);
      setUploading(false);
      return;
    }

    setUploadProgress(30);

    const token = await getToken();
    const result = await uploadPhoto(photo, token);

    if (isPhotoUploadError(result)) {
      setError(result.message);
      setUploading(false);
      return;
    }

    setUploadProgress(100);
    append(result);
    setUploading(false);
    setUploadProgress(0);
  }, [append, getToken]);

  const handleSelect = useCallback(async () => {
    setError(null);
    setUploading(true);
    setUploadProgress(10);

    const photo = await selectPhoto();

    if (isPhotoUploadError(photo)) {
      setError(photo.message);
      setUploading(false);
      return;
    }

    setUploadProgress(30);

    const token = await getToken();
    const result = await uploadPhoto(photo, token);

    if (isPhotoUploadError(result)) {
      setError(result.message);
      setUploading(false);
      return;
    }

    setUploadProgress(100);
    append(result);
    setUploading(false);
    setUploadProgress(0);
  }, [append, getToken]);

  const canAddMore = fields.length < maxPhotos;

  return (
    <Controller
      name={name}
      control={control}
      render={({ fieldState }) => (
        <Stack gap="md">
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {label}
            </Text>
            {required && <Text c="red" size="sm">*</Text>}
            <Text size="xs" c="dimmed">
              ({fields.length}/{maxPhotos})
            </Text>
          </Group>

          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}

          {/* Photo Grid */}
          {fields.length > 0 && (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {fields.map((field, index) => {
                const photo = field as unknown as PhotoUploadResult;
                return (
                  <Paper key={field.id} p="xs" withBorder style={{ position: 'relative' }}>
                    <Image
                      src={photo.thumbnailUrl || photo.url}
                      alt={`Photo ${index + 1}`}
                      h={120}
                      fit="cover"
                      radius="sm"
                    />
                    {photo.gpsCoordinates && (
                      <Text size="xs" c="dimmed" ta="center" mt={4}>
                        GPS: {photo.gpsCoordinates.latitude.toFixed(4)}, {photo.gpsCoordinates.longitude.toFixed(4)}
                      </Text>
                    )}
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="sm"
                      style={{ position: 'absolute', top: 4, right: 4 }}
                      onClick={() => remove(index)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Paper>
                );
              })}
            </SimpleGrid>
          )}

          {/* Upload Progress */}
          {uploading && (
            <Paper p="sm" withBorder>
              <Stack gap="xs">
                <Group gap="xs">
                  <Text size="sm">Uploading photo...</Text>
                </Group>
                <Progress value={uploadProgress} animated />
              </Stack>
            </Paper>
          )}

          {/* Error Alert */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              title="Upload Error"
              withCloseButton
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
          {canAddMore && !uploading && (
            <Group gap="sm">
              <Button
                leftSection={<IconCamera size={16} />}
                onClick={handleCapture}
                variant="light"
              >
                Take Photo
              </Button>
              <Button
                leftSection={<IconPhoto size={16} />}
                onClick={handleSelect}
                variant="light"
              >
                Choose from Gallery
              </Button>
            </Group>
          )}

          {!canAddMore && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              Maximum photos reached ({maxPhotos})
            </Alert>
          )}

          {fieldState.error && (
            <Text size="xs" c="red">
              {fieldState.error.message}
            </Text>
          )}
        </Stack>
      )}
    />
  );
}
```

### Step 4: Update Form Renderer (30 min)

Update `apps/web/components/Forms/FormRenderer/FormRenderer.tsx`:

```typescript
// In the field type switch statement:
case 'photo':
case 'photos':
case 'image':
case 'images':
  return (
    <PhotoField
      key={field.id}
      name={field.name}
      label={field.label}
      required={field.required}
      description={field.description}
      maxPhotos={field.maxPhotos || 10}
    />
  );
```

### Step 5: Write Tests (60 min)

Create `apps/web/lib/__tests__/photo-upload.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPhotoUploadError } from '../photo-upload';

describe('photo-upload utilities', () => {
  describe('isPhotoUploadError', () => {
    it('returns true for error objects', () => {
      const error = {
        code: 'UPLOAD_FAILED' as const,
        message: 'Upload failed',
      };
      expect(isPhotoUploadError(error)).toBe(true);
    });

    it('returns false for success objects', () => {
      const success = {
        id: 'photo-123',
        url: 'https://example.com/photo.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        filename: 'photo.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
      };
      expect(isPhotoUploadError(success)).toBe(false);
    });
  });
});
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

```bash
cd apps/web
pnpm test photo-upload
```

**Screenshot:** Save to `evidence/ISSUE-167/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

```bash
pnpm test photo-upload
```

**Screenshot:** Save to `evidence/ISSUE-167/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/lib/photo-upload.ts
- apps/web/components/Forms/fields/PhotoField.tsx
- apps/web/lib/**tests**/photo-upload.test.ts
- apps/web/components/Forms/fields/**tests**/PhotoField.test.tsx

**Modify:**

- apps/web/components/Forms/FormRenderer/FormRenderer.tsx

## Backend Requirements

The backend must implement:

1. `uploadPhoto` mutation - Accepts base64, stores to S3/MinIO
2. EXIF extraction - Extract GPS from photo metadata
3. Thumbnail generation - Create 200px thumbnails
4. Progressive JPEG - Convert to progressive format for fast loading

## Verification Checklist

- [ ] Photo capture works (camera)
- [ ] Photo selection works (gallery)
- [ ] Photos upload to MinIO/S3
- [ ] Thumbnails generated
- [ ] GPS extracted from EXIF
- [ ] Progress indicator shows
- [ ] Error handling works
- [ ] Offline queue implemented
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-167/

**Required:**

- test-results/red-phase.png, green-phase.png, coverage-report.png
- screenshots/photo-capture.png, photo-uploaded.png, photo-grid.png

## Time Estimate

**8 hours total:**

- Review current implementation: 30 min
- Photo upload service: 90 min
- Photo field component: 90 min
- Form renderer update: 30 min
- Testing: 60 min
- Mobile testing: 60 min
- Integration testing: 60 min
- Documentation: 60 min

## Success Criteria

- [ ] Photos upload to real storage (not mock)
- [ ] GPS coordinates extracted and stored
- [ ] Thumbnails display in form
- [ ] Works offline (queued for upload)
- [ ] Maximum 10 photos per field enforced
- [ ] File size limit (10MB) enforced
- [ ] Performance: <15s per photo upload
