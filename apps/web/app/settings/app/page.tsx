'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Progress,
  SimpleGrid,
  Card,
  Group,
  Button,
  Badge,
  Modal,
  Alert,
  Divider,
  ThemeIcon,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconDatabase,
  IconPhoto,
  IconForms,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconSettings,
  IconDeviceMobile,
  IconCloud,
  IconFileText,
} from '@tabler/icons-react';
import {
  getStorageInfo,
  clearCacheData,
  clearAllData,
  formatBytes,
  getStorageColor,
  getAppInfo,
  isStorageAPIAvailable,
  type StorageInfo,
  type AppInfo,
} from '@/lib/storage/storage-utils';

/**
 * App Settings Page
 *
 * Displays storage usage, cache management controls, and app version information.
 * Includes confirmation modals for destructive actions.
 */
export default function AppSettingsPage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load storage info
  const loadStorageInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getStorageInfo();
      setStorageInfo(info);
      setAppInfo(getAppInfo());
    } catch (err) {
      setError('Failed to load storage information');
      console.error('Storage info error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorageInfo();
  }, [loadStorageInfo]);

  // Handle clear cache with offline check
  const handleClearCache = async () => {
    // CR-8: Check if offline before clearing cache
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setActionError(
        'Cannot clear cache while offline. Some cached data may be needed for offline operation.'
      );
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const success = await clearCacheData();
      if (success) {
        setActionSuccess('Cache cleared successfully');
        setClearCacheModalOpen(false);
        await loadStorageInfo();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError('Failed to clear cache');
      }
    } catch {
      setActionError('An error occurred while clearing cache');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle clear all data with offline check
  const handleClearAllData = async () => {
    // CR-8: Check if offline - warn that unsynced data will be lost
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setActionError(
        'WARNING: You are offline. Clearing all data will permanently delete any unsynced forms and photos. Please sync first or proceed with extreme caution.'
      );
      // Still allow the operation but with a warning shown
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const success = await clearAllData();
      if (success) {
        setActionSuccess('All data cleared successfully. You may need to log in again.');
        setClearAllModalOpen(false);
        await loadStorageInfo();
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setActionError('Failed to clear all data');
      }
    } catch {
      setActionError('An error occurred while clearing data');
    } finally {
      setActionLoading(false);
    }
  };

  // Storage breakdown items
  const getBreakdownItems = () => {
    if (!storageInfo) return [];
    const { breakdown } = storageInfo;
    return [
      {
        label: 'Photos',
        value: breakdown.photos,
        icon: IconPhoto,
        color: 'blue',
        description: 'Inspection photos and attachments',
      },
      {
        label: 'Forms',
        value: breakdown.forms,
        icon: IconForms,
        color: 'green',
        description: 'Form templates and submissions',
      },
      {
        label: 'Cache',
        value: breakdown.cache,
        icon: IconCloud,
        color: 'orange',
        description: 'API responses and temporary data',
      },
      {
        label: 'Settings',
        value: breakdown.settings,
        icon: IconSettings,
        color: 'violet',
        description: 'User preferences and configuration',
      },
      {
        label: 'Other',
        value: breakdown.other,
        icon: IconFileText,
        color: 'gray',
        description: 'Service workers and misc data',
      },
    ];
  };

  if (loading) {
    return (
      <Stack gap="lg">
        <Title order={2}>App Settings</Title>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Stack>
    );
  }

  const storageAvailable = isStorageAPIAvailable();

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>App Settings</Title>
        <Text c="dimmed" size="sm">
          Manage storage, cache, and view app information
        </Text>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <Alert
          icon={<IconCheck size={16} />}
          title="Success"
          color="green"
          withCloseButton
          onClose={() => setActionSuccess(null)}
        >
          {actionSuccess}
        </Alert>
      )}

      {/* Error Alert */}
      {(error || actionError) && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Error"
          color="red"
          withCloseButton
          onClose={() => {
            setError(null);
            setActionError(null);
          }}
        >
          {error || actionError}
        </Alert>
      )}

      {/* Storage Usage Section */}
      <Paper p="lg" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <ThemeIcon variant="light" size="lg">
              <IconDatabase size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600}>Storage Usage</Text>
              <Text size="xs" c="dimmed">
                Local storage on this device
              </Text>
            </div>
          </Group>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={loadStorageInfo}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>

        {storageAvailable && storageInfo ? (
          <>
            {/* Overall Progress */}
            <Stack gap="xs" mb="lg">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {formatBytes(storageInfo.usage)} of {formatBytes(storageInfo.quota)} used
                </Text>
                <Badge color={getStorageColor(storageInfo.percentUsed)} variant="light">
                  {storageInfo.percentUsed.toFixed(1)}%
                </Badge>
              </Group>
              <Progress
                value={storageInfo.percentUsed}
                color={getStorageColor(storageInfo.percentUsed)}
                size="lg"
                radius="sm"
              />
              <Text size="xs" c="dimmed">
                {formatBytes(storageInfo.available)} available
              </Text>
            </Stack>

            <Divider my="md" label="Storage Breakdown" labelPosition="center" />

            {/* Breakdown Grid */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {getBreakdownItems().map((item) => (
                <Card key={item.label} withBorder padding="sm">
                  <Group gap="sm">
                    <ThemeIcon variant="light" color={item.color} size="md">
                      <item.icon size={16} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>
                          {item.label}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {formatBytes(item.value)}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {item.description}
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </>
        ) : (
          <Alert icon={<IconInfoCircle size={16} />} color="gray">
            Storage estimation is not available in this browser. Some features may be limited.
          </Alert>
        )}
      </Paper>

      {/* Cache Management Section */}
      <Paper p="lg" withBorder>
        <Group gap="xs" mb="md">
          <ThemeIcon variant="light" size="lg" color="orange">
            <IconTrash size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600}>Cache Management</Text>
            <Text size="xs" c="dimmed">
              Clear temporary data to free up space
            </Text>
          </div>
        </Group>

        <Stack gap="md">
          <Card withBorder padding="md">
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text size="sm" fw={500}>
                  Clear Cache
                </Text>
                <Text size="xs" c="dimmed">
                  Remove cached API responses and temporary files. Your forms and photos will not be
                  affected.
                </Text>
              </div>
              <Button variant="light" color="orange" onClick={() => setClearCacheModalOpen(true)}>
                Clear Cache
              </Button>
            </Group>
          </Card>

          <Card withBorder padding="md" style={{ borderColor: 'var(--mantine-color-red-4)' }}>
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text size="sm" fw={500} c="red">
                  Clear All Data
                </Text>
                <Text size="xs" c="dimmed">
                  Remove all locally stored data including forms, photos, and settings. This action
                  cannot be undone.
                </Text>
              </div>
              <Button variant="light" color="red" onClick={() => setClearAllModalOpen(true)}>
                Clear All
              </Button>
            </Group>
          </Card>
        </Stack>
      </Paper>

      {/* App Information Section */}
      {appInfo && (
        <Paper p="lg" withBorder>
          <Group gap="xs" mb="md">
            <ThemeIcon variant="light" size="lg" color="blue">
              <IconDeviceMobile size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600}>App Information</Text>
              <Text size="xs" c="dimmed">
                Version and environment details
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Version
              </Text>
              <Badge variant="light">{appInfo.version}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Build
              </Text>
              <Text size="sm" fw={500}>
                {appInfo.build}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Platform
              </Text>
              <Badge variant="outline" color="gray">
                {appInfo.platform}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Environment
              </Text>
              <Badge
                variant="outline"
                color={
                  appInfo.environment === 'production'
                    ? 'green'
                    : appInfo.environment === 'staging'
                      ? 'yellow'
                      : 'blue'
                }
              >
                {appInfo.environment}
              </Badge>
            </Group>
          </SimpleGrid>
        </Paper>
      )}

      {/* Clear Cache Confirmation Modal - CR-3: Added ARIA attributes */}
      <Modal
        opened={clearCacheModalOpen}
        onClose={() => setClearCacheModalOpen(false)}
        title="Clear Cache"
        centered
        aria-describedby="clear-cache-description"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="orange" id="clear-cache-description">
            This will remove cached API responses and temporary files. Your forms, photos, and
            settings will not be affected.
          </Alert>
          <Text size="sm">
            Clearing the cache may temporarily slow down the app as data is re-fetched from the
            server.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => setClearCacheModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button color="orange" onClick={handleClearCache} loading={actionLoading}>
              Clear Cache
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Clear All Data Confirmation Modal - CR-3: Added ARIA attributes */}
      <Modal
        opened={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        title="Clear All Data"
        centered
        aria-describedby="clear-all-data-description"
      >
        <Stack gap="md">
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            title="Warning"
            id="clear-all-data-description"
          >
            This action cannot be undone. All locally stored data will be permanently deleted.
          </Alert>
          <Text size="sm">This includes:</Text>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              <Text size="sm">Offline forms and submissions</Text>
            </li>
            <li>
              <Text size="sm">Cached photos and attachments</Text>
            </li>
            <li>
              <Text size="sm">User preferences and settings</Text>
            </li>
            <li>
              <Text size="sm">Sync queue and pending changes</Text>
            </li>
          </ul>
          <Text size="sm" fw={500}>
            You may need to log in again after clearing all data.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => setClearAllModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleClearAllData} loading={actionLoading}>
              Clear All Data
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
