/**
 * Storage Utilities Unit Tests
 *
 * Tests for storage calculation, formatting, and cache management functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatBytes,
  isStorageAPIAvailable,
  isIndexedDBAvailable,
  calculatePercentage,
  getStorageColor,
  getLocalStorageSize,
  getAppInfo,
  estimateStorageBreakdown,
} from '../storage-utils';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('storage-utils', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // ============================================================================
  // formatBytes Tests
  // ============================================================================
  describe('formatBytes', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format negative numbers as 0 Bytes', () => {
      expect(formatBytes(-100)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500.00 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1048576)).toBe('1.00 MB');
      expect(formatBytes(2621440)).toBe('2.50 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1073741824)).toBe('1.00 GB');
    });

    it('should format terabytes correctly', () => {
      expect(formatBytes(1099511627776)).toBe('1.00 TB');
    });

    it('should handle very large numbers', () => {
      // 5 TB
      expect(formatBytes(5497558138880)).toBe('5.00 TB');
    });
  });

  // ============================================================================
  // calculatePercentage Tests
  // ============================================================================
  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
    });

    it('should return 0 when quota is 0', () => {
      expect(calculatePercentage(100, 0)).toBe(0);
    });

    it('should return 0 when quota is negative', () => {
      expect(calculatePercentage(100, -50)).toBe(0);
    });

    it('should cap at 100% when usage exceeds quota', () => {
      expect(calculatePercentage(150, 100)).toBe(100);
    });

    it('should handle decimal values', () => {
      expect(calculatePercentage(33, 100)).toBe(33);
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1);
    });
  });

  // ============================================================================
  // getStorageColor Tests
  // ============================================================================
  describe('getStorageColor', () => {
    it('should return green for low usage (< 50%)', () => {
      expect(getStorageColor(0)).toBe('green');
      expect(getStorageColor(25)).toBe('green');
      expect(getStorageColor(49)).toBe('green');
    });

    it('should return yellow for moderate usage (50-74%)', () => {
      expect(getStorageColor(50)).toBe('yellow');
      expect(getStorageColor(60)).toBe('yellow');
      expect(getStorageColor(74)).toBe('yellow');
    });

    it('should return orange for high usage (75-89%)', () => {
      expect(getStorageColor(75)).toBe('orange');
      expect(getStorageColor(80)).toBe('orange');
      expect(getStorageColor(89)).toBe('orange');
    });

    it('should return red for critical usage (90%+)', () => {
      expect(getStorageColor(90)).toBe('red');
      expect(getStorageColor(95)).toBe('red');
      expect(getStorageColor(100)).toBe('red');
    });
  });

  // ============================================================================
  // getLocalStorageSize Tests
  // ============================================================================
  describe('getLocalStorageSize', () => {
    it('should return 0 for empty localStorage', () => {
      expect(getLocalStorageSize()).toBe(0);
    });

    it('should calculate size of stored items', () => {
      localStorageMock.setItem('test', 'value');
      // 'test' (4 chars) + 'value' (5 chars) = 9 chars * 2 bytes = 18 bytes
      expect(getLocalStorageSize()).toBe(18);
    });

    it('should calculate size of multiple items', () => {
      localStorageMock.setItem('a', '1');
      localStorageMock.setItem('b', '22');
      // 'a' + '1' = 2 chars * 2 = 4 bytes
      // 'b' + '22' = 3 chars * 2 = 6 bytes
      // Total = 10 bytes
      expect(getLocalStorageSize()).toBe(10);
    });
  });

  // ============================================================================
  // isStorageAPIAvailable Tests
  // ============================================================================
  describe('isStorageAPIAvailable', () => {
    it('should return true when Storage API is available', () => {
      // Mock navigator.storage.estimate
      Object.defineProperty(navigator, 'storage', {
        value: { estimate: vi.fn() },
        configurable: true,
      });
      expect(isStorageAPIAvailable()).toBe(true);
    });
  });

  // ============================================================================
  // isIndexedDBAvailable Tests
  // ============================================================================
  describe('isIndexedDBAvailable', () => {
    it('should return true when IndexedDB is available', () => {
      expect(isIndexedDBAvailable()).toBe(true);
    });
  });

  // ============================================================================
  // estimateStorageBreakdown Tests
  // ============================================================================
  describe('estimateStorageBreakdown', () => {
    it('should return breakdown with correct proportions', () => {
      const totalUsage = 1000000; // 1 MB
      const breakdown = estimateStorageBreakdown(totalUsage);

      expect(breakdown.photos).toBeGreaterThan(breakdown.forms);
      expect(breakdown.photos).toBeGreaterThan(breakdown.cache);
      expect(
        breakdown.forms + breakdown.photos + breakdown.cache + breakdown.other
      ).toBeLessThanOrEqual(totalUsage);
    });

    it('should handle 0 total usage', () => {
      const breakdown = estimateStorageBreakdown(0);
      expect(breakdown.forms).toBe(0);
      expect(breakdown.photos).toBe(0);
      expect(breakdown.cache).toBe(0);
      expect(breakdown.other).toBe(0);
    });

    it('should include settings size from localStorage', () => {
      localStorageMock.setItem('test-settings', JSON.stringify({ theme: 'dark' }));
      const breakdown = estimateStorageBreakdown(100000);
      expect(breakdown.settings).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // getAppInfo Tests
  // ============================================================================
  describe('getAppInfo', () => {
    it('should return version information', () => {
      const info = getAppInfo();
      expect(info.version).toBe('1.0.0');
      expect(info.build).toBe('2025.11.29');
    });

    it('should detect web platform when Capacitor not present', () => {
      const info = getAppInfo();
      expect(info.platform).toBe('web');
    });

    it('should detect development environment on localhost', () => {
      const info = getAppInfo();
      expect(info.environment).toBe('development');
    });

    it('should have valid platform type', () => {
      const info = getAppInfo();
      expect(['web', 'ios', 'android']).toContain(info.platform);
    });

    it('should have valid environment type', () => {
      const info = getAppInfo();
      expect(['development', 'staging', 'production']).toContain(info.environment);
    });
  });
});
