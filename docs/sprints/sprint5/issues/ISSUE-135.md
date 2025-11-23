# ISSUE-135: Sync Queue Management (4h)

**Priority:** P0
**Phase:** Phase 2 - Offline Experience UI
**Estimated Hours:** 4
**Dependencies:** ISSUE-160
**Sprint:** Sprint 5

---

## Objective

Create a sync queue management interface that displays all pending sync operations with the ability to retry or delete individual items. This gives field workers visibility into what data is queued for synchronization when they regain connectivity.

## Tasks

- [ ] Create /sync/queue route in Next.js App Router
- [ ] Design queue table component with Mantine Table
- [ ] Fetch pending operations from IndexedDB sync queue
- [ ] Display operation metadata (type, timestamp, size, priority)
- [ ] Implement retry individual operation functionality
- [ ] Implement delete operation with confirmation modal
- [ ] Add operation priority sorting (compliance forms first)
- [ ] Add loading states during operations
- [ ] Test with real queued data from offline mode

## Technical Details

**Libraries/Dependencies:**

- Mantine Table (data grid)
- TanStack Query v5 (sync queue state)
- IndexedDB (queue persistence)
- Valtio (queue state management)

**Implementation Notes:**

**Queue Data Structure:**

```typescript
interface SyncQueueItem {
  id: string;
  type: 'form_submission' | 'photo_upload' | 'annotation' | 'form_update';
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: Date;
  size: number; // bytes
  priority: number; // 1-10, compliance forms = 10
  retries: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed';
}
```

**Priority Calculation:**

```typescript
const calculatePriority = (item: SyncQueueItem): number => {
  // Compliance forms (inspections, weather events) = priority 10
  if (item.type === 'form_submission' && isComplianceForm(item.data)) {
    return 10;
  }

  // Photos with compliance data = priority 8
  if (item.type === 'photo_upload' && hasComplianceMetadata(item.data)) {
    return 8;
  }

  // Regular form submissions = priority 5
  if (item.type === 'form_submission') {
    return 5;
  }

  // Other operations = priority 3
  return 3;
};
```

**Code Example:**

```typescript
'use client';

import { Table, Badge, Button, ActionIcon, Group, Text } from '@mantine/core';
import { IconRefresh, IconTrash, IconClock } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { syncQueueStore } from '@/stores/syncQueue';

export function SyncQueueTable() {
  const { queue } = useSnapshot(syncQueueStore);

  const sortedQueue = [...queue].sort((a, b) => b.priority - a.priority);

  const handleRetry = async (id: string) => {
    await syncQueueStore.retryItem(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this queued operation? This cannot be undone.')) {
      await syncQueueStore.deleteItem(id);
    }
  };

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Type</Table.Th>
          <Table.Th>Timestamp</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th>Priority</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sortedQueue.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>
              <Badge variant="light">
                {item.type.replace('_', ' ')}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <IconClock size={16} />
                <Text size="sm">{formatRelativeTime(item.timestamp)}</Text>
              </Group>
            </Table.Td>
            <Table.Td>{formatBytes(item.size)}</Table.Td>
            <Table.Td>
              <Badge color={item.priority >= 8 ? 'red' : 'blue'}>
                {item.priority}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Badge color={getStatusColor(item.status)}>
                {item.status}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  onClick={() => handleRetry(item.id)}
                  disabled={item.status === 'syncing'}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => handleDelete(item.id)}
                  disabled={item.status === 'syncing'}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
```

## Acceptance Criteria

- [ ] /sync/queue route displays all pending operations
- [ ] Operations sorted by priority (compliance first)
- [ ] Each row shows type, timestamp, size, priority, status
- [ ] Retry button triggers individual operation sync
- [ ] Delete button removes operation from queue (with confirmation)
- [ ] Loading states displayed during retry/delete
- [ ] Empty state shown when no queued operations
- [ ] Table responsive on mobile devices

## Testing Requirements

**Unit Tests:**

- Test priority calculation logic
- Test sorting by priority
- Test retry operation
- Test delete operation with confirmation
- Test formatBytes utility
- Test formatRelativeTime utility

**Integration Tests:**

- Test queue updates when operations added/removed
- Test retry triggers actual sync
- Test delete removes from IndexedDB
- Test queue persistence across page reloads

**Manual Testing:**

- Go offline, create form submissions and upload photos
- Navigate to /sync/queue
- Verify all operations listed with correct metadata
- Test retry individual operation
- Test delete operation
- Verify priority sorting (compliance forms at top)

## Evidence Requirements

- [ ] Screenshot: Sync queue with multiple operations (different types, priorities)
- [ ] Screenshot: Retry operation in progress
- [ ] Screenshot: Delete confirmation modal
- [ ] Screenshot: Empty queue state
- [ ] Test Results: Unit tests for queue management (>80% coverage)
- [ ] Performance: Queue load time <500ms for 100 items

## Success Criteria

Sync queue management is complete when:

- All pending operations displayed in priority order
- Retry and delete functionality working
- All tests passing
- Evidence collected and documented
- Mobile responsive design verified

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
