/**
 * QR Portal API - Sprint 4 ISSUE-100-105
 *
 * GraphQL API integration for QR token management and inspector portal.
 * Includes offline caching via IndexedDB for verified tokens.
 *
 * Features:
 * - Generate QR tokens (authenticated)
 * - Verify QR tokens (public - for inspector portal)
 * - Revoke tokens (authenticated)
 * - Offline token caching for inspector portal
 */

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql';

// IndexedDB database name for offline caching
const OFFLINE_DB_NAME = 'braveforms-inspector-cache';
const OFFLINE_DB_VERSION = 1;
const TOKEN_STORE_NAME = 'verified-tokens';
const PROJECT_STORE_NAME = 'project-info';

// Types
export type TokenPermission = 'VIEW_SUBMISSIONS' | 'VIEW_PHOTOS' | 'VIEW_PROJECT_INFO';

export interface QRToken {
  id: string;
  projectId: string;
  token: string;
  permissions: TokenPermission[];
  expiresAt: string;
  revokedAt?: string;
  generatedBy: string;
  createdAt: string;
  accessCount: number;
  lastAccessAt?: string;
  isActive: boolean;
  isExpired: boolean;
}

export interface VerifiedTokenPayload {
  projectId: string;
  permissions: TokenPermission[];
  tokenId: string;
}

export interface InspectorProjectInfo {
  id: string;
  name: string;
  address: string;
  status: string;
  startDate: string;
  permitNumber?: string;
  disturbedAcres: number;
}

export interface GenerateQRTokenInput {
  projectId: string;
  permissions: TokenPermission[];
  expiryHours?: number;
}

export interface RevokeAllResult {
  revokedCount: number;
  success: boolean;
}

// API Error type with context
export class QRPortalAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'QRPortalAPIError';
  }
}

/**
 * Execute a GraphQL query/mutation
 */
async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  authToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new QRPortalAPIError(
      `Network error: ${response.status} ${response.statusText}`,
      'NETWORK_ERROR',
      { status: response.status },
    );
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    const error = json.errors[0];
    throw new QRPortalAPIError(
      error.message || 'GraphQL error',
      error.extensions?.code || 'GRAPHQL_ERROR',
      { errors: json.errors },
    );
  }

  return json.data;
}

// ============================================================================
// AUTHENTICATED APIs (for project managers)
// ============================================================================

/**
 * Generate a new QR token for inspector portal access
 * Requires authentication
 */
export async function generateQRToken(
  input: GenerateQRTokenInput,
  authToken: string,
): Promise<QRToken> {
  const query = `
    mutation GenerateQRToken($input: GenerateQRTokenInput!) {
      generateQRToken(input: $input) {
        id
        projectId
        token
        permissions
        expiresAt
        revokedAt
        generatedBy
        createdAt
        accessCount
        lastAccessAt
        isActive
        isExpired
      }
    }
  `;

  const data = await executeGraphQL<{ generateQRToken: QRToken }>(
    query,
    { input },
    authToken,
  );

  return data.generateQRToken;
}

/**
 * Revoke a specific QR token
 * Requires authentication
 */
export async function revokeQRToken(
  tokenId: string,
  authToken: string,
): Promise<QRToken> {
  const query = `
    mutation RevokeQRToken($tokenId: String!) {
      revokeQRToken(tokenId: $tokenId) {
        id
        projectId
        token
        permissions
        expiresAt
        revokedAt
        generatedBy
        createdAt
        accessCount
        lastAccessAt
        isActive
        isExpired
      }
    }
  `;

  const data = await executeGraphQL<{ revokeQRToken: QRToken }>(
    query,
    { tokenId },
    authToken,
  );

  return data.revokeQRToken;
}

/**
 * Revoke all active tokens for a project
 * Requires authentication
 */
export async function revokeAllProjectTokens(
  projectId: string,
  authToken: string,
): Promise<RevokeAllResult> {
  const query = `
    mutation RevokeAllProjectTokens($projectId: String!) {
      revokeAllProjectTokens(projectId: $projectId) {
        revokedCount
        success
      }
    }
  `;

  const data = await executeGraphQL<{ revokeAllProjectTokens: RevokeAllResult }>(
    query,
    { projectId },
    authToken,
  );

  return data.revokeAllProjectTokens;
}

/**
 * Get all QR tokens for a project
 * Requires authentication
 */
export async function getProjectQRTokens(
  projectId: string,
  authToken: string,
): Promise<QRToken[]> {
  const query = `
    query GetProjectQRTokens($projectId: String!) {
      getProjectQRTokens(projectId: $projectId) {
        id
        projectId
        token
        permissions
        expiresAt
        revokedAt
        generatedBy
        createdAt
        accessCount
        lastAccessAt
        isActive
        isExpired
      }
    }
  `;

  const data = await executeGraphQL<{ getProjectQRTokens: QRToken[] }>(
    query,
    { projectId },
    authToken,
  );

  return data.getProjectQRTokens;
}

