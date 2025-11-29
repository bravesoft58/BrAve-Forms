# ISSUE-136: Conflict Resolution UI (6h)

**Priority:** P0
**Phase:** Phase 2 - Offline Experience UI
**Estimated Hours:** 6
**Actual Hours:** 6
**Dependencies:** ISSUE-135, ISSUE-135.5
**Sprint:** Sprint 5
**Completed:** 2025-11-29
**Status:** COMPLETE

## Completion Summary

### Implementation Details

- Created comprehensive conflict-store with Valtio for conflict state management
- Implemented conflict detection with flattenObject and deepEqual utilities
- Created ConflictComparisonModal component with side-by-side diff view
- Created /sync/conflicts page with statistics and resolution history
- Implemented three resolution strategies: Keep Local, Keep Server, Merge
- Multi-tenant isolation via orgId filtering on all operations
- localStorage persistence for conflict data

### Files Created/Modified

- `apps/web/lib/stores/conflict-store.ts` (new - 508 lines)
- `apps/web/lib/stores/__tests__/conflict-store.test.ts` (new - 48 tests)
- `apps/web/components/Sync/ConflictComparisonModal.tsx` (new - 380 lines)
- `apps/web/components/Sync/__tests__/ConflictComparisonModal.test.tsx` (new - 10 tests)
- `apps/web/components/Sync/index.ts` (updated - added export)
- `apps/web/app/sync/conflicts/page.tsx` (new - 340 lines)
- `apps/web/app/sync/conflicts/__tests__/page.test.tsx` (new - 12 tests)

### Test Results

- 48 conflict-store tests covering all store operations
- 10 ConflictComparisonModal component tests
- 12 conflicts page tests
- Total: 70 tests covering conflict resolution functionality

### Key Features Implemented

- Conflict Statistics: Pending, resolved today, total resolved, all time
- Side-by-Side Diff: Local vs Server version comparison
- Field Highlighting: Added (green), Removed (red), Modified (yellow)
- Resolution Strategies: Keep Local, Keep Server, Merge
- Merge Mode: Field-by-field selection with visual indicators
- Resolution History: Who resolved, when, which strategy
- Empty State: "All data is synchronized" when no conflicts
- Loading/Error States: Proper async handling
- Resolution Legend: Clear explanation of strategies

### Code Review Fixes (2025-11-29)

After initial implementation, code review identified and fixed the following issues:

**CRITICAL Fixes (4):**

1. Added `validateOrgId()` helper function for multi-tenant isolation
2. Added orgId validation to all store functions (getPendingConflicts, getResolvedConflicts, clearResolvedConflicts, getConflictStats, addConflict)
3. Added fail-fast orgId validation in conflicts page component (returns error if missing)
4. Updated `saveConflicts()` to set `store.error` on localStorage failure (was silent)

**HIGH Priority Fixes (6):**

1. Added input validation to `resolveConflict()` (conflictId, resolvedBy, mergedData)
2. Added resourceId validation to `addConflict()`
3. Increased ActionIcon touch targets from `sm` to `lg` for construction gloves (48px)
4. Added try-catch error handling to all modal handlers (handleKeepLocal, handleKeepServer, handleMerge)
5. Added try-catch error handling to all page handlers (handleViewConflict, handleResolveConflict, handleDeleteConflict, handleClearResolved)
6. Added userId validation before resolving conflicts (required for audit trail)

**MEDIUM Priority Fixes (2):**

1. Added aria-label attributes for accessibility on field selection buttons
2. Added XSS security comment to `formatValue()` function

**Tests Added for Fixes (16):**

- Multi-tenant isolation tests (4): Cross-org access prevention via getPendingConflicts, getResolvedConflicts, getConflictStats, clearResolvedConflicts
- Validation error tests (10): Empty orgId, whitespace orgId, empty resourceId, empty conflictId, empty resolvedBy, merge without mergedData
- localStorage error handling tests (2): Error notification on failure, storage error clearing on success

---

## Objective

Create a conflict resolution interface that detects when local and server versions of data differ and provides users with options to resolve conflicts. This is critical for construction field workers who may edit the same form offline and online.

## Tasks

- [x] Create /sync/conflicts route in Next.js App Router
- [x] Implement conflict detection logic (compare timestamps, hashes)
- [x] Design side-by-side comparison modal with Mantine
- [x] Highlight field-level differences
- [x] Implement resolution options (Keep Local, Keep Server, Merge, Cancel)
- [x] Create merge editor for manual field-by-field resolution
- [x] Store conflict resolution history (who, when, how)
- [x] Add unit tests for conflict detection algorithm
- [x] Test with real offline/online conflict scenarios

## Technical Details

**Libraries/Dependencies:**

- Mantine Modal (conflict comparison)
- diff library (field-level comparison)
- TanStack Query v5 (conflict state)
- IndexedDB (conflict storage)

**Implementation Notes:**

**Conflict Detection:**

```typescript
interface Conflict {
  id: string;
  resourceType: 'form' | 'photo' | 'project';
  resourceId: string;
  localVersion: {
    data: unknown;
    timestamp: Date;
    hash: string;
  };
  serverVersion: {
    data: unknown;
    timestamp: Date;
    hash: string;
  };
  differences: FieldDifference[];
  status: 'pending' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: 'local' | 'server' | 'merge';
}

interface FieldDifference {
  field: string;
  localValue: unknown;
  serverValue: unknown;
  type: 'added' | 'removed' | 'modified';
}
```

**Conflict Detection Algorithm:**

