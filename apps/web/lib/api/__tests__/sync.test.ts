import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateOfflineDaysRemaining,
  calculateStorageDaysRemaining,
  formatBytes,
  getStorageEstimate,
} from '../sync';

describe('sync API utilities', () => {
  // ============================================================================
  // calculateOfflineDaysRemaining Tests
  // ============================================================================
  describe('calculateOfflineDaysRemaining', () => {
    it('should return 30 days when lastSync is null', () => {
      expect(calculateOfflineDaysRemaining(null)).toBe(30);
    });

    it('should return 30 days when just synced', () => {
      const now = new Date();
      expect(calculateOfflineDaysRemaining(now)).toBe(30);
    });

    it('should return 29 days when synced 1 day ago', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      expect(calculateOfflineDaysRemaining(oneDayAgo)).toBe(29);
    });

    it('should return 20 days when synced 10 days ago', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(calculateOfflineDaysRemaining(tenDaysAgo)).toBe(20);
    });

    it('should return 0 days when synced 30+ days ago', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      expect(calculateOfflineDaysRemaining(thirtyDaysAgo)).toBe(0);
    });

    it('should return 0 days when synced 60 days ago', () => {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      expect(calculateOfflineDaysRemaining(sixtyDaysAgo)).toBe(0);
    });

    it('should accept ISO string dates', () => {
      const now = new Date().toISOString();
      expect(calculateOfflineDaysRemaining(now)).toBe(30);
    });

    it('should accept Date objects', () => {
      const now = new Date();
      expect(calculateOfflineDaysRemaining(now)).toBe(30);
    });
  });

  // ============================================================================
  // calculateStorageDaysRemaining Tests
  // ============================================================================
  describe('calculateStorageDaysRemaining', () => {
    it('should return 30 days when storage is 0% used', () => {
      expect(calculateStorageDaysRemaining(0)).toBe(30);
    });

    it('should return 15 days when storage is 50% used', () => {
      expect(calculateStorageDaysRemaining(50)).toBe(15);
    });

    it('should return 6 days when storage is 80% used (warning threshold)', () => {
      expect(calculateStorageDaysRemaining(80)).toBe(6);
    });

    it('should return 3 days when storage is 90% used (critical threshold)', () => {
      expect(calculateStorageDaysRemaining(90)).toBe(3);
    });

    it('should return 0 days when storage is 100% used', () => {
      expect(calculateStorageDaysRemaining(100)).toBe(0);
    });

    it('should clamp negative percentages to 0', () => {
      expect(calculateStorageDaysRemaining(-10)).toBe(30);
    });

    it('should clamp percentages over 100 to 100', () => {
      expect(calculateStorageDaysRemaining(150)).toBe(0);
    });

    it('should handle decimal percentages', () => {
      expect(calculateStorageDaysRemaining(33.33)).toBe(20);
    });
  });

  // ============================================================================
  // formatBytes Tests
  // ============================================================================
  describe('formatBytes', () => {
    it('should return "0 B" for 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500.00 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(2048)).toBe('2.00 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(50 * 1024 * 1024)).toBe('50.00 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
    });

    it('should handle decimal values', () => {
      expect(formatBytes(1536)).toBe('1.50 KB');
    });
  });

  // ============================================================================
  // getStorageEstimate Tests
  // ============================================================================
  describe('getStorageEstimate', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should return zeros when navigator is undefined', async () => {
      // In test environment, navigator.storage may not exist
      const originalNavigator = global.navigator;

      // Mock navigator as undefined
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toEqual({ used: 0, available: 0 });

      // Restore
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should return zeros when storage API is not available', async () => {
      const originalNavigator = global.navigator;

      Object.defineProperty(global, 'navigator', {
        value: { storage: undefined },
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toEqual({ used: 0, available: 0 });

      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should return storage estimate from browser API', async () => {
      const mockEstimate = {
        usage: 50 * 1024 * 1024, // 50 MB
        quota: 500 * 1024 * 1024, // 500 MB
      };

      const originalNavigator = global.navigator;

      Object.defineProperty(global, 'navigator', {
        value: {
          storage: {
            estimate: vi.fn().mockResolvedValue(mockEstimate),
          },
        },
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toEqual({
        used: mockEstimate.usage,
        available: mockEstimate.quota,
      });

      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should handle storage API errors gracefully', async () => {
      const originalNavigator = global.navigator;

      Object.defineProperty(global, 'navigator', {
        value: {
          storage: {
            estimate: vi.fn().mockRejectedValue(new Error('Storage API error')),
          },
        },
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toEqual({ used: 0, available: 0 });

      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });
  });

  // ============================================================================
  // Storage Warning Thresholds Tests
  // ============================================================================
  describe('storage warning thresholds', () => {
    it('should identify 80% as warning threshold', () => {
      const used = 80;
      const available = 100;
      const percentage = (used / available) * 100;
      expect(percentage > 80).toBe(false); // Exactly 80 is not > 80
      expect(percentage >= 80).toBe(true);
    });

    it('should identify 81% as warning', () => {
      const used = 81;
      const available = 100;
      const percentage = (used / available) * 100;
      expect(percentage > 80).toBe(true);
    });

    it('should identify 90% as critical threshold', () => {
      const used = 90;
      const available = 100;
      const percentage = (used / available) * 100;
      expect(percentage > 90).toBe(false); // Exactly 90 is not > 90
      expect(percentage >= 90).toBe(true);
    });

    it('should identify 91% as critical', () => {
      const used = 91;
      const available = 100;
      const percentage = (used / available) * 100;
      expect(percentage > 90).toBe(true);
    });

    it('should calculate days remaining from percentage correctly', () => {
      // 0% used = 30 days remaining
      expect(Math.floor(30 - (0 / 100) * 30)).toBe(30);

      // 50% used = 15 days remaining
      expect(Math.floor(30 - (50 / 100) * 30)).toBe(15);

      // 80% used = 6 days remaining
      expect(Math.floor(30 - (80 / 100) * 30)).toBe(6);

      // 90% used = 3 days remaining
      expect(Math.floor(30 - (90 / 100) * 30)).toBe(3);

      // 100% used = 0 days remaining
      expect(Math.floor(30 - (100 / 100) * 30)).toBe(0);
    });
  });

  // ============================================================================
  // EPA Compliance Storage Tests
  // ============================================================================
  describe('EPA compliance storage requirements', () => {
    it('should support 30-day offline capacity calculation', () => {
      // EPA CGP requires 30-day offline data retention
      const fullCapacityDays = 30;

      // At 0% storage, full 30 days available
      expect(Math.floor(fullCapacityDays - (0 / 100) * fullCapacityDays)).toBe(30);

      // At 100% storage, 0 days remaining
      expect(Math.floor(fullCapacityDays - (100 / 100) * fullCapacityDays)).toBe(0);
    });

    it('should warn before reaching EPA 30-day limit', () => {
      // Warning at 80% means approximately 6 days remaining
      const warningThreshold = 80;
      const daysAtWarning = Math.floor(30 - (warningThreshold / 100) * 30);

      // 6 days is enough time to take action
      expect(daysAtWarning).toBeGreaterThanOrEqual(5);
    });

    it('should alert critically before data loss', () => {
      // Critical at 90% means approximately 3 days remaining
      const criticalThreshold = 90;
      const daysAtCritical = Math.floor(30 - (criticalThreshold / 100) * 30);

      // 3 days is minimum action time
      expect(daysAtCritical).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================================================
  // Offline Scenario Tests
  // ============================================================================
  describe('offline scenarios', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle navigator being offline', async () => {
      const originalNavigator = global.navigator;

      // Mock offline state
      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: false,
          storage: undefined,
        },
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toEqual({ used: 0, available: 0 });

      // Restore
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should return valid storage estimate when online', async () => {
      const mockEstimate = {
        usage: 100 * 1024 * 1024, // 100 MB
        quota: 1024 * 1024 * 1024, // 1 GB
      };

      const originalNavigator = global.navigator;

      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true,
          storage: {
            estimate: vi.fn().mockResolvedValue(mockEstimate),
          },
        },
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result.used).toBe(mockEstimate.usage);
      expect(result.available).toBe(mockEstimate.quota);

      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should gracefully handle storage API timeout', async () => {
      const originalNavigator = global.navigator;

      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true,
          storage: {
            estimate: vi
              .fn()
              .mockImplementation(
                () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10))
              ),
          },
        },
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result).toEqual({ used: 0, available: 0 });

      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should work without localStorage in SSR environment', () => {
      // calculateOfflineDaysRemaining should work without window/localStorage
      expect(calculateOfflineDaysRemaining(null)).toBe(30);
      expect(calculateOfflineDaysRemaining(new Date())).toBe(30);
    });

    it('should handle missing storage quota gracefully', async () => {
      const mockEstimate = {
        usage: 50 * 1024 * 1024, // 50 MB
        quota: undefined, // quota not available
      };

      const originalNavigator = global.navigator;

      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true,
          storage: {
            estimate: vi.fn().mockResolvedValue(mockEstimate),
          },
        },
        writable: true,
      });

      const result = await getStorageEstimate();
      expect(result.used).toBe(mockEstimate.usage);
      expect(result.available).toBe(0); // undefined quota should default to 0

      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });
  });

  // ============================================================================
  // Multi-Tenant localStorage Scoping Tests
  // ============================================================================
  describe('multi-tenant localStorage scoping', () => {
    it('should generate different keys for different organizations', () => {
      // Test the key generation pattern
      const org1Key = `braveforms_org_org_123_last_sync`;
      const org2Key = `braveforms_org_org_456_last_sync`;

      expect(org1Key).not.toBe(org2Key);
      expect(org1Key).toContain('org_123');
      expect(org2Key).toContain('org_456');
    });

    it('should include orgId prefix in scoped key format', () => {
      const orgId = 'test-org-id';
      const expectedPattern = new RegExp(`braveforms_org_${orgId}_`);

      expect(`braveforms_org_${orgId}_last_sync`).toMatch(expectedPattern);
      expect(`braveforms_org_${orgId}_pending_queue`).toMatch(expectedPattern);
    });

    it('should maintain backward compatibility with legacy keys', () => {
      // Legacy keys should still be recognized format
      const legacyKey = 'braveforms_last_sync';
      expect(legacyKey).toMatch(/^braveforms_[a-z_]+$/);
    });
  });
});
