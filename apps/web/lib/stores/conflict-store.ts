import { proxy } from 'valtio';

/**
 * Conflict Resolution Store
 *
 * Manages sync conflicts between local offline changes and server data.
 * Critical for construction field workers who may edit forms offline
 * while others edit the same data online.
 *
 * @security Multi-tenant isolation via orgId on all conflicts
 * @offline Conflicts persist to localStorage for resolution after reconnect
 */

/**
 * Types of resources that can have conflicts
 */
export type ConflictResourceType = 'form_submission' | 'photo' | 'annotation' | 'form_update';

/**
 * Conflict resolution strategies
 */
export type ResolutionStrategy = 'keep_local' | 'keep_server' | 'merge';

/**
 * Conflict status
 */
export type ConflictStatus = 'pending' | 'resolved';

/**
 * Field difference type
 */
export type DifferenceType = 'added' | 'removed' | 'modified';

/**
 * Version data for conflict comparison
 */
export interface ConflictVersion {
  /** The actual data */
  data: Record<string, unknown>;
  /** ISO timestamp of modification */
  modifiedAt: string;
  /** User who made the modification */
  modifiedBy: string;
  /** Version number for optimistic locking */
  version: number;
}

/**
 * Field-level difference between versions
 */
export interface FieldDifference {
  /** Field identifier */
  fieldId: string;
  /** Human-readable field label */
  fieldLabel: string;
  /** Value in local version */
  localValue: unknown;
  /** Value in server version */
  serverValue: unknown;
  /** Type of difference */
  type: DifferenceType;
}

/**
 * Conflict resolution record
 */
export interface ConflictResolution {
  /** Resolution strategy used */
  strategy: ResolutionStrategy;
  /** ISO timestamp when resolved */
  resolvedAt: string;
  /** User who resolved the conflict */
  resolvedBy: string;
  /** Merged data if strategy was 'merge' */
  mergedData?: Record<string, unknown>;
}

/**
 * Sync conflict between local and server versions
 */
export interface SyncConflict {
  /** Unique conflict identifier */
  id: string;
  /** ID of the conflicting resource */
  resourceId: string;
  /** Type of resource */
  resourceType: ConflictResourceType;
  /** Local version data */
  localVersion: ConflictVersion;
  /** Server version data */
  serverVersion: ConflictVersion;
  /** Field-level differences */
  differences: FieldDifference[];
  /** ISO timestamp when conflict was detected */
  detectedAt: string;
  /** Current conflict status */
  status: ConflictStatus;
  /** Resolution details (if resolved) */
  resolution?: ConflictResolution;
  /** Organization ID for multi-tenant isolation */
  orgId: string;
}

/**
 * Conflict store state
 */
interface ConflictStoreState {
  /** List of all conflicts */
  conflicts: SyncConflict[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Currently selected conflict for viewing */
  selectedConflictId: string | null;
}

/**
 * Initial store state
 */
const initialState: ConflictStoreState = {
  conflicts: [],
  isLoading: false,
  error: null,
  selectedConflictId: null,
};

/**
 * Conflict store (Valtio proxy)
 */
export const conflictStore = proxy<ConflictStoreState>({ ...initialState });

/**
 * Storage key for conflict persistence
 */
const STORAGE_KEY = 'braveforms_conflicts';

/**
 * Load conflicts from localStorage
 */
export async function loadConflicts(): Promise<void> {
  conflictStore.isLoading = true;
  conflictStore.error = null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      conflictStore.conflicts = data.conflicts || [];
    }
  } catch (error) {
    conflictStore.error = error instanceof Error ? error.message : 'Failed to load conflicts';
  } finally {
    conflictStore.isLoading = false;
  }
}

/**
 * Validate orgId for multi-tenant isolation
 * @throws Error if orgId is missing or empty
 */
function validateOrgId(orgId: string, context: string): void {
  if (!orgId || orgId.trim() === '') {
    throw new Error(`orgId is required for multi-tenant isolation (${context})`);
  }
}

