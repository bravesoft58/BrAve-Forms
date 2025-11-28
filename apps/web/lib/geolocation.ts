/**
 * Geolocation utilities for GPS field functionality
 * Sprint 5 ISSUE-166
 *
 * Uses Web Geolocation API on web browsers.
 * Types are compatible with Capacitor Geolocation for mobile integration.
 * Falls back gracefully when GPS unavailable.
 */

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude?: number;
  timestamp: string;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

/**
 * Check if geolocation is available
 */
export function isGeolocationAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering
  }
  return 'geolocation' in navigator;
}

/**
 * Request geolocation permission
 * Note: On web, permission is requested on first getCurrentPosition call
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  if (!isGeolocationAvailable()) {
    return false;
  }

  // Check if Permissions API is available (not all browsers support it)
  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      // If already granted or prompt, we can proceed
      return result.state !== 'denied';
    } catch {
      // Permissions API not fully supported, proceed anyway
      return true;
    }
  }

  // Web: Permission will be requested on first getCurrentPosition call
  return true;
}

/**
 * Get current GPS coordinates
 *
 * @param highAccuracy - Use high accuracy mode (slower, more battery)
 * @param timeout - Maximum time to wait for position (ms), default 60s for construction sites
 * @returns GPS coordinates or error
 */
export async function getCurrentPosition(
  highAccuracy: boolean = true,
  timeout: number = 60000
): Promise<GPSCoordinates | GeolocationError> {
  if (!isGeolocationAvailable()) {
    return {
      code: 'POSITION_UNAVAILABLE',
      message: 'Geolocation is not available on this device',
    };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 0, // Always get fresh position
      });
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      timestamp: new Date(position.timestamp).toISOString(),
    };
  } catch (error: unknown) {
    const geoError = error as GeolocationPositionError;

    // Map error codes to our error types
    if (geoError.code === 1) {
      return {
        code: 'PERMISSION_DENIED',
        message:
          'Location permission denied. Please enable location access in your browser settings.',
      };
    }
    if (geoError.code === 2) {
      return {
        code: 'POSITION_UNAVAILABLE',
        message: 'Unable to determine location. Please check if GPS/location services are enabled.',
      };
    }
    if (geoError.code === 3) {
      return {
        code: 'TIMEOUT',
        message: 'Location request timed out. Please try again.',
      };
    }

    return {
      code: 'UNKNOWN',
      message: geoError.message || 'An unknown error occurred while getting location',
    };
  }
}

/**
 * Check if result is an error
 */
export function isGeolocationError(
  result: GPSCoordinates | GeolocationError
): result is GeolocationError {
  return 'code' in result && 'message' in result && !('latitude' in result);
}

/**
 * Format coordinates for display (6 decimal places = ~10cm precision)
 */
export function formatCoordinates(coords: GPSCoordinates): string {
  const lat = coords.latitude.toFixed(6);
  const lng = coords.longitude.toFixed(6);
  return `${lat}, ${lng}`;
}

/**
 * Format accuracy for human-readable display
 */
export function formatAccuracy(meters: number): string {
  if (meters < 10) return 'Excellent';
  if (meters < 30) return 'Good';
  if (meters < 100) return 'Fair';
  return 'Poor';
}

/**
 * Get accuracy color for UI display
 */
export function getAccuracyColor(meters: number): 'green' | 'blue' | 'yellow' | 'red' {
  if (meters < 10) return 'green';
  if (meters < 30) return 'blue';
  if (meters < 100) return 'yellow';
  return 'red';
}

/**
 * Validate GPS coordinates
 * Checks for valid ranges and null island detection
 *
 * @param latitude - Latitude in degrees (-90 to 90)
 * @param longitude - Longitude in degrees (-180 to 180)
 * @returns Validation result with error message if invalid
 */
export function validateCoordinates(
  latitude: number,
  longitude: number
): { valid: boolean; error?: string } {
  // Check for null/undefined
  if (latitude === null || latitude === undefined) {
    return { valid: false, error: 'Latitude is required' };
  }
  if (longitude === null || longitude === undefined) {
    return { valid: false, error: 'Longitude is required' };
  }

  // Check for NaN
  if (isNaN(latitude) || isNaN(longitude)) {
    return { valid: false, error: 'Coordinates must be valid numbers' };
  }

  // Check latitude range (-90 to 90)
  if (latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: `Latitude ${latitude} is out of range. Must be between -90 and 90.`,
    };
  }

  // Check longitude range (-180 to 180)
  if (longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: `Longitude ${longitude} is out of range. Must be between -180 and 180.`,
    };
  }

  // Null Island detection (0,0 is often a GPS error/default)
  // Allow small tolerance for actual locations near 0,0 (unlikely for construction)
  if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) {
    return {
      valid: false,
      error: 'Coordinates appear to be at null island (0,0). This may indicate a GPS error.',
    };
  }

  return { valid: true };
}

/**
 * Check if coordinates are valid (simple boolean check)
 */
export function areCoordinatesValid(latitude: number, longitude: number): boolean {
  return validateCoordinates(latitude, longitude).valid;
}