// ============================================================================
// PUBLIC APIs (for inspector portal - no auth required)
// ============================================================================

/**
 * Verify a QR token and return its payload
 * PUBLIC - no authentication required
 * Includes offline caching
 */
export async function verifyQRToken(token: string): Promise<VerifiedTokenPayload> {
  // Try to get cached token first (for offline support)
  const cached = await getCachedVerifiedToken(token);
  if (cached) {
    // Check if cached token is still valid (not expired)
    const expiresAt = new Date(cached.expiresAt);
    if (expiresAt > new Date()) {
      // Using cached token (debug logging disabled in production)
      return cached.payload;
    } else {
      // Remove expired token from cache
      await removeCachedToken(token);
    }
  }

  // Call API to verify token
  const query = `
    query VerifyQRToken($token: String!) {
      verifyQRToken(token: $token) {
        projectId
        permissions
        tokenId
      }
    }
  `;

  const data = await executeGraphQL<{ verifyQRToken: VerifiedTokenPayload }>(
    query,
    { token },
  );

  // Cache the verified token for offline use (cache for 24 hours from now)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await cacheVerifiedToken(token, data.verifyQRToken, expiresAt);

  return data.verifyQRToken;
}

/**
 * Get project info for inspector portal
 * PUBLIC - requires valid token
 * Includes offline caching
 */
export async function getInspectorProjectInfo(
  token: string,
): Promise<InspectorProjectInfo> {
  // Try to get cached project info first
  const cached = await getCachedProjectInfo(token);
  if (cached) {
    // Using cached project info (debug logging disabled in production)
    return cached;
  }

  const query = `
    query GetInspectorProjectInfo($token: String!) {
      getInspectorProjectInfo(token: $token) {
        id
        name
        address
        status
        startDate
        permitNumber
        disturbedAcres
      }
    }
  `;

  const data = await executeGraphQL<{ getInspectorProjectInfo: InspectorProjectInfo }>(
    query,
    { token },
  );

  // Cache project info for offline use
  await cacheProjectInfo(token, data.getInspectorProjectInfo);

  return data.getInspectorProjectInfo;
}

// ============================================================================
// OFFLINE CACHING (IndexedDB)
// ============================================================================

interface CachedToken {
  token: string;
  payload: VerifiedTokenPayload;
  expiresAt: string;
  cachedAt: string;
}

/**
 * Open IndexedDB database for offline caching
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for verified tokens
      if (!db.objectStoreNames.contains(TOKEN_STORE_NAME)) {
        const tokenStore = db.createObjectStore(TOKEN_STORE_NAME, { keyPath: 'token' });
        tokenStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      // Store for project info
      if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        db.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'token' });
      }
    };
  });
}

/**
 * Cache a verified token for offline use
 */
async function cacheVerifiedToken(
  token: string,
  payload: VerifiedTokenPayload,
  expiresAt: string,
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(TOKEN_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TOKEN_STORE_NAME);

    const cachedToken: CachedToken = {
      token,
      payload,
      expiresAt,
      cachedAt: new Date().toISOString(),
    };

    store.put(cachedToken);
    db.close();
  } catch {
    // Silently fail - caching is best effort for offline support
  }
}

/**
 * Get cached verified token
 */
async function getCachedVerifiedToken(token: string): Promise<CachedToken | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(TOKEN_STORE_NAME, 'readonly');
    const store = transaction.objectStore(TOKEN_STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(token);
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Remove cached token
 */
async function removeCachedToken(token: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(TOKEN_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TOKEN_STORE_NAME);
    store.delete(token);
    db.close();
  } catch {
    // Silently fail - cache removal is best effort
  }
}

/**
 * Cache project info for offline use
 */
async function cacheProjectInfo(
  token: string,
  projectInfo: InspectorProjectInfo,
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PROJECT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PROJECT_STORE_NAME);

    store.put({ token, ...projectInfo, cachedAt: new Date().toISOString() });
    db.close();
  } catch {
    // Silently fail - caching is best effort for offline support
  }
}

/**
 * Get cached project info
 */
async function getCachedProjectInfo(token: string): Promise<InspectorProjectInfo | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PROJECT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PROJECT_STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(token);
      request.onsuccess = () => {
        db.close();
        if (request.result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { token: _, cachedAt: __, ...projectInfo } = request.result;
          resolve(projectInfo as InspectorProjectInfo);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Clear all cached data (useful for logout/testing)
 */
export async function clearInspectorCache(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([TOKEN_STORE_NAME, PROJECT_STORE_NAME], 'readwrite');
    transaction.objectStore(TOKEN_STORE_NAME).clear();
    transaction.objectStore(PROJECT_STORE_NAME).clear();
    db.close();
  } catch {
    // Silently fail - cache clear is best effort
  }
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Check if a token is cached and valid for offline use
 */
export async function hasValidOfflineToken(token: string): Promise<boolean> {
  const cached = await getCachedVerifiedToken(token);
  if (!cached) return false;

  const expiresAt = new Date(cached.expiresAt);
  return expiresAt > new Date();
}
