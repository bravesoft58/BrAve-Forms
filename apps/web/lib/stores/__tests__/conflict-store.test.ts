import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  conflictStore,
  loadConflicts,
  addConflict,
  resolveConflict,
  deleteConflict,
  clearResolvedConflicts,
  getPendingConflicts,
  getResolvedConflicts,
  getConflictById,
  getConflictStats,
  getResolvedData,
  resetConflictStore,
  flattenObject,
  deepEqual,
  detectDifferences,
  type ConflictVersion,
} from '../conflict-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Conflict Store', () => {
  const testOrgId = 'org_test123';

  beforeEach(() => {
    resetConflictStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('flattenObject', () => {
    it('should flatten a simple object', () => {
      const obj = { a: 1, b: 'test' };
      const result = flattenObject(obj);
      expect(result).toEqual({ a: 1, b: 'test' });
    });

    it('should flatten nested objects', () => {
      const obj = { a: { b: { c: 1 } }, d: 2 };
      const result = flattenObject(obj);
      expect(result).toEqual({ 'a.b.c': 1, d: 2 });
    });

    it('should handle arrays as values', () => {
      const obj = { a: [1, 2, 3] };
      const result = flattenObject(obj);
      expect(result).toEqual({ a: [1, 2, 3] });
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = flattenObject(obj);
      expect(result).toEqual({});
    });
  });

  describe('deepEqual', () => {
    it('should return true for equal primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('test', 'test')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
    });

    it('should return false for unequal primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('test', 'other')).toBe(false);
    });

    it('should compare arrays correctly', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
    });

    it('should compare objects correctly', () => {
      expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('should handle null values', () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(null, 1)).toBe(false);
    });
  });

  describe('detectDifferences', () => {
    it('should detect modified fields', () => {
      const local = { name: 'John', age: 30 };
      const server = { name: 'Jane', age: 30 };

      const diffs = detectDifferences(local, server);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        fieldId: 'name',
        fieldLabel: 'name',
        localValue: 'John',
        serverValue: 'Jane',
        type: 'modified',
      });
    });

    it('should detect added fields', () => {
      const local = { name: 'John', email: 'john@test.com' };
      const server = { name: 'John' };

      const diffs = detectDifferences(local, server);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].type).toBe('added');
      expect(diffs[0].fieldId).toBe('email');
    });

    it('should detect removed fields', () => {
      const local = { name: 'John' };
      const server = { name: 'John', email: 'john@test.com' };

      const diffs = detectDifferences(local, server);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].type).toBe('removed');
      expect(diffs[0].fieldId).toBe('email');
    });

    it('should use custom field labels', () => {
      const local = { name: 'John' };
      const server = { name: 'Jane' };
      const labels = { name: 'Full Name' };

      const diffs = detectDifferences(local, server, labels);

      expect(diffs[0].fieldLabel).toBe('Full Name');
    });

    it('should return empty array when no differences', () => {
      const local = { name: 'John', age: 30 };
      const server = { name: 'John', age: 30 };

      const diffs = detectDifferences(local, server);

      expect(diffs).toHaveLength(0);
    });
  });

  describe('addConflict', () => {
    it('should add a new conflict to the store', () => {
      const localVersion: ConflictVersion = {
        data: { name: 'Local Name' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const serverVersion: ConflictVersion = {
        data: { name: 'Server Name' },
        modifiedAt: '2025-11-28T11:00:00Z',
        modifiedBy: 'user2',
        version: 2,
      };

      const conflict = addConflict(
        'resource_123',
        'form_submission',
        localVersion,
        serverVersion,
        testOrgId
      );

      expect(conflict.id).toBeDefined();
      expect(conflict.resourceId).toBe('resource_123');
      expect(conflict.resourceType).toBe('form_submission');
      expect(conflict.status).toBe('pending');
      expect(conflict.orgId).toBe(testOrgId);
      expect(conflict.differences).toHaveLength(1);
      expect(conflictStore.conflicts).toHaveLength(1);
    });

    it('should calculate differences automatically', () => {
      const localVersion: ConflictVersion = {
        data: { name: 'John', age: 30, email: 'john@test.com' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const serverVersion: ConflictVersion = {
        data: { name: 'Jane', age: 30 },
        modifiedAt: '2025-11-28T11:00:00Z',
        modifiedBy: 'user2',
        version: 2,
      };

      const conflict = addConflict(
        'resource_123',
        'form_submission',
        localVersion,
        serverVersion,
        testOrgId
      );

      // name modified, email added (in local but not server)
      expect(conflict.differences.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with keep_local strategy', () => {
      const localVersion: ConflictVersion = {
        data: { name: 'Local' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const serverVersion: ConflictVersion = {
        data: { name: 'Server' },
        modifiedAt: '2025-11-28T11:00:00Z',
        modifiedBy: 'user2',
        version: 2,
      };

      const conflict = addConflict(
        'resource_123',
        'form_submission',
        localVersion,
        serverVersion,
        testOrgId
      );

      const resolved = resolveConflict(conflict.id, 'keep_local', 'resolver_user');

      expect(resolved).not.toBeNull();
      expect(resolved?.status).toBe('resolved');
      expect(resolved?.resolution?.strategy).toBe('keep_local');
      expect(resolved?.resolution?.resolvedBy).toBe('resolver_user');
    });

    it('should resolve conflict with keep_server strategy', () => {
      const localVersion: ConflictVersion = {
        data: { name: 'Local' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const serverVersion: ConflictVersion = {
        data: { name: 'Server' },
        modifiedAt: '2025-11-28T11:00:00Z',
        modifiedBy: 'user2',
        version: 2,
      };

      const conflict = addConflict(
        'resource_123',
        'form_submission',
        localVersion,
        serverVersion,
        testOrgId
      );

      const resolved = resolveConflict(conflict.id, 'keep_server', 'resolver_user');

      expect(resolved?.resolution?.strategy).toBe('keep_server');
    });

    it('should resolve conflict with merge strategy', () => {
      const localVersion: ConflictVersion = {
        data: { name: 'Local' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const serverVersion: ConflictVersion = {
        data: { name: 'Server' },
        modifiedAt: '2025-11-28T11:00:00Z',
        modifiedBy: 'user2',
        version: 2,
      };

      const conflict = addConflict(
        'resource_123',
        'form_submission',
        localVersion,
        serverVersion,
        testOrgId
      );

      const mergedData = { name: 'Merged' };
      const resolved = resolveConflict(conflict.id, 'merge', 'resolver_user', mergedData);

      expect(resolved?.resolution?.strategy).toBe('merge');
      expect(resolved?.resolution?.mergedData).toEqual(mergedData);
    });

    it('should return null for non-existent conflict', () => {
      const resolved = resolveConflict('non_existent', 'keep_local', 'user');
      expect(resolved).toBeNull();
    });
  });

  describe('getResolvedData', () => {
    it('should return local data for keep_local resolution', () => {
      const localVersion: ConflictVersion = {
        data: { name: 'Local' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const serverVersion: ConflictVersion = {
        data: { name: 'Server' },
        modifiedAt: '2025-11-28T11:00:00Z',
        modifiedBy: 'user2',
        version: 2,
      };

      const conflict = addConflict(
        'resource_123',
        'form_submission',
        localVersion,
        serverVersion,
        testOrgId
      );

      resolveConflict(conflict.id, 'keep_local', 'user');
      const resolved = getConflictById(conflict.id);
      const data = getResolvedData(resolved!);

      expect(data).toEqual({ name: 'Local' });
    });

    it('should return server data for keep_server resolution', () => {
      const localVersion: ConflictVersion = {
        data: { name: 'Local' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const serverVersion: ConflictVersion = {
        data: { name: 'Server' },
        modifiedAt: '2025-11-28T11:00:00Z',
        modifiedBy: 'user2',
        version: 2,
      };

      const conflict = addConflict(
        'resource_123',
        'form_submission',
        localVersion,
        serverVersion,
        testOrgId
      );

      resolveConflict(conflict.id, 'keep_server', 'user');
      const resolved = getConflictById(conflict.id);
      const data = getResolvedData(resolved!);

      expect(data).toEqual({ name: 'Server' });
    });
  });

  describe('getPendingConflicts', () => {
    it('should return only pending conflicts for org', () => {
      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      // Add conflicts for different orgs
      addConflict('res1', 'form_submission', version, version, testOrgId);
      addConflict('res2', 'form_submission', version, version, testOrgId);
      addConflict('res3', 'form_submission', version, version, 'other_org');

      // Resolve one
      const conflicts = getPendingConflicts(testOrgId);
      resolveConflict(conflicts[0].id, 'keep_local', 'user');

      const pending = getPendingConflicts(testOrgId);
      expect(pending).toHaveLength(1);
    });
  });

  describe('getResolvedConflicts', () => {
    it('should return only resolved conflicts for org', () => {
      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const conflict1 = addConflict('res1', 'form_submission', version, version, testOrgId);
      addConflict('res2', 'form_submission', version, version, testOrgId);

      resolveConflict(conflict1.id, 'keep_local', 'user');

      const resolved = getResolvedConflicts(testOrgId);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe(conflict1.id);
    });
  });

  describe('deleteConflict', () => {
    it('should delete a conflict from the store', () => {
      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const conflict = addConflict('res1', 'form_submission', version, version, testOrgId);

      expect(conflictStore.conflicts).toHaveLength(1);

      const result = deleteConflict(conflict.id);

      expect(result).toBe(true);
      expect(conflictStore.conflicts).toHaveLength(0);
    });

    it('should return false for non-existent conflict', () => {
      const result = deleteConflict('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('clearResolvedConflicts', () => {
    it('should clear all resolved conflicts for org', () => {
      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const conflict1 = addConflict('res1', 'form_submission', version, version, testOrgId);
      addConflict('res2', 'form_submission', version, version, testOrgId);

      resolveConflict(conflict1.id, 'keep_local', 'user');

      const cleared = clearResolvedConflicts(testOrgId);

      expect(cleared).toBe(1);
      expect(conflictStore.conflicts).toHaveLength(1);
    });
  });

  describe('getConflictStats', () => {
    it('should return correct statistics', () => {
      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      const conflict1 = addConflict('res1', 'form_submission', version, version, testOrgId);
      addConflict('res2', 'form_submission', version, version, testOrgId);
      addConflict('res3', 'form_submission', version, version, testOrgId);

      resolveConflict(conflict1.id, 'keep_local', 'user');

      const stats = getConflictStats(testOrgId);

      expect(stats.pending).toBe(2);
      expect(stats.resolved).toBe(1);
      expect(stats.total).toBe(3);
    });
  });

  describe('loadConflicts', () => {
    it('should load conflicts from localStorage', async () => {
      const storedData = {
        conflicts: [
          {
            id: 'conflict_1',
            resourceId: 'res_1',
            resourceType: 'form_submission',
            localVersion: { data: {}, modifiedAt: '', modifiedBy: '', version: 1 },
            serverVersion: { data: {}, modifiedAt: '', modifiedBy: '', version: 2 },
            differences: [],
            detectedAt: '2025-11-28T10:00:00Z',
            status: 'pending',
            orgId: testOrgId,
          },
        ],
        savedAt: '2025-11-28T10:00:00Z',
      };

      localStorageMock.setItem('braveforms_conflicts', JSON.stringify(storedData));

      await loadConflicts();

      expect(conflictStore.conflicts).toHaveLength(1);
      expect(conflictStore.conflicts[0].id).toBe('conflict_1');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    const org1 = 'org_company_a';
    const org2 = 'org_company_b';

    const createTestVersion = (): ConflictVersion => ({
      data: { name: 'Test Data' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    });

    it('should prevent org1 from seeing org2 conflicts via getPendingConflicts', () => {
      const version = createTestVersion();

      // Add conflicts for both orgs
      addConflict('res1', 'form_submission', version, version, org1);
      addConflict('res2', 'form_submission', version, version, org2);
      addConflict('res3', 'form_submission', version, version, org1);

      // org1 should only see their own conflicts
      const org1Conflicts = getPendingConflicts(org1);
      expect(org1Conflicts).toHaveLength(2);
      org1Conflicts.forEach((conflict) => {
        expect(conflict.orgId).toBe(org1);
      });

      // org2 should only see their own conflicts
      const org2Conflicts = getPendingConflicts(org2);
      expect(org2Conflicts).toHaveLength(1);
      expect(org2Conflicts[0].orgId).toBe(org2);
    });

    it('should prevent org1 from seeing org2 conflicts via getResolvedConflicts', () => {
      const version = createTestVersion();

      // Add and resolve conflicts for both orgs
      const conflict1 = addConflict('res1', 'form_submission', version, version, org1);
      const conflict2 = addConflict('res2', 'form_submission', version, version, org2);

      resolveConflict(conflict1.id, 'keep_local', 'user1');
      resolveConflict(conflict2.id, 'keep_server', 'user2');

      // org1 should only see their resolved conflicts
      const org1Resolved = getResolvedConflicts(org1);
      expect(org1Resolved).toHaveLength(1);
      expect(org1Resolved[0].orgId).toBe(org1);

      // org2 should only see their resolved conflicts
      const org2Resolved = getResolvedConflicts(org2);
      expect(org2Resolved).toHaveLength(1);
      expect(org2Resolved[0].orgId).toBe(org2);
    });

    it('should return correct stats per organization via getConflictStats', () => {
      const version = createTestVersion();

      // Add multiple conflicts for each org
      const conflict1 = addConflict('res1', 'form_submission', version, version, org1);
      addConflict('res2', 'form_submission', version, version, org1);
      addConflict('res3', 'form_submission', version, version, org2);
      addConflict('res4', 'form_submission', version, version, org2);
      addConflict('res5', 'form_submission', version, version, org2);

      // Resolve one from each org
      resolveConflict(conflict1.id, 'keep_local', 'user1');
      const org2Pending = getPendingConflicts(org2);
      resolveConflict(org2Pending[0].id, 'keep_server', 'user2');

      // Check org1 stats
      const org1Stats = getConflictStats(org1);
      expect(org1Stats.pending).toBe(1);
      expect(org1Stats.resolved).toBe(1);
      expect(org1Stats.total).toBe(2);

      // Check org2 stats
      const org2Stats = getConflictStats(org2);
      expect(org2Stats.pending).toBe(2);
      expect(org2Stats.resolved).toBe(1);
      expect(org2Stats.total).toBe(3);
    });

    it('should only clear resolved conflicts for specified org via clearResolvedConflicts', () => {
      const version = createTestVersion();

      // Add and resolve conflicts for both orgs
      const conflict1 = addConflict('res1', 'form_submission', version, version, org1);
      const conflict2 = addConflict('res2', 'form_submission', version, version, org2);

      resolveConflict(conflict1.id, 'keep_local', 'user1');
      resolveConflict(conflict2.id, 'keep_server', 'user2');

      // Clear only org1's resolved conflicts
      const cleared = clearResolvedConflicts(org1);
      expect(cleared).toBe(1);

      // org1 should have no resolved conflicts
      expect(getResolvedConflicts(org1)).toHaveLength(0);

      // org2 should still have their resolved conflict
      expect(getResolvedConflicts(org2)).toHaveLength(1);
    });
  });

  describe('Validation Error Handling', () => {
    const createTestVersion = (): ConflictVersion => ({
      data: { name: 'Test Data' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    });

    describe('orgId validation', () => {
      it('should throw error when getPendingConflicts called with empty orgId', () => {
        expect(() => getPendingConflicts('')).toThrow(
          'orgId is required for multi-tenant isolation'
        );
      });

      it('should throw error when getPendingConflicts called with whitespace orgId', () => {
        expect(() => getPendingConflicts('   ')).toThrow(
          'orgId is required for multi-tenant isolation'
        );
      });

      it('should throw error when getResolvedConflicts called with empty orgId', () => {
        expect(() => getResolvedConflicts('')).toThrow(
          'orgId is required for multi-tenant isolation'
        );
      });

      it('should throw error when clearResolvedConflicts called with empty orgId', () => {
        expect(() => clearResolvedConflicts('')).toThrow(
          'orgId is required for multi-tenant isolation'
        );
      });

      it('should throw error when getConflictStats called with empty orgId', () => {
        expect(() => getConflictStats('')).toThrow('orgId is required for multi-tenant isolation');
      });
    });

    describe('addConflict validation', () => {
      it('should throw error when addConflict called with empty orgId', () => {
        const version = createTestVersion();
        expect(() => addConflict('res1', 'form_submission', version, version, '')).toThrow(
          'orgId is required for multi-tenant isolation'
        );
      });

      it('should throw error when addConflict called with empty resourceId', () => {
        const version = createTestVersion();
        expect(() => addConflict('', 'form_submission', version, version, 'org_test')).toThrow(
          'resourceId is required'
        );
      });

      it('should throw error when addConflict called with whitespace resourceId', () => {
        const version = createTestVersion();
        expect(() => addConflict('   ', 'form_submission', version, version, 'org_test')).toThrow(
          'resourceId is required'
        );
      });
    });

    describe('resolveConflict validation', () => {
      it('should throw error when resolveConflict called with empty conflictId', () => {
        expect(() => resolveConflict('', 'keep_local', 'user1')).toThrow('conflictId is required');
      });

      it('should throw error when resolveConflict called with empty resolvedBy', () => {
        const version = createTestVersion();
        const conflict = addConflict('res1', 'form_submission', version, version, testOrgId);

        expect(() => resolveConflict(conflict.id, 'keep_local', '')).toThrow(
          'resolvedBy is required for audit trail'
        );
      });

      it('should throw error when resolveConflict called with merge strategy but no mergedData', () => {
        const version = createTestVersion();
        const conflict = addConflict('res1', 'form_submission', version, version, testOrgId);

        expect(() => resolveConflict(conflict.id, 'merge', 'user1')).toThrow(
          'mergedData is required when using merge strategy'
        );
      });

      it('should succeed when resolveConflict called with merge strategy and mergedData', () => {
        const version = createTestVersion();
        const conflict = addConflict('res1', 'form_submission', version, version, testOrgId);

        const resolved = resolveConflict(conflict.id, 'merge', 'user1', { name: 'Merged' });
        expect(resolved).not.toBeNull();
        expect(resolved?.resolution?.strategy).toBe('merge');
        expect(resolved?.resolution?.mergedData).toEqual({ name: 'Merged' });
      });
    });
  });

  describe('localStorage Error Handling', () => {
    it('should set store error when localStorage.setItem fails', () => {
      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      // Mock localStorage to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Adding a conflict should trigger saveConflicts which should fail
      addConflict('res1', 'form_submission', version, version, testOrgId);

      // Store error should be set
      expect(conflictStore.error).toContain('Failed to save conflicts');
      expect(conflictStore.error).toContain('QuotaExceededError');

      // Restore original mock behavior
      localStorageMock.setItem.mockRestore();
      localStorageMock.setItem = originalSetItem;
    });

    it('should clear storage error on successful save', () => {
      // Set an existing storage-related error (includes 'storage' keyword)
      conflictStore.error = 'Failed to save: storage quota exceeded';

      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      // This should succeed and clear the storage error
      addConflict('res1', 'form_submission', version, version, testOrgId);

      // Storage-related error should be cleared on successful save
      expect(conflictStore.error).toBeNull();
    });

    it('should preserve non-storage errors on successful save', () => {
      // Set a non-storage error (doesn't include 'storage' keyword)
      conflictStore.error = 'Network connection failed';

      const version: ConflictVersion = {
        data: { name: 'Test' },
        modifiedAt: '2025-11-28T10:00:00Z',
        modifiedBy: 'user1',
        version: 1,
      };

      // This should succeed but NOT clear the non-storage error
      addConflict('res1', 'form_submission', version, version, testOrgId);

      // Non-storage error should remain
      expect(conflictStore.error).toBe('Network connection failed');
    });
  });
});