```typescript
const detectConflicts = (localData: unknown, serverData: unknown): FieldDifference[] => {
  const localFields = flattenObject(localData);
  const serverFields = flattenObject(serverData);

  const differences: FieldDifference[] = [];

  // Check all local fields
  for (const [field, localValue] of Object.entries(localFields)) {
    const serverValue = serverFields[field];

    if (serverValue === undefined) {
      differences.push({
        field,
        localValue,
        serverValue: null,
        type: 'added',
      });
    } else if (!deepEqual(localValue, serverValue)) {
      differences.push({
        field,
        localValue,
        serverValue,
        type: 'modified',
      });
    }
  }

  // Check for removed fields
  for (const [field, serverValue] of Object.entries(serverFields)) {
    if (localFields[field] === undefined) {
      differences.push({
        field,
        localValue: null,
        serverValue,
        type: 'removed',
      });
    }
  }

  return differences;
};
```

**Code Example:**

```typescript
'use client';

import { Modal, Table, Badge, Button, Group, Stack, Text, Code } from '@mantine/core';
import { IconCheck, IconX, IconGitMerge } from '@tabler/icons-react';

export function ConflictResolutionModal({ conflict, onResolve, onClose }) {
  const [selectedResolution, setSelectedResolution] = useState<Record<string, 'local' | 'server'>>({});

  const handleKeepLocal = () => {
    onResolve(conflict.id, 'local');
    onClose();
  };

  const handleKeepServer = () => {
    onResolve(conflict.id, 'server');
    onClose();
  };

  const handleMerge = () => {
    const mergedData = {};

    conflict.differences.forEach(diff => {
      const resolution = selectedResolution[diff.field] || 'server';
      mergedData[diff.field] = resolution === 'local'
        ? diff.localValue
        : diff.serverValue;
    });

    onResolve(conflict.id, 'merge', mergedData);
    onClose();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="xl"
      title="Resolve Conflict"
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Local and server versions differ. Choose how to resolve:
        </Text>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Field</Table.Th>
              <Table.Th>Local Value</Table.Th>
              <Table.Th>Server Value</Table.Th>
              <Table.Th>Choose</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {conflict.differences.map((diff) => (
              <Table.Tr key={diff.field}>
                <Table.Td>
                  <Code>{diff.field}</Code>
                </Table.Td>
                <Table.Td>
                  <Badge color={diff.type === 'added' ? 'green' : diff.type === 'removed' ? 'red' : 'yellow'}>
                    {JSON.stringify(diff.localValue)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={diff.type === 'added' ? 'red' : diff.type === 'removed' ? 'green' : 'yellow'}>
                    {JSON.stringify(diff.serverValue)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant={selectedResolution[diff.field] === 'local' ? 'filled' : 'light'}
                      onClick={() => setSelectedResolution({ ...selectedResolution, [diff.field]: 'local' })}
                    >
                      Local
                    </Button>
                    <Button
                      size="xs"
                      variant={selectedResolution[diff.field] === 'server' ? 'filled' : 'light'}
                      onClick={() => setSelectedResolution({ ...selectedResolution, [diff.field]: 'server' })}
                    >
                      Server
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="space-between">
          <Group>
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={handleKeepLocal}
            >
              Keep All Local
            </Button>
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={handleKeepServer}
            >
              Keep All Server
            </Button>
            <Button
              leftSection={<IconGitMerge size={16} />}
              onClick={handleMerge}
              variant="light"
            >
              Merge Selected
            </Button>
          </Group>
          <Button
            leftSection={<IconX size={16} />}
            onClick={onClose}
            variant="subtle"
            color="gray"
          >
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
```

## Acceptance Criteria

- [x] /sync/conflicts route lists all unresolved conflicts
- [x] Clicking conflict opens side-by-side comparison modal
- [x] Field-level differences highlighted with badges
- [x] "Keep Local" button resolves with local version
- [x] "Keep Server" button resolves with server version
- [x] "Merge" button allows field-by-field selection
- [x] Conflict resolution history stored (who, when, how)
- [x] Resolved conflicts removed from list
- [x] Empty state shown when no conflicts
- [x] Multi-tenant isolation validated (code review)
- [x] Touch targets sized for construction gloves (code review)
- [x] Accessibility labels for screen readers (code review)

## Testing Requirements

**Unit Tests:**

- Test conflict detection algorithm with various data types
- Test flattenObject utility
- Test deepEqual comparison
- Test merge resolution logic
- Test conflict history storage

**Integration Tests:**

- Test conflict detection on sync
- Test Keep Local resolution
- Test Keep Server resolution
- Test Merge resolution
- Test conflict history persistence

**Manual Testing:**

- Create form offline, edit same form online, trigger sync
- Verify conflict detected
- Test all resolution options (Local, Server, Merge)
- Verify resolved conflict no longer appears
- Check conflict history stored

## Evidence Requirements

- [x] Screenshot: Conflict list with multiple conflicts
- [x] Screenshot: Side-by-side comparison modal
- [x] Screenshot: Field-level differences highlighted
- [x] Screenshot: Merge editor with selections
- [x] Screenshot: Conflict resolution history
- [x] Test Results: 70 tests passing (48 store + 10 modal + 12 page)
- [x] Performance: Conflict comparison <2s for 100-field forms
- [x] Code Review: All CRITICAL and HIGH issues resolved

## Success Criteria

Conflict resolution UI is complete when:

- All conflicts detected and listed
- Side-by-side comparison functional
- All three resolution options working (Local, Server, Merge)
- Conflict history stored
- All tests passing
- Evidence collected and documented

---

**Created:** 2025-10-23
**Last Updated:** 2025-11-29
**Status:** COMPLETE

## Git Commits

1. `69e10b9` - feat(sync): implement conflict resolution UI (ISSUE-136) - Initial implementation
2. `8c89f0d` - fix(sync): address code review issues for ISSUE-136 conflict resolution - Code review fixes
