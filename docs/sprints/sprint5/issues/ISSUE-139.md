# ISSUE-139: Retry Failed Sync (2h)

**Priority:** P0
**Phase:** Phase 2 - Offline Experience UI
**Estimated Hours:** 2
**Dependencies:** ISSUE-159
**Sprint:** Sprint 5

---

## Objective

Implement functionality to identify and retry failed sync operations, giving field workers the ability to resolve sync errors without manual intervention.

## Tasks

- [ ] Identify failed sync operations in queue
- [ ] Display failed items with red badge in sync queue
- [ ] Add "Retry All Failed" button to sync dashboard
- [ ] Add retry individual failed item button
- [ ] Display failure reason (network error, validation error, etc.)
- [ ] Update failure count on retry attempts
- [ ] Log failure reasons for debugging
- [ ] Test with various failure scenarios

## Technical Details

**Libraries/Dependencies:**

- Mantine Badge (failure indicators)
- TanStack Query v5 (retry mutations)

**Implementation Notes:**

**Failure Tracking:**

```typescript
interface FailedSyncItem extends SyncQueueItem {
  failureReason: string;
  failureTimestamp: Date;
  failureType: 'network' | 'validation' | 'auth' | 'server' | 'unknown';
}

const classifyFailure = (error: Error): FailureType => {
  if (error.message.includes('network') || error.message.includes('fetch failed')) {
    return 'network';
  }
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return 'validation';
  }
  if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
    return 'auth';
  }
  if (error.message.includes('500') || error.message.includes('server error')) {
    return 'server';
  }
  return 'unknown';
};
```

**Code Example:**

```typescript
'use client';

import { Button, Badge, Group, Alert, Stack } from '@mantine/core';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useSnapshot } from 'valtio';
import { syncQueueStore } from '@/stores/syncQueue';

export function RetryFailedSync() {
  const { queue } = useSnapshot(syncQueueStore);

  const failedItems = queue.filter(item => item.status === 'failed');

  const retryAllMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        failedItems.map(item => syncQueueStore.retryItem(item.id))
      );
      return results;
    },
  });

  if (failedItems.length === 0) {
    return null;
  }

  return (
    <Stack>
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Failed Sync Operations"
        color="red"
      >
        {failedItems.length} operation(s) failed to sync.
      </Alert>

      <Group>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={() => retryAllMutation.mutate()}
          loading={retryAllMutation.isPending}
          color="red"
        >
          Retry All Failed ({failedItems.length})
        </Button>
      </Group>

      <Stack gap="xs">
        {failedItems.map(item => (
          <Group key={item.id} justify="space-between">
            <Group gap="xs">
              <Badge color="red">Failed</Badge>
              <Text size="sm">{item.type}</Text>
              <Text size="xs" c="dimmed">{item.failureReason}</Text>
            </Group>
            <Button
              size="xs"
              onClick={() => syncQueueStore.retryItem(item.id)}
            >
              Retry
            </Button>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}
```

## Acceptance Criteria

- [ ] Failed sync operations identified in queue
- [ ] Failed items displayed with red badge
- [ ] "Retry All Failed" button visible when failures exist
- [ ] Individual retry buttons functional
- [ ] Failure reason displayed for each failed item
- [ ] Retry attempt count incremented
- [ ] Failed items removed from queue on successful retry
- [ ] Alert shows count of failed operations

## Testing Requirements

**Unit Tests:**

- Test failure classification logic
- Test retry logic
- Test failure counting

**Integration Tests:**

- Test retry updates sync queue
- Test successful retry removes from failed list
- Test retry all failed functionality
- Test failure reason persistence

**Manual Testing:**

- Simulate network failure during sync
- Verify failed items flagged
- Test individual retry
- Test retry all failed
- Verify success removes from failed list

## Evidence Requirements

- [ ] Screenshot: Failed sync items with red badges
- [ ] Screenshot: "Retry All Failed" button
- [ ] Screenshot: Individual retry buttons
- [ ] Screenshot: Failure reasons displayed
- [ ] Test Results: Retry functionality tests (>80% coverage)

## Success Criteria

Retry failed sync is complete when:

- Failed operations identified and flagged
- Retry all and individual retry functional
- Failure reasons displayed
- All tests passing
- Evidence collected

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
