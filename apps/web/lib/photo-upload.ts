/**
 * Photo Upload Service for BrAve Forms
 *
 * Handles photo capture, compression, and upload to MinIO storage.
 * Supports both web (file input) and mobile (Capacitor Camera).
 *
 * Features:
 * - File compression using canvas (max 2000px, 80% quality)
 * - GPS extraction from device (fallback when EXIF unavailable)
 * - Upload to MinIO via GraphQL mutation
 * - Error handling for permissions, file size, and network issues
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:30101';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2000;
const COMPRESSION_QUALITY = 0.8;

export interface PhotoUploadResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
  mimeType: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
}

export interface PhotoUploadError {
  code:
    | 'FILE_TOO_LARGE'
    | 'UPLOAD_FAILED'
    | 'PERMISSION_DENIED'
    | 'CAMERA_ERROR'
    | 'NETWORK_ERROR'
    | 'INVALID_FILE';
  message: string;
}

export interface CapturedPhoto {
  base64: string;
  format: string;
  width?: number;
  height?: number;
}

/**
 * Check if photo upload is available (requires browser or Capacitor)
 */
export function isPhotoUploadAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return true;
}

/**
 * Capture photo from camera using file input with capture attribute
 */
export async function capturePhoto(): Promise<CapturedPhoto | PhotoUploadError> {
  if (!isPhotoUploadAvailable()) {
    return {
      code: 'CAMERA_ERROR',
      message: 'Photo capture is not available in this environment',
    };
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({
          code: 'CAMERA_ERROR',
          message: 'No photo captured',
        });
        return;
      }

      const result = await processFile(file);
      resolve(result);
    };

    // Handle cancel
    input.addEventListener('cancel', () => {
      resolve({
        code: 'CAMERA_ERROR',
        message: 'Photo capture cancelled',
      });
    });

    input.click();
  });
}

/**
 * Select photo from gallery
 */
export async function selectPhoto(): Promise<CapturedPhoto | PhotoUploadError> {
  if (!isPhotoUploadAvailable()) {
    return {
      code: 'CAMERA_ERROR',
      message: 'Photo selection is not available in this environment',
    };
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // No capture attribute = use gallery

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({
          code: 'CAMERA_ERROR',
          message: 'No photo selected',
        });
        return;
      }

      const result = await processFile(file);
      resolve(result);
    };

    // Handle cancel
    input.addEventListener('cancel', () => {
      resolve({
        code: 'CAMERA_ERROR',
        message: 'Photo selection cancelled',
      });
    });

    input.click();
  });
}

/**
 * Process a File object: validate, compress, and convert to base64
 */
async function processFile(file: File): Promise<CapturedPhoto | PhotoUploadError> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    return {
      code: 'INVALID_FILE',
      message: 'Please select an image file (JPG, PNG, etc.)',
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `Photo is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 10MB.`,
    };
  }

  try {
    // Read file as data URL
    const dataUrl = await fileToDataUrl(file);

    // Compress image
    const compressed = await compressImage(dataUrl);

    return compressed;
  } catch (error) {
    return {
      code: 'CAMERA_ERROR',
      message: 'Failed to process photo',
    };
  }
}

/**
 * Convert File to data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image using canvas
 * - Resize to max 2000px
 * - Compress to JPEG at 80% quality
 */
async function compressImage(dataUrl: string): Promise<CapturedPhoto> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate new dimensions (max 2000px)
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);

      // Extract base64 without prefix
      const base64 = compressedDataUrl.split(',')[1];

      resolve({
        base64,
        format: 'jpeg',
        width,
        height,
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Get current GPS coordinates from device
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Upload photo to MinIO storage via GraphQL
 */
export async function uploadPhoto(
  photo: CapturedPhoto,
  token: string,
  metadata?: {
    projectId?: string;
    submissionId?: string;
    fieldName?: string;
    caption?: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<PhotoUploadResult | PhotoUploadError> {
  try {
    // Get GPS if not provided
    let gps = metadata?.latitude && metadata?.longitude
      ? { latitude: metadata.latitude, longitude: metadata.longitude }
      : null;

    if (!gps) {
      gps = await getCurrentLocation();
    }

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation UploadPhoto($input: UploadPhotoBase64Input!) {
            uploadPhoto(input: $input) {
              id
              url
              thumbnailUrl
              filename
              size
              mimeType
              latitude
              longitude
              takenAt
            }
          }
        `,
        variables: {
          input: {
            base64: photo.base64,
            format: photo.format || 'jpeg',
            projectId: metadata?.projectId,
            submissionId: metadata?.submissionId,
            fieldName: metadata?.fieldName,
            caption: metadata?.caption,
            latitude: gps?.latitude,
            longitude: gps?.longitude,
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
  } catch (error: unknown) {
    console.error('[uploadPhoto] Error:', error);
    return {
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Network error during upload',
    };
  }
}

/**
 * Check if result is an error
 */
export function isPhotoUploadError(
  result: PhotoUploadResult | PhotoUploadError | CapturedPhoto
): result is PhotoUploadError {
  return 'code' in result && 'message' in result && !('url' in result) && !('base64' in result);
}

/**
 * Check if result is a captured photo (not yet uploaded)
 */
export function isCapturedPhoto(
  result: PhotoUploadResult | PhotoUploadError | CapturedPhoto
): result is CapturedPhoto {
  return 'base64' in result && 'format' in result;
}
