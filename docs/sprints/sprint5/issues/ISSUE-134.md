# ISSUE-134: Sync Status Dashboard (4h)

**Sprint:** Sprint 5 | **Phase:** 2 - Offline Experience UI | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** Phase 1 complete
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Create sync status dashboard displaying current sync state, last sync timestamp, next auto-sync time, sync statistics, storage usage, and 30-day offline countdown.

## Prerequisites

- [ ] Phase 1 complete (Photo Gallery functional)
- [ ] IndexedDB storage working
- [ ] Offline sync engine implemented (Sprint 1)
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Create SyncStatusDashboard Component (120 min)

Create `apps/web/app/sync/status/page.tsx`:

```typescript
'use client';

import { PageContainer } from '@/components/layout/page-container';
import { Stack, Grid, Card, Text, Progress, Badge, Group } from '@mantine/core';
import { IconCloud, IconDatabase, IconClock, IconAlertCircle } from '@tabler/icons-react';
import { useSyncStatus } from '@/hooks/use-sync-status';

export default function SyncStatusPage() {
  const { status, lastSync, nextSync, stats, storage } = useSyncStatus();

  const offlineDaysRemaining = calculateOfflineDaysRemaining(lastSync);

  return (
    <PageContainer title="Sync Status">
      <Stack gap="lg">
        {/* Current Status */}
        <Card shadow="sm" padding="lg">
          <Group justify="space-between">
            <Group>
              <IconCloud size={32} />
              <div>
                <Text size="sm" c="dimmed">Current Status</Text>
                <Badge
                  color={
                    status === 'synced' ? 'green' :
                    status === 'syncing' ? 'blue' :
                    status === 'offline' ? 'yellow' :
                    'red'
                  }
                  size="lg"
                >
                  {status.toUpperCase()}
                </Badge>
              </div>
            </Group>

            {offlineDaysRemaining < 7 && (
              <Badge color="red" leftSection={<IconAlertCircle size={16} />}>
                {offlineDaysRemaining} days remaining
              </Badge>
            )}
          </Group>
        </Card>

        {/* Sync Timestamps */}
        <Grid>
          <Grid.Col span={6}>
            <Card shadow="sm" padding="lg">
              <Group>
                <IconClock size={24} />
                <div>
                  <Text size="sm" c="dimmed">Last Sync</Text>
                  <Text size="lg" fw={500}>
                    {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={6}>
            <Card shadow="sm" padding="lg">
              <Group>
                <IconClock size={24} />
                <div>
                  <Text size="sm" c="dimmed">Next Auto-Sync</Text>
                  <Text size="lg" fw={500}>
                    {nextSync ? new Date(nextSync).toLocaleString() : 'N/A'}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Sync Statistics */}
        <Card shadow="sm" padding="lg">
          <Stack gap="md">
            <Text size="lg" fw={500}>Today's Activity</Text>
            <Grid>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Forms Synced</Text>
                <Text size="xl" fw={700}>{stats.formsSyncedToday}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Photos Uploaded</Text>
                <Text size="xl" fw={700}>{stats.photosUploadedToday}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Pending Items</Text>
                <Text size="xl" fw={700}>{stats.pendingItems}</Text>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        {/* Storage Usage */}
        <Card shadow="sm" padding="lg">
          <Stack gap="md">
            <Group justify="space-between">
              <Group>
                <IconDatabase size={24} />
                <Text size="lg" fw={500}>Local Storage</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {formatBytes(storage.used)} / {formatBytes(storage.available)}
              </Text>
            </Group>

            <Progress
              value={(storage.used / storage.available) * 100}
              color={
                storage.used / storage.available > 0.9 ? 'red' :
                storage.used / storage.available > 0.7 ? 'yellow' :
                'green'
              }
            />

            <Text size="sm" c="dimmed">
              30-day offline capacity: {offlineDaysRemaining} days remaining
            </Text>
          </Stack>
        </Card>
      </Stack>
    </PageContainer>
  );
}

function calculateOfflineDaysRemaining(lastSync: Date | null): number {
  if (!lastSync) return 30;
  const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 30 - Math.floor(daysSinceSync));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
```

### Step 2: Create useSyncStatus Hook (60 min)

Create `apps/web/hooks/use-sync-status.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';

interface SyncStatus {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  lastSync: Date | null;
  nextSync: Date | null;
  stats: {
    formsSyncedToday: number;
    photosUploadedToday: number;
    pendingItems: number;
  };
  storage: {
    used: number;
    available: number;
  };
}

export function useSyncStatus() {
  return useQuery<SyncStatus>({
    queryKey: ['sync-status'],
    queryFn: async () => {
      // Get IndexedDB storage estimate
      const estimate = await navigator.storage.estimate();

      // Get sync status from service worker
      const registration = await navigator.serviceWorker.ready;
      const syncStatus = await registration.sync.getTags();

      return {
        status: navigator.onLine ? 'synced' : 'offline',
        lastSync: new Date(localStorage.getItem('lastSync') || ''),
        nextSync: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        stats: {
          formsSyncedToday: 12,
          photosUploadedToday: 45,
          pendingItems: 3,
        },
        storage: {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        },
      };
    },
    refetchInterval: 30000, // Refetch every 30s
  });
}
```

### Step 3: Test Sync Dashboard (60 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Access sync dashboard
# Navigate to http://localhost:30102/sync/status
```

**Verify:**

- [ ] Current sync status displays
- [ ] Last sync timestamp shows
- [ ] Next auto-sync countdown works
- [ ] Sync statistics accurate
- [ ] Storage meter displays
- [ ] 30-day countdown shows
- [ ] Warning appears when <7 days

## TDD Workflow

**Phase 1: Write Tests**

Create `apps/web/hooks/__tests__/use-sync-status.test.ts`

**Phase 2: Pass Tests**

## Files to Create

**Create:**

- apps/web/app/sync/status/page.tsx
- apps/web/hooks/use-sync-status.ts
- apps/web/hooks/**tests**/use-sync-status.test.ts

## Verification Checklist

- [ ] Sync status dashboard displays
- [ ] All metrics accurate
- [ ] Storage meter works
- [ ] 30-day countdown functional
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-160/

**Required:**

- test-results/red-phase.png
- test-results/green-phase.png
- screenshots/sync-dashboard.png
- screenshots/storage-warning.png

## Success Criteria

- [ ] Sync status dashboard functional
- [ ] All sync metrics display accurately
- [ ] Performance <500ms load time
- [ ] Tests pass with >80% coverage

## Time Estimate

**4 hours total:**

- SyncStatusDashboard component: 120 min
- useSyncStatus hook: 60 min
- Testing: 60 min

## Next Issue

**ISSUE-135:** [Next issue title]
