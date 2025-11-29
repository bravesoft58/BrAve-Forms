'use client';

/**
 * Sync Status Dashboard Page
 *
 * Displays sync status information for offline-first operations:
 * - Current sync status (synced, syncing, offline, error)
 * - Last sync and next auto-sync timestamps
 * - Sync statistics (forms synced, photos uploaded, pending items)
 * - Storage usage metrics
 * - 30-day offline countdown (EPA compliance requirement)
 *
 * @security Multi-tenant isolation via orgId in query keys
 * @offline Works offline using cached data from TanStack Query
 */

import { PageContainer } from '@/components/Layout/PageContainer';
import {
  Stack,
  Grid,
  Card,
  Text,
  Progress,
  Badge,
  Group,
  Button,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconCloud,
  IconCloudOff,
  IconDatabase,
  IconClock,
  IconAlertCircle,
  IconRefresh,
  IconCheck,
  IconLoader,
  IconX,
  IconTrash,
  IconDownload,
} from '@tabler/icons-react';
import {
  useSyncDashboard,
  formatBytes,
  calculateStorageDaysRemaining,
} from '@/hooks/useSyncStatus';
import { useQueryClient } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';

/**
 * Get status badge color based on sync state
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'synced':
      return 'green';
    case 'syncing':
      return 'blue';
    case 'offline':
      return 'yellow';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get status icon based on sync state
 */
function getStatusIcon(status: string) {
  switch (status) {
    case 'synced':
      return <IconCheck size={16} />;
    case 'syncing':
      return <IconLoader size={16} />;
    case 'offline':
      return <IconCloudOff size={16} />;
    case 'error':
      return <IconX size={16} />;
    default:
      return <IconCloud size={16} />;
  }
}

/**
 * Format date for display
 */
function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

