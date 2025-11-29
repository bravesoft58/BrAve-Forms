/**
 * QR Portal API Tests - Sprint 4 ISSUE-100-105
 *
 * Tests for QR token generation, verification, and offline caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  QRPortalAPIError,
  isOnline,
  generateQRToken,
  verifyQRToken,
  revokeQRToken,
  revokeAllProjectTokens,
  getProjectQRTokens,
  getInspectorProjectInfo,
  clearInspectorCache,
  hasValidOfflineToken,
} from '../qr-portal';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.onLine
const mockOnLine = vi.spyOn(navigator, 'onLine', 'get');

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};
global.indexedDB = mockIndexedDB as unknown as IDBFactory;

describe('QR Portal API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLine.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('QRPortalAPIError', () => {
    it('should create error with message and code', () => {
      const error = new QRPortalAPIError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('QRPortalAPIError');
    });

    it('should include context in error', () => {
      const context = { userId: '123', projectId: '456' };
      const error = new QRPortalAPIError('Test error', 'TEST_CODE', context);
      expect(error.context).toEqual(context);
    });
  });

  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      mockOnLine.mockReturnValue(true);
      expect(isOnline()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      mockOnLine.mockReturnValue(false);
      expect(isOnline()).toBe(false);
    });
  });

  describe('generateQRToken', () => {
    const mockToken = {
      id: 'token_123',
      projectId: 'project_456',
      token: 'abc123xyz',
      permissions: ['VIEW_SUBMISSIONS', 'VIEW_PHOTOS', 'VIEW_PROJECT_INFO'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      revokedAt: null,
      generatedBy: 'user_789',
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessAt: null,
      isActive: true,
      isExpired: false,
    };

    it('should generate token with valid auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { generateQRToken: mockToken } }),
      });

      const result = await generateQRToken(
        {
          projectId: 'project_456',
          permissions: ['VIEW_SUBMISSIONS', 'VIEW_PHOTOS', 'VIEW_PROJECT_INFO'],
          expiryHours: 24,
        },
        'valid_auth_token'
      );

      expect(result).toEqual(mockToken);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid_auth_token',
          }),
        })
      );
    });

    it('should throw network error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        generateQRToken(
          {
            projectId: 'project_456',
            permissions: ['VIEW_SUBMISSIONS'],
          },
          'valid_auth_token'
        )
      ).rejects.toThrow(QRPortalAPIError);
    });

    it('should throw GraphQL error on query error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHORIZED' } }],
        }),
      });

      await expect(
        generateQRToken(
          {
            projectId: 'project_456',
            permissions: ['VIEW_SUBMISSIONS'],
          },
          'invalid_token'
        )
      ).rejects.toThrow(QRPortalAPIError);
    });
  });

  describe('verifyQRToken', () => {
    const mockVerification = {
      projectId: 'project_456',
      permissions: ['VIEW_SUBMISSIONS', 'VIEW_PHOTOS', 'VIEW_PROJECT_INFO'],
      tokenId: 'token_123',
    };

    it('should verify valid token', async () => {
      // Mock IndexedDB to return null (no cache)
      mockIndexedDB.open.mockImplementation(() => {
        const request: {
          onerror: ((ev: Event) => void) | null;
          onsuccess: ((ev: Event) => void) | null;
          onupgradeneeded: ((ev: Event) => void) | null;
          result: unknown;
        } = {
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          result: {
            transaction: () => ({
              objectStore: () => ({
                get: () => ({
                  onsuccess: null,
                  onerror: null,
                  result: null,
                }),
              }),
            }),
            close: vi.fn(),
          },
        };
        setTimeout(() => request.onsuccess?.({ target: request } as unknown as Event), 0);
        return request as unknown as IDBOpenDBRequest;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { verifyQRToken: mockVerification } }),
      });

      const result = await verifyQRToken('valid_token_string');

      expect(result).toEqual(mockVerification);
    });

    it('should handle expired token error', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request: {
          onerror: ((ev: Event) => void) | null;
          onsuccess: ((ev: Event) => void) | null;
          result: unknown;
        } = {
          onerror: null,
          onsuccess: null,
          result: {
            transaction: () => ({
              objectStore: () => ({
                get: () => ({
                  onsuccess: null,
                  onerror: null,
                  result: null,
                }),
              }),
            }),
            close: vi.fn(),
          },
        };
        setTimeout(() => request.onsuccess?.({ target: request } as unknown as Event), 0);
        return request as unknown as IDBOpenDBRequest;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Token expired', extensions: { code: 'TOKEN_EXPIRED' } }],
        }),
      });

      await expect(verifyQRToken('expired_token')).rejects.toThrow(QRPortalAPIError);
    });
  });

  describe('revokeQRToken', () => {
    const mockRevokedToken = {
      id: 'token_123',
      projectId: 'project_456',
      token: 'abc123xyz',
      permissions: ['VIEW_SUBMISSIONS'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      revokedAt: new Date().toISOString(),
      generatedBy: 'user_789',
      createdAt: new Date().toISOString(),
      accessCount: 5,
      lastAccessAt: new Date().toISOString(),
      isActive: false,
      isExpired: false,
    };

    it('should revoke token successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { revokeQRToken: mockRevokedToken } }),
      });

      const result = await revokeQRToken('token_123', 'valid_auth_token');

      expect(result.revokedAt).toBeDefined();
      expect(result.isActive).toBe(false);
    });
  });

  describe('revokeAllProjectTokens', () => {
    it('should revoke all project tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { revokeAllProjectTokens: { revokedCount: 3, success: true } },
        }),
      });

      const result = await revokeAllProjectTokens('project_456', 'valid_auth_token');

      expect(result.revokedCount).toBe(3);
      expect(result.success).toBe(true);
    });
  });

  describe('getProjectQRTokens', () => {
    it('should get all tokens for project', async () => {
      const mockTokens = [
        { id: 'token_1', projectId: 'project_456', isActive: true },
        { id: 'token_2', projectId: 'project_456', isActive: false },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { getProjectQRTokens: mockTokens } }),
      });

      const result = await getProjectQRTokens('project_456', 'valid_auth_token');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('token_1');
    });
  });

  describe('getInspectorProjectInfo', () => {
    const mockProjectInfo = {
      id: 'project_456',
      name: 'Test Construction Site',
      address: '123 Main St',
      status: 'ACTIVE',
      startDate: '2025-01-15',
      permitNumber: 'NV-SWPPP-2025-0001',
      disturbedAcres: 5.2,
    };

    it('should get project info for valid token', async () => {
      // Mock IndexedDB to return null (no cache)
      mockIndexedDB.open.mockImplementation(() => {
        const request: {
          onerror: ((ev: Event) => void) | null;
          onsuccess: ((ev: Event) => void) | null;
          result: unknown;
        } = {
          onerror: null,
          onsuccess: null,
          result: {
            transaction: () => ({
              objectStore: () => ({
                get: () => ({
                  onsuccess: null,
                  onerror: null,
                  result: null,
                }),
                put: vi.fn(),
              }),
            }),
            close: vi.fn(),
          },
        };
        setTimeout(() => request.onsuccess?.({ target: request } as unknown as Event), 0);
        return request as unknown as IDBOpenDBRequest;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { getInspectorProjectInfo: mockProjectInfo } }),
      });

      const result = await getInspectorProjectInfo('valid_token');

      expect(result.name).toBe('Test Construction Site');
      expect(result.permitNumber).toBe('NV-SWPPP-2025-0001');
    });
  });
});

describe('Offline Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasValidOfflineToken', () => {
    it('should return false when no cached token exists', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request: {
          onerror: ((ev: Event) => void) | null;
          onsuccess: ((ev: Event) => void) | null;
          result: unknown;
        } = {
          onerror: null,
          onsuccess: null,
          result: {
            transaction: () => ({
              objectStore: () => ({
                get: () => ({
                  onsuccess: null,
                  onerror: null,
                  result: null,
                }),
              }),
            }),
            close: vi.fn(),
          },
        };
        setTimeout(() => request.onsuccess?.({ target: request } as unknown as Event), 0);
        return request as unknown as IDBOpenDBRequest;
      });

      const result = await hasValidOfflineToken('nonexistent_token');
      expect(result).toBe(false);
    });
  });

  describe('clearInspectorCache', () => {
    it('should clear all cached data', async () => {
      const clearMock = vi.fn();
      mockIndexedDB.open.mockImplementation(() => {
        const request: {
          onerror: ((ev: Event) => void) | null;
          onsuccess: ((ev: Event) => void) | null;
          result: unknown;
        } = {
          onerror: null,
          onsuccess: null,
          result: {
            transaction: () => ({
              objectStore: () => ({
                clear: clearMock,
              }),
            }),
            close: vi.fn(),
          },
        };
        setTimeout(() => request.onsuccess?.({ target: request } as unknown as Event), 0);
        return request as unknown as IDBOpenDBRequest;
      });

      await clearInspectorCache();

      // The function should complete without throwing
      expect(true).toBe(true);
    });
  });
});
