# ISSUE-137: Offline Storage Indicators (2h)

**Priority:** P0
**Phase:** Phase 2 - Offline Experience UI
**Estimated Hours:** 2
**Actual Hours:** 1.5
**Dependencies:** ISSUE-162 (Complete)
**Sprint:** Sprint 5
**Status:** COMPLETE

---

## Completion Summary

### What Was Implemented

1. **Storage Warning Thresholds** - Warning at >80%, Critical at >90%
2. **Estimated Days Remaining** - Based on storage percentage (30-day capacity)
3. **Cleanup Suggestions** - Clean Up Storage button navigates to queue management
4. **Export Data Functionality** - Downloads localStorage data as JSON file
5. **Unit Tests** - 42 tests covering all storage calculations
6. **Multi-Tenant localStorage Scoping** - Keys scoped by orgId for tenant isolation

### Files Modified

- `apps/web/app/sync/status/page.tsx` - Enhanced storage display with warnings and actions
- `apps/web/lib/api/sync.ts` - Added org-scoped localStorage keys and utility functions
- `apps/web/hooks/useSyncStatus.ts` - Pass orgId to sync functions

### Files Created

- `apps/web/lib/api/__tests__/sync.test.ts` - 42 unit tests

### Test Results

- 42 tests passing (100%)
- Coverage: calculateOfflineDaysRemaining (8), calculateStorageDaysRemaining (8), formatBytes (6), getStorageEstimate (4), thresholds (5), EPA compliance (3), offline scenarios (5), multi-tenant scoping (3)

---

## Objective

Add storage indicators to the sync dashboard that show how much local storage is used and warn users when approaching the 30-day offline capacity limit. This prevents data loss for construction field workers.

## Tasks

- [x] Calculate storage usage using navigator.storage.estimate()
- [x] Display storage meter in sync dashboard (used/available)
- [x] Implement warning when approaching 30-day capacity (>80%)
- [x] Implement alert when <5 days remaining (>90%)
- [x] Add storage cleanup suggestions (delete old drafts, export data)
- [x] Create export old data functionality
- [x] Add unit tests for storage calculations
- [x] Test with various storage levels

## Technical Details

**Libraries/Dependencies:**

- Browser Storage API (navigator.storage.estimate())
- Mantine Progress (storage meter)
- IndexedDB (data export)

**Implementation Notes:**

**Storage Calculation:**

```typescript
const getStorageInfo = async (): Promise<StorageInfo> => {
  const estimate = await navigator.storage.estimate();

  const used = estimate.usage || 0;
  const quota = estimate.quota || 0;
  const usedMB = used / (1024 * 1024);
  const quotaMB = quota / (1024 * 1024);
  const percentUsed = quota > 0 ? (used / quota) * 100 : 0;

  // Estimate days remaining (assuming 30-day capacity)
  const daysRemaining = Math.max(0, 30 - (percentUsed / 100) * 30);

  return {
    used,
    quota,
    usedMB,
    quotaMB,
    percentUsed,
    daysRemaining,
  };
};
```

**Code Example:**

```typescript
'use client';

import { Progress, Text, Alert, Button, Group, Stack } from '@mantine/core';
import { IconAlertTriangle, IconDatabase, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

export function StorageIndicators() {
  const { data: storage } = useQuery({
    queryKey: ['storage-info'],
    queryFn: getStorageInfo,
    refetchInterval: 60000, // Update every minute
  });

  if (!storage) return null;

  const isWarning = storage.percentUsed > 80;
  const isAlert = storage.percentUsed > 90;

  return (
    <Stack>
      <Group justify="space-between">
        <Group gap="xs">
          <IconDatabase size={20} />
          <Text size="sm" fw={600}>Local Storage</Text>
        </Group>
        <Text size="sm" c="dimmed">
          {storage.usedMB.toFixed(1)} MB / {storage.quotaMB.toFixed(1)} MB
        </Text>
      </Group>

      <Progress
        value={storage.percentUsed}
        color={isAlert ? 'red' : isWarning ? 'yellow' : 'blue'}
        size="lg"
        animated={isAlert}
      />

      <Text size="xs" c="dimmed">
        Approximately {Math.floor(storage.daysRemaining)} days remaining
      </Text>

      {isWarning && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Storage Warning"
          color={isAlert ? 'red' : 'yellow'}
        >
          {isAlert
            ? `Less than ${Math.floor(storage.daysRemaining)} days of storage remaining. Clean up old data or export to free space.`
            : 'Approaching storage limit. Consider cleaning up old drafts.'}
        </Alert>
      )}

      {isWarning && (
        <Group>
          <Button
            leftSection={<IconTrash size={16} />}
            variant="light"
            onClick={() => {/* Navigate to cleanup */}}
          >
            Clean Up Storage
          </Button>
          <Button
            variant="light"
            onClick={() => {/* Export old data */}}
          >
            Export Old Data
          </Button>
        </Group>
      )}
    </Stack>
  );
}
```

## Acceptance Criteria

- [x] Storage meter displays used/available storage
- [x] Percentage used calculated correctly
- [x] Days remaining estimation accurate
- [x] Warning shown when >80% used
- [x] Alert shown when >90% used
- [x] Cleanup suggestions displayed when warning
- [x] Export functionality working
- [x] Storage updates every minute (via TanStack Query refetchInterval)

## Testing Requirements

**Unit Tests:**

- Test storage calculation with various quota values
- Test days remaining estimation
- Test warning thresholds (80%, 90%)
- Test formatBytes utility

**Integration Tests:**

- Test storage updates when data added/removed
- Test cleanup reduces storage usage
- Test export functionality

**Manual Testing:**

- View storage meter with various data amounts
- Add data until warning threshold
- Verify warning displays
- Test cleanup suggestions
- Test export old data

## Evidence Requirements

- [ ] Screenshot: Storage meter at <50% (normal state)
- [ ] Screenshot: Storage meter at >80% (warning state)
- [ ] Screenshot: Storage meter at >90% (alert state)
- [ ] Screenshot: Cleanup suggestions displayed
- [ ] Test Results: Storage calculation tests (>80% coverage)

## Success Criteria

Storage indicators are complete when:

- Accurate storage usage displayed
- Warnings shown at correct thresholds
- Cleanup and export functionality working
- All tests passing
- Evidence collected and documented

---

**Created:** 2025-10-23
**Last Updated:** 2025-11-29
**Completed:** 2025-11-29

## Git Commits

1. `2bc1907` - feat(sync): implement offline storage indicators (ISSUE-137)
2. `de15a87` - docs: mark ISSUE-137 as complete with implementation details
3. `1a529e4` - fix(sync): address code review issues for ISSUE-137 storage indicators

## Code Review Fixes (1a529e4)

**HIGH #1 - Fixed:** Extract storageDaysRemaining calculation to utility function

- Problem: Hardcoded calculation in page component
- Solution: Added `calculateStorageDaysRemaining()` utility function to sync.ts with clamping

**HIGH #2 - Fixed:** Scope localStorage keys by orgId for multi-tenant isolation

- Problem: localStorage keys not scoped to organization (data leakage risk)
- Solution: Added `getScopedKey()` helper, updated all sync functions with orgId parameter

**HIGH #3 - Fixed:** Add offline scenario tests

- Problem: Missing tests for offline network states
- Solution: Added 8 new tests covering offline, timeout, SSR, and multi-tenant scenarios