export default function SyncStatusPage() {
  const queryClient = useQueryClient();
  const auth = useAppAuth();
  const orgId = auth.orgId || 'default';
  const { syncStatus, stats, storage, offlineDaysRemaining, isLoading, isError } =
    useSyncDashboard();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sync'] });
  };

  const status = syncStatus.data?.status || 'offline';
  const lastSync = syncStatus.data?.lastSync || null;
  const nextSync = syncStatus.data?.nextSync || null;
  const isOnline = syncStatus.data?.isOnline ?? false;

  const formsSyncedToday = stats.data?.formsSyncedToday ?? 0;
  const photosUploadedToday = stats.data?.photosUploadedToday ?? 0;
  const pendingItems = stats.data?.pendingItems ?? 0;
  const failedItems = stats.data?.failedItems ?? 0;

  const storageUsed = storage.data?.used ?? 0;
  const storageAvailable = storage.data?.available ?? 0;

  // Calculate storage percentage and estimated days remaining
  const storagePercentage = storageAvailable > 0 ? (storageUsed / storageAvailable) * 100 : 0;
  const isStorageWarning = storagePercentage > 80;
  const isStorageCritical = storagePercentage > 90;

  // Estimate storage days remaining (assuming 30-day capacity per EPA compliance)
  const storageDaysRemaining = calculateStorageDaysRemaining(storagePercentage);

  // Handler for cleanup navigation
  const handleCleanupStorage = () => {
    // Navigate to queue page to manage pending items
    window.location.href = '/sync/queue';
  };

  // Handler for exporting old data
  const handleExportData = async () => {
    try {
      // Export localStorage data as JSON using org-scoped keys for multi-tenant isolation
      const scopedPrefix = `braveforms_org_${orgId}_`;
      const legacyPrefix = 'braveforms_';

      // Try scoped keys first, fall back to legacy keys
      const exportData = {
        exportedAt: new Date().toISOString(),
        orgId,
        pendingQueue:
          localStorage.getItem(`${scopedPrefix}pending_queue`) ||
          localStorage.getItem(`${legacyPrefix}pending_queue`),
        failedQueue:
          localStorage.getItem(`${scopedPrefix}failed_queue`) ||
          localStorage.getItem(`${legacyPrefix}failed_queue`),
        settings:
          localStorage.getItem(`${scopedPrefix}settings`) ||
          localStorage.getItem(`${legacyPrefix}settings`),
        lastSync:
          localStorage.getItem(`${scopedPrefix}last_sync`) ||
          localStorage.getItem(`${legacyPrefix}last_sync`),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `braveforms-${orgId}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to export data:', error);
    }
  };

  return (
    <PageContainer
      title="Sync Status"
      actions={
        <Button
          variant="light"
          size="sm"
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefresh}
          loading={syncStatus.isFetching || stats.isFetching}
        >
          Refresh
        </Button>
      }
    >
      <Stack gap="lg">
        {/* Loading state */}
        {isLoading && (
          <Group justify="center" py="xl">
            <Loader size="lg" />
            <Text>Loading sync status...</Text>
          </Group>
        )}

        {/* Error state */}
        {isError && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error loading sync status" color="red">
            Unable to load sync status. Please try again.
          </Alert>
        )}

        {/* Main content */}
        {!isLoading && (
          <>
            {/* Current Status Card */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <Group gap="md">
                  <IconCloud size={32} stroke={1.5} />
                  <div>
                    <Text size="sm" c="dimmed">
                      Current Status
                    </Text>
                    <Badge
                      color={getStatusColor(status)}
                      size="lg"
                      leftSection={getStatusIcon(status)}
                    >
                      {status.toUpperCase()}
                    </Badge>
                  </div>
                </Group>

                {/* Offline warning badge */}
                {offlineDaysRemaining < 7 && (
                  <Badge
                    color="red"
                    variant="light"
                    size="lg"
                    leftSection={<IconAlertCircle size={16} />}
                  >
                    {offlineDaysRemaining} days remaining
                  </Badge>
                )}

                {/* Online/Offline indicator */}
                <Badge color={isOnline ? 'green' : 'yellow'} variant="outline">
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </Group>
            </Card>

            {/* Sync Timestamps */}
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group gap="md">
                    <IconClock size={24} stroke={1.5} />
                    <div>
                      <Text size="sm" c="dimmed">
                        Last Sync
                      </Text>
                      <Text size="lg" fw={500}>
                        {formatDateTime(lastSync)}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group gap="md">
                    <IconClock size={24} stroke={1.5} />
                    <div>
                      <Text size="sm" c="dimmed">
                        Next Auto-Sync
                      </Text>
                      <Text size="lg" fw={500}>
                        {formatDateTime(nextSync)}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Sync Statistics */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Text size="lg" fw={500}>
                  Today&apos;s Activity
                </Text>
                <Grid>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="sm" c="dimmed">
                      Forms Synced
                    </Text>
                    <Text size="xl" fw={700}>
                      {formsSyncedToday}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="sm" c="dimmed">
                      Photos Uploaded
                    </Text>
                    <Text size="xl" fw={700}>
                      {photosUploadedToday}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="sm" c="dimmed">
                      Pending Items
                    </Text>
                    <Text size="xl" fw={700} c={pendingItems > 0 ? 'yellow' : undefined}>
                      {pendingItems}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Text size="sm" c="dimmed">
                      Failed Items
                    </Text>
                    <Text size="xl" fw={700} c={failedItems > 0 ? 'red' : undefined}>
                      {failedItems}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            {/* Storage Usage */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="md">
                    <IconDatabase size={24} stroke={1.5} />
                    <Text size="lg" fw={500}>
                      Local Storage
                    </Text>
                  </Group>
                  <Badge
                    color={isStorageCritical ? 'red' : isStorageWarning ? 'yellow' : 'green'}
                    size="lg"
                  >
                    {formatBytes(storageUsed)} / {formatBytes(storageAvailable)}
                  </Badge>
                </Group>

                <Progress
                  value={storagePercentage}
                  color={isStorageCritical ? 'red' : isStorageWarning ? 'yellow' : 'green'}
                  size="lg"
                  radius="md"
                  animated={isStorageCritical}
                />

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Approximately {storageDaysRemaining} days of storage remaining
                  </Text>
                  {storageAvailable > 0 && (
                    <Text size="sm" c="dimmed">
                      {storagePercentage.toFixed(1)}% used
                    </Text>
                  )}
                </Group>

                <Text size="xs" c="dimmed">
                  30-day offline sync capacity: {offlineDaysRemaining} days since last sync
                </Text>
              </Stack>
            </Card>

            {/* Storage warning with cleanup suggestions (>80%) */}
            {isStorageWarning && !isStorageCritical && (
              <Alert icon={<IconAlertCircle size={16} />} title="Storage Warning" color="yellow">
                <Stack gap="sm">
                  <Text size="sm">
                    Approaching storage limit ({storagePercentage.toFixed(1)}% used). Consider
                    cleaning up old drafts or exporting data.
                  </Text>
                  <Group>
                    <Button
                      size="xs"
                      variant="light"
                      color="yellow"
                      leftSection={<IconTrash size={14} />}
                      onClick={handleCleanupStorage}
                    >
                      Clean Up Storage
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconDownload size={14} />}
                      onClick={handleExportData}
                    >
                      Export Old Data
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            )}

            {/* Critical storage warning (>90%) */}
            {isStorageCritical && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Critical Storage Warning"
                color="red"
              >
                <Stack gap="sm">
                  <Text size="sm">
                    Less than {storageDaysRemaining} days of storage remaining! Clean up old data or
                    export immediately to free space.
                  </Text>
                  <Group>
                    <Button
                      size="xs"
                      variant="filled"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={handleCleanupStorage}
                    >
                      Clean Up Now
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconDownload size={14} />}
                      onClick={handleExportData}
                    >
                      Export Data
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            )}

            {/* Offline countdown warning */}
            {offlineDaysRemaining <= 7 && offlineDaysRemaining > 0 && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Offline Sync Warning"
                color="yellow"
              >
                You have {offlineDaysRemaining} days remaining in your 30-day offline window. Please
                sync soon to maintain EPA compliance data access.
              </Alert>
            )}

            {/* Expired warning */}
            {offlineDaysRemaining === 0 && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Offline Period Expired"
                color="red"
              >
                Your 30-day offline period has expired. Please connect to the internet and sync
                immediately to restore full functionality and maintain EPA compliance.
              </Alert>
            )}
          </>
        )}
      </Stack>
    </PageContainer>
  );
}