/**
 * Save conflicts to localStorage
 * @security Updates store.error on failure to notify user
 */
function saveConflicts(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        conflicts: conflictStore.conflicts,
        savedAt: new Date().toISOString(),
      })
    );
    // Clear any previous storage error on success
    if (conflictStore.error?.includes('storage')) {
      conflictStore.error = null;
    }
  } catch (error) {
    // Update store error state for user notification (CRITICAL for offline scenarios)
    const errorMessage =
      error instanceof Error
        ? `Failed to save conflicts: ${error.message}. Check browser storage.`
        : 'Failed to save conflicts due to storage error';
    conflictStore.error = errorMessage;
    // eslint-disable-next-line no-console
    console.error('Failed to save conflicts:', error);
  }
}

/**
 * Generate unique conflict ID
 */
function generateConflictId(): string {
  return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Flatten nested object for comparison
 */
export function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Deep equality check for values
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Detect field-level differences between two versions
 */
export function detectDifferences(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  fieldLabels: Record<string, string> = {}
): FieldDifference[] {
  const localFields = flattenObject(localData);
  const serverFields = flattenObject(serverData);
  const differences: FieldDifference[] = [];

  // Check local fields
  for (const [fieldId, localValue] of Object.entries(localFields)) {
    const serverValue = serverFields[fieldId];

    if (serverValue === undefined) {
      differences.push({
        fieldId,
        fieldLabel: fieldLabels[fieldId] || fieldId,
        localValue,
        serverValue: null,
        type: 'added',
      });
    } else if (!deepEqual(localValue, serverValue)) {
      differences.push({
        fieldId,
        fieldLabel: fieldLabels[fieldId] || fieldId,
        localValue,
        serverValue,
        type: 'modified',
      });
    }
  }

  // Check for removed fields (in server but not in local)
  for (const [fieldId, serverValue] of Object.entries(serverFields)) {
    if (localFields[fieldId] === undefined) {
      differences.push({
        fieldId,
        fieldLabel: fieldLabels[fieldId] || fieldId,
        localValue: null,
        serverValue,
        type: 'removed',
      });
    }
  }

  return differences;
}

/**
 * Add a new conflict to the store
 * @throws Error if orgId or resourceId is missing
 * @security Validates orgId for multi-tenant isolation
 */
export function addConflict(
  resourceId: string,
  resourceType: ConflictResourceType,
  localVersion: ConflictVersion,
  serverVersion: ConflictVersion,
  orgId: string,
  fieldLabels: Record<string, string> = {}
): SyncConflict {
  // Validate required parameters for multi-tenant isolation
  validateOrgId(orgId, 'addConflict');
  if (!resourceId || resourceId.trim() === '') {
    throw new Error('resourceId is required');
  }

  const differences = detectDifferences(localVersion.data, serverVersion.data, fieldLabels);

  const conflict: SyncConflict = {
    id: generateConflictId(),
    resourceId,
    resourceType,
    localVersion,
    serverVersion,
    differences,
    detectedAt: new Date().toISOString(),
    status: 'pending',
    orgId,
  };

  conflictStore.conflicts.push(conflict);
  saveConflicts();

  return conflict;
}

/**
 * Resolve a conflict with the specified strategy
 * @throws Error if required parameters are missing
 * @security Validates resolvedBy for audit trail
 */
export function resolveConflict(
  conflictId: string,
  strategy: ResolutionStrategy,
  resolvedBy: string,
  mergedData?: Record<string, unknown>
): SyncConflict | null {
  // Validate required parameters
  if (!conflictId || conflictId.trim() === '') {
    throw new Error('conflictId is required');
  }
  if (!resolvedBy || resolvedBy.trim() === '') {
    throw new Error('resolvedBy is required for audit trail');
  }
  if (strategy === 'merge' && !mergedData) {
    throw new Error('mergedData is required when using merge strategy');
  }

  const conflictIndex = conflictStore.conflicts.findIndex((c) => c.id === conflictId);

  if (conflictIndex === -1) {
    return null;
  }

  const conflict = conflictStore.conflicts[conflictIndex];

  // Update conflict with resolution
  conflict.status = 'resolved';
  conflict.resolution = {
    strategy,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    mergedData: strategy === 'merge' ? mergedData : undefined,
  };

  saveConflicts();

  return conflict;
}

/**
 * Get the final data based on resolution strategy
 */
export function getResolvedData(conflict: SyncConflict): Record<string, unknown> | null {
  if (!conflict.resolution) {
    return null;
  }

  switch (conflict.resolution.strategy) {
    case 'keep_local':
      return conflict.localVersion.data;
    case 'keep_server':
      return conflict.serverVersion.data;
    case 'merge':
      return conflict.resolution.mergedData || {};
    default:
      return null;
  }
}

/**
 * Get all pending conflicts for an organization
 * @throws Error if orgId is missing
 * @security Validates orgId for multi-tenant isolation
 */
export function getPendingConflicts(orgId: string): SyncConflict[] {
  validateOrgId(orgId, 'getPendingConflicts');
  return conflictStore.conflicts.filter((c) => c.orgId === orgId && c.status === 'pending');
}

/**
 * Get all resolved conflicts for an organization
 * @throws Error if orgId is missing
 * @security Validates orgId for multi-tenant isolation
 */
export function getResolvedConflicts(orgId: string): SyncConflict[] {
  validateOrgId(orgId, 'getResolvedConflicts');
  return conflictStore.conflicts.filter((c) => c.orgId === orgId && c.status === 'resolved');
}

/**
 * Get conflict by ID
 */
export function getConflictById(conflictId: string): SyncConflict | undefined {
  return conflictStore.conflicts.find((c) => c.id === conflictId);
}

/**
 * Delete a resolved conflict from history
 */
export function deleteConflict(conflictId: string): boolean {
  const index = conflictStore.conflicts.findIndex((c) => c.id === conflictId);

  if (index === -1) {
    return false;
  }

  conflictStore.conflicts.splice(index, 1);
  saveConflicts();

  return true;
}

/**
 * Clear all resolved conflicts for an organization
 * @throws Error if orgId is missing
 * @security Validates orgId for multi-tenant isolation
 */
export function clearResolvedConflicts(orgId: string): number {
  validateOrgId(orgId, 'clearResolvedConflicts');

  const initialLength = conflictStore.conflicts.length;

  conflictStore.conflicts = conflictStore.conflicts.filter(
    (c) => !(c.orgId === orgId && c.status === 'resolved')
  );

  saveConflicts();

  return initialLength - conflictStore.conflicts.length;
}

/**
 * Select a conflict for viewing
 */
export function selectConflict(conflictId: string | null): void {
  conflictStore.selectedConflictId = conflictId;
}

/**
 * Get conflict statistics for an organization
 * @throws Error if orgId is missing
 * @security Validates orgId for multi-tenant isolation
 */
export function getConflictStats(orgId: string): {
  pending: number;
  resolved: number;
  total: number;
  resolvedToday: number;
} {
  validateOrgId(orgId, 'getConflictStats');

  const orgConflicts = conflictStore.conflicts.filter((c) => c.orgId === orgId);
  const today = new Date().toISOString().split('T')[0];

  return {
    pending: orgConflicts.filter((c) => c.status === 'pending').length,
    resolved: orgConflicts.filter((c) => c.status === 'resolved').length,
    total: orgConflicts.length,
    resolvedToday: orgConflicts.filter(
      (c) => c.status === 'resolved' && c.resolution?.resolvedAt.startsWith(today)
    ).length,
  };
}

/**
 * Reset store to initial state (for testing)
 */
export function resetConflictStore(): void {
  conflictStore.conflicts = [];
  conflictStore.isLoading = false;
  conflictStore.error = null;
  conflictStore.selectedConflictId = null;
  localStorage.removeItem(STORAGE_KEY);
}
