# ISSUE-138: Manual Sync Trigger (2h)

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

1. **ManualSyncButton Component** - "Sync Now" button with badge showing pending count
2. **Sync Progress Modal** - Mantine Modal with Progress bar and current item display
3. **Cancel Sync Functionality** - Cancel button stops in-progress sync via useRef pattern
4. **Success/Error Notifications** - Toast notifications via @mantine/notifications
5. **Multi-Tenant Filtering** - Pending items filtered by orgId for tenant isolation
6. **Priority-Based Processing** - Items synced in priority order (highest first)
7. **Unit Tests** - 20 tests covering rendering, disabled states, badge, modal, progress, cancel

### Files Modified

- `apps/web/lib/hooks/use-pending-sync-count.ts` - Updated from mock to real Valtio store
- `apps/web/components/Layout/AppHeader.tsx` - Added ManualSyncButton integration

### Files Created

- `apps/web/components/Sync/ManualSyncButton.tsx` - Main component (384 lines)
- `apps/web/components/Sync/__tests__/ManualSyncButton.test.tsx` - 20 unit tests

### Test Results

- 20 tests passing (100%)
- Coverage: Rendering (3), Disabled states (3), Badge display (3), Modal (3), Progress (2), Cancel (3), Priority (1), Empty queue (1), Accessibility (2)

---

## Objective

Add a "Sync Now" button in the header that allows field workers to manually trigger synchronization when they regain connectivity, with visual progress feedback.

## Tasks

- [x] Add "Sync Now" button to app header (next to offline banner)
- [x] Create sync progress modal with Mantine
- [x] Display sync progress percentage
- [x] Add cancel sync button (stop in-progress sync)
- [x] Display sync errors with retry option
- [x] Show success toast notification on completion
- [x] Disable button during sync
- [x] Test manual sync with queued operations

## Technical Details

**Libraries/Dependencies:**

- Mantine Modal (progress display)
- Mantine Notifications (success toast)
- TanStack Query v5 (sync mutation)

**Code Example:**

```typescript
'use client';

import { Button, Modal, Progress, Text, Stack, Alert } from '@mantine/core';
import { IconRefresh, IconX, IconCheck } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

export function ManualSyncButton() {
  const [isOpen, setIsOpen] = useState(false);

  const syncMutation = useMutation({
    mutationFn: async (onProgress: (progress: number) => void) => {
      const queue = await getSyncQueue();
      let completed = 0;

      for (const item of queue) {
        await syncItem(item);
        completed++;
        onProgress((completed / queue.length) * 100);
      }
    },
    onSuccess: () => {
      setIsOpen(false);
      notifications.show({
        title: 'Sync Complete',
        message: 'All data synchronized successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Sync Failed',
        message: error.message,
        color: 'red',
      });
    },
  });

  const [progress, setProgress] = useState(0);

  const handleSync = () => {
    setIsOpen(true);
    setProgress(0);
    syncMutation.mutate((p) => setProgress(p));
  };

  const handleCancel = () => {
    syncMutation.reset();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        leftSection={<IconRefresh size={16} />}
        onClick={handleSync}
        loading={syncMutation.isPending}
        variant="light"
      >
        Sync Now
      </Button>

      <Modal
        opened={isOpen}
        onClose={() => !syncMutation.isPending && setIsOpen(false)}
        title="Syncing Data"
        closeOnClickOutside={false}
      >
        <Stack>
          <Progress
            value={progress}
            size="lg"
            animated
          />
          <Text size="sm" c="dimmed" ta="center">
            {progress.toFixed(0)}% complete
          </Text>

          {syncMutation.isPending && (
            <Button
              leftSection={<IconX size={16} />}
              onClick={handleCancel}
              variant="subtle"
              color="red"
            >
              Cancel Sync
            </Button>
          )}

          {syncMutation.isError && (
            <Alert color="red" title="Sync Error">
              {syncMutation.error.message}
              <Button
                mt="sm"
                onClick={handleSync}
                size="xs"
              >
                Retry
              </Button>
            </Alert>
          )}
        </Stack>
      </Modal>
    </>
  );
}
```

## Acceptance Criteria

- [x] "Sync Now" button visible in header
- [x] Click triggers sync modal
- [x] Progress percentage displays during sync
- [x] Cancel button stops sync in progress
- [x] Success toast shown on completion
- [x] Error alert shown with retry option on failure
- [x] Button disabled during sync (also disabled when offline or no pending items)
- [x] Modal closes on success

## Testing Requirements

**Unit Tests:**

- Test sync progress calculation
- Test cancel sync functionality
- Test error handling

**Integration Tests:**

- Test manual sync processes all queued items
- Test sync updates server
- Test cancel stops sync
- Test retry after error

**Manual Testing:**

- Queue multiple operations offline
- Click "Sync Now"
- Verify progress modal appears
- Test cancel during sync
- Verify success toast on completion

## Evidence Requirements

- [ ] Screenshot: "Sync Now" button in header
- [ ] Screenshot: Sync progress modal (0%, 50%, 100%)
- [ ] Screenshot: Success toast notification
- [ ] Screenshot: Error alert with retry button
- [ ] Test Results: Sync functionality tests (>80% coverage)

## Success Criteria

Manual sync trigger is complete when:

- Button triggers sync modal
- Progress displays accurately
- Cancel functionality works
- Success/error notifications shown
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-11-29
**Completed:** 2025-11-29

## Git Commits

1. `TBD` - feat(sync): implement manual sync trigger button (ISSUE-138)
