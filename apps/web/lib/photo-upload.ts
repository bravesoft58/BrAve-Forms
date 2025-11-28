/**
 * Photo Upload Service for BrAve Forms
 *
 * Handles photo capture, compression, and upload to MinIO storage.
 * Supports both web (file input) and mobile (Capacitor Camera).
 *
 * Features:
 * - File compression using canvas (max 2000px, 90% quality for construction detail)
 * - GPS extraction from device (fallback when EXIF unavailable)
 * - Upload to MinIO via GraphQL mutation
 * - Error handling for permissions, file size, and network issues
 * - Offline queue for 30-day offline capability
 */

// Use same env var as rest of codebase for GraphQL endpoint
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2000;
// 90% quality for construction photos - preserves detail for compliance
const COMPRESSION_QUALITY = 0.9;

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
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
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
    let gps =
      metadata?.latitude && metadata?.longitude
        ? { latitude: metadata.latitude, longitude: metadata.longitude }
        : null;

    if (!gps) {
      gps = await getCurrentLocation();
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
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

// ============================================================================
// OFFLINE QUEUE IMPLEMENTATION
// Supports 30-day offline capability per CLAUDE.md requirements
// ============================================================================

const OFFLINE_QUEUE_DB_NAME = 'braveforms-photo-queue';
const OFFLINE_QUEUE_STORE_NAME = 'photos';
const OFFLINE_QUEUE_VERSION = 1;

export interface QueuedPhoto {
  id: string;
  photo: CapturedPhoto;
  metadata?: {
    projectId?: string;
    submissionId?: string;
    fieldName?: string;
    caption?: string;
    latitude?: number;
    longitude?: number;
  };
  queuedAt: string;
  retryCount: number;
  lastError?: string;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true; // Assume online for SSR
  }
  return navigator.onLine;
}

/**
 * Open the offline queue database
 */
async function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(OFFLINE_QUEUE_DB_NAME, OFFLINE_QUEUE_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE_NAME)) {
        const store = db.createObjectStore(OFFLINE_QUEUE_STORE_NAME, { keyPath: 'id' });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
      }
    };
  });
}

/**
 * Add a photo to the offline queue
 */
export async function queuePhotoForUpload(
  photo: CapturedPhoto,
  metadata?: QueuedPhoto['metadata']
): Promise<string> {
  const db = await openQueueDB();
  const id = `queued_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const queuedPhoto: QueuedPhoto = {
    id,
    photo,
    metadata,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OFFLINE_QUEUE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE_NAME);
    const request = store.add(queuedPhoto);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db.close();
      resolve(id);
    };
  });
}

/**
 * Get all queued photos
 */
export async function getQueuedPhotos(): Promise<QueuedPhoto[]> {
  const db = await openQueueDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OFFLINE_QUEUE_STORE_NAME], 'readonly');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
  });
}

/**
 * Remove a photo from the queue after successful upload
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openQueueDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OFFLINE_QUEUE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
  });
}

/**
 * Update retry count and last error for a queued photo
 */
export async function updateQueuedPhotoError(id: string, error: string): Promise<void> {
  const db = await openQueueDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OFFLINE_QUEUE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const photo = getRequest.result as QueuedPhoto;
      if (photo) {
        photo.retryCount += 1;
        photo.lastError = error;
        const putRequest = store.put(photo);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          db.close();
          resolve();
        };
      } else {
        db.close();
        resolve();
      }
    };
  });
}

/**
 * Get count of queued photos
 */
export async function getQueuedPhotoCount(): Promise<number> {
  const db = await openQueueDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OFFLINE_QUEUE_STORE_NAME], 'readonly');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE_NAME);
    const request = store.count();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
  });
}

/**
 * Sync all queued photos to server
 * Call this when device comes back online
 *
 * @param token - Auth token for uploads
 * @param onProgress - Callback for progress updates
 * @returns Summary of sync results
 */
export async function syncQueuedPhotos(
  token: string,
  onProgress?: (uploaded: number, total: number, current?: QueuedPhoto) => void
): Promise<{
  uploaded: number;
  failed: number;
  remaining: number;
}> {
  if (!isOnline()) {
    return { uploaded: 0, failed: 0, remaining: await getQueuedPhotoCount() };
  }

  const queued = await getQueuedPhotos();
  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < queued.length; i++) {
    const item = queued[i];
    onProgress?.(uploaded, queued.length, item);

    // Skip items that have failed too many times
    if (item.retryCount >= 5) {
      failed++;
      continue;
    }

    const result = await uploadPhoto(item.photo, token, item.metadata);

    if (isPhotoUploadError(result)) {
      await updateQueuedPhotoError(item.id, result.message);
      failed++;
    } else {
      await removeFromQueue(item.id);
      uploaded++;
    }
  }

  const remaining = await getQueuedPhotoCount();
  onProgress?.(uploaded, queued.length);

  return { uploaded, failed, remaining };
}

/**
 * Upload photo with automatic offline queue fallback
 * Use this instead of uploadPhoto for offline-first behavior
 */
export async function uploadPhotoWithOfflineSupport(
  photo: CapturedPhoto,
  token: string,
  metadata?: QueuedPhoto['metadata']
): Promise<PhotoUploadResult | PhotoUploadError | { queued: true; queueId: string }> {
  // If offline, queue the photo
  if (!isOnline()) {
    try {
      const queueId = await queuePhotoForUpload(photo, metadata);
      return { queued: true, queueId };
    } catch (error) {
      return {
        code: 'UPLOAD_FAILED',
        message: 'Failed to queue photo for offline upload',
      };
    }
  }

  // Try to upload directly
  const result = await uploadPhoto(photo, token, metadata);

  // If network error, queue for later
  if (isPhotoUploadError(result) && result.code === 'NETWORK_ERROR') {
    try {
      const queueId = await queuePhotoForUpload(photo, metadata);
      return { queued: true, queueId };
    } catch {
      return result;
    }
  }

  return result;
}

/**
 * Check if result is a queued response
 */
export function isQueuedResult(
  result: PhotoUploadResult | PhotoUploadError | { queued: true; queueId: string }
): result is { queued: true; queueId: string } {
  return 'queued' in result && result.queued === true;
}
