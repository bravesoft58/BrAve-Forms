# ISSUE-133: Manual Sync Trigger (2h)

**Priority:** P0
**Phase:** Phase 2 - Offline Experience UI
**Estimated Hours:** 2
**Dependencies:** ISSUE-132
**Sprint:** Sprint 5

---

## Objective

Add a "Sync Now" button in the header that allows field workers to manually trigger synchronization when they regain connectivity, with visual progress feedback.

## Tasks

- [ ] Add "Sync Now" button to app header (next to offline banner)
- [ ] Create sync progress modal with Mantine
- [ ] Display sync progress percentage
- [ ] Add cancel sync button (stop in-progress sync)
- [ ] Display sync errors with retry option
- [ ] Show success toast notification on completion
- [ ] Disable button during sync
- [ ] Test manual sync with queued operations

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

- [ ] "Sync Now" button visible in header
- [ ] Click triggers sync modal
- [ ] Progress percentage displays during sync
- [ ] Cancel button stops sync in progress
- [ ] Success toast shown on completion
- [ ] Error alert shown with retry option on failure
- [ ] Button disabled during sync
- [ ] Modal closes on success

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
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
