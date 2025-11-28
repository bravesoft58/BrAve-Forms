import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isGeolocationAvailable,
  getCurrentPosition,
  isGeolocationError,
  formatCoordinates,
  formatAccuracy,
  getAccuracyColor,
  requestGeolocationPermission,
  GPSCoordinates,
  GeolocationError,
} from '../geolocation';

// Mock navigator.geolocation
const mockGetCurrentPosition = vi.fn();
const mockGeolocation = {
  getCurrentPosition: mockGetCurrentPosition,
};

// Mock navigator.permissions
const mockPermissionsQuery = vi.fn();

describe('geolocation utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset navigator mocks
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(global.navigator, 'permissions', {
      value: { query: mockPermissionsQuery },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isGeolocationAvailable', () => {
    it('returns true when geolocation exists', () => {
      expect(isGeolocationAvailable()).toBe(true);
    });

    it('returns false when window is undefined (SSR)', () => {
      // In SSR, window is undefined so geolocation is not available
      // This is tested by the function's SSR check
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR environment
      delete global.window;
      expect(isGeolocationAvailable()).toBe(false);
      global.window = originalWindow;
    });
  });

  describe('requestGeolocationPermission', () => {
    it('returns true when permission is granted', async () => {
      mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
      const result = await requestGeolocationPermission();
      expect(result).toBe(true);
    });

    it('returns true when permission is prompt (not yet asked)', async () => {
      mockPermissionsQuery.mockResolvedValue({ state: 'prompt' });
      const result = await requestGeolocationPermission();
      expect(result).toBe(true);
    });

    it('returns false when permission is denied', async () => {
      mockPermissionsQuery.mockResolvedValue({ state: 'denied' });
      const result = await requestGeolocationPermission();
      expect(result).toBe(false);
    });

    it('returns true when Permissions API is not available', async () => {
      mockPermissionsQuery.mockRejectedValue(new Error('Not supported'));
      const result = await requestGeolocationPermission();
      expect(result).toBe(true);
    });
  });

  describe('getCurrentPosition', () => {
    it('returns coordinates on success', async () => {
      const mockCoords = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: 50,
        altitudeAccuracy: 5,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      };
      const mockPosition = {
        coords: mockCoords,
        timestamp: Date.now(),
        toJSON: () => ({}),
      } as GeolocationPosition;

      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(false);
      if (!isGeolocationError(result)) {
        expect(result.latitude).toBe(37.7749);
        expect(result.longitude).toBe(-122.4194);
        expect(result.accuracy).toBe(10);
        expect(result.altitude).toBe(50);
        expect(result.timestamp).toBeDefined();
      }
    });

    it('returns coordinates without altitude when not available', async () => {
      const mockCoords = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 15,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      };
      const mockPosition = {
        coords: mockCoords,
        timestamp: Date.now(),
        toJSON: () => ({}),
      } as GeolocationPosition;

      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(false);
      if (!isGeolocationError(result)) {
        expect(result.latitude).toBe(37.7749);
        expect(result.altitude).toBeUndefined();
      }
    });

    it('returns PERMISSION_DENIED error on permission denied', async () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({ code: 1, message: 'User denied Geolocation' });
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(true);
      if (isGeolocationError(result)) {
        expect(result.code).toBe('PERMISSION_DENIED');
        expect(result.message).toContain('permission denied');
      }
    });

    it('returns POSITION_UNAVAILABLE error when position unavailable', async () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({ code: 2, message: 'Position unavailable' });
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(true);
      if (isGeolocationError(result)) {
        expect(result.code).toBe('POSITION_UNAVAILABLE');
      }
    });

    it('returns TIMEOUT error on timeout', async () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({ code: 3, message: 'Timeout' });
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(true);
      if (isGeolocationError(result)) {
        expect(result.code).toBe('TIMEOUT');
      }
    });

    it('returns UNKNOWN error for unexpected errors', async () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error({ code: 999, message: 'Unknown error' });
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(true);
      if (isGeolocationError(result)) {
        expect(result.code).toBe('UNKNOWN');
      }
    });

    it('returns POSITION_UNAVAILABLE when geolocation not available (SSR)', async () => {
      // Simulate SSR environment where window is undefined
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR environment
      delete global.window;

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(true);
      if (isGeolocationError(result)) {
        expect(result.code).toBe('POSITION_UNAVAILABLE');
      }

      global.window = originalWindow;
    });
  });

  describe('isGeolocationError', () => {
    it('returns true for error objects', () => {
      const error: GeolocationError = {
        code: 'PERMISSION_DENIED',
        message: 'Permission denied',
      };
      expect(isGeolocationError(error)).toBe(true);
    });

    it('returns false for coordinate objects', () => {
      const coords: GPSCoordinates = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        timestamp: '2025-11-27T10:00:00Z',
      };
      expect(isGeolocationError(coords)).toBe(false);
    });
  });

  describe('formatCoordinates', () => {
    it('formats coordinates with 6 decimal places', () => {
      const coords: GPSCoordinates = {
        latitude: 37.77492912,
        longitude: -122.41941698,
        accuracy: 10,
        timestamp: '2025-11-27T10:00:00Z',
      };

      expect(formatCoordinates(coords)).toBe('37.774929, -122.419417');
    });

    it('handles negative coordinates', () => {
      const coords: GPSCoordinates = {
        latitude: -33.8688,
        longitude: 151.2093,
        accuracy: 10,
        timestamp: '2025-11-27T10:00:00Z',
      };

      expect(formatCoordinates(coords)).toBe('-33.868800, 151.209300');
    });

    it('handles zero coordinates', () => {
      const coords: GPSCoordinates = {
        latitude: 0,
        longitude: 0,
        accuracy: 10,
        timestamp: '2025-11-27T10:00:00Z',
      };

      expect(formatCoordinates(coords)).toBe('0.000000, 0.000000');
    });
  });

  describe('formatAccuracy', () => {
    it('returns Excellent for accuracy < 10m', () => {
      expect(formatAccuracy(5)).toBe('Excellent');
      expect(formatAccuracy(9.9)).toBe('Excellent');
    });

    it('returns Good for accuracy 10-29m', () => {
      expect(formatAccuracy(10)).toBe('Good');
      expect(formatAccuracy(20)).toBe('Good');
      expect(formatAccuracy(29.9)).toBe('Good');
    });

    it('returns Fair for accuracy 30-99m', () => {
      expect(formatAccuracy(30)).toBe('Fair');
      expect(formatAccuracy(50)).toBe('Fair');
      expect(formatAccuracy(99.9)).toBe('Fair');
    });

    it('returns Poor for accuracy >= 100m', () => {
      expect(formatAccuracy(100)).toBe('Poor');
      expect(formatAccuracy(150)).toBe('Poor');
      expect(formatAccuracy(500)).toBe('Poor');
    });
  });

  describe('getAccuracyColor', () => {
    it('returns green for excellent accuracy', () => {
      expect(getAccuracyColor(5)).toBe('green');
    });

    it('returns blue for good accuracy', () => {
      expect(getAccuracyColor(20)).toBe('blue');
    });

    it('returns yellow for fair accuracy', () => {
      expect(getAccuracyColor(50)).toBe('yellow');
    });

    it('returns red for poor accuracy', () => {
      expect(getAccuracyColor(150)).toBe('red');
    });
  });
});
