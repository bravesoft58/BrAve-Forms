'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Paper,
  Select,
  Switch,
  Divider,
  Button,
  Progress,
  Badge,
} from '@mantine/core';
import {
  IconCloudUpload,
  IconClock,
  IconDatabase,
  IconPhoto,
  IconWifi,
  IconRefresh,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import {
  settingsStore,
  setSyncInterval,
  setDataRetention,
  setPhotoQuality,
  setSyncOnWifiOnly,
  resetOfflineSettings,
  type SyncInterval,
  type RetentionPeriod,
  type PhotoQuality,
} from '@/lib/stores/settings-store';

/**
 * Offline & Sync Settings Page
 *
 * Configure offline storage, sync intervals, and data retention.
 */
export default function OfflinePage() {
  const settings = useSnapshot(settingsStore);

  const syncIntervalOptions = [
    { value: '5', label: 'Every 5 minutes' },
    { value: '15', label: 'Every 15 minutes' },
    { value: '30', label: 'Every 30 minutes' },
    { value: '60', label: 'Every hour' },
  ];

  const retentionOptions = [
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days (Recommended)' },
  ];

  const photoQualityOptions = [
    { value: 'original', label: 'Original (Largest file size)' },
    { value: 'high', label: 'High (Recommended)' },
    { value: 'medium', label: 'Medium (Balanced)' },
    { value: 'low', label: 'Low (Fastest uploads)' },
  ];

  // Mock storage usage - in real implementation, this would come from IndexedDB/SQLite
  const storageUsed = 245; // MB
  const storageTotal = 500; // MB
  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} size="h2">
              Offline & Sync
            </Title>
            <Text c="dimmed" size="sm">
              Configure how data is stored and synchronized
            </Text>
          </div>
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={resetOfflineSettings}
          >
            Reset to Defaults
          </Button>
        </Group>

        {/* Storage Usage */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <IconDatabase size={20} />
                <Title order={3} size="h4">
                  Storage Usage
                </Title>
              </Group>
              <Badge
                color={storagePercentage > 80 ? 'red' : storagePercentage > 50 ? 'yellow' : 'green'}
              >
                {storageUsed} MB / {storageTotal} MB
              </Badge>
            </Group>

            <Progress
              value={storagePercentage}
              color={storagePercentage > 80 ? 'red' : storagePercentage > 50 ? 'yellow' : 'green'}
              size="lg"
              radius="xl"
            />

            <Text size="xs" c="dimmed">
              Offline data includes forms, photos, and sync queue. Older data will be automatically
              cleaned based on your retention settings.
            </Text>
          </Stack>
        </Paper>

        {/* Auto-Sync Interval */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconClock size={20} />
              <Title order={3} size="h4">
                Auto-Sync Interval
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              How often to automatically sync data when connected to the internet.
            </Text>

            <Select
              value={String(settings.offline.autoSyncInterval)}
              onChange={(value) => value && setSyncInterval(Number(value) as SyncInterval)}
              data={syncIntervalOptions}
              placeholder="Select sync interval"
            />

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <IconWifi size={18} />
                  <Text fw={500}>Sync on Wi-Fi Only</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Only sync when connected to Wi-Fi to save mobile data
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.offline.syncOnWifiOnly}
                onChange={(e) => setSyncOnWifiOnly(e.currentTarget.checked)}
              />
            </Group>
          </Stack>
        </Paper>

        {/* Data Retention */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconDatabase size={20} />
              <Title order={3} size="h4">
                Data Retention
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              How long to keep offline data before automatically removing it. EPA compliance
              requires 30-day retention for field operations.
            </Text>

            <Select
              value={String(settings.offline.dataRetention)}
              onChange={(value) => value && setDataRetention(Number(value) as RetentionPeriod)}
              data={retentionOptions}
              placeholder="Select retention period"
            />

            <Text size="xs" c="dimmed">
              Note: Synced data is permanently stored on the server. This setting only affects local
              offline storage.
            </Text>
          </Stack>
        </Paper>

        {/* Photo Quality */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconPhoto size={20} />
              <Title order={3} size="h4">
                Photo Quality
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Quality setting for photos captured in the field. Lower quality uses less storage and
              uploads faster.
            </Text>

            <Select
              value={settings.offline.photoQuality}
              onChange={(value) => value && setPhotoQuality(value as PhotoQuality)}
              data={photoQualityOptions}
              placeholder="Select photo quality"
            />

            <Divider />

            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Estimated Storage per Photo
              </Text>
              <Group gap="md">
                <Badge variant="light" color="gray">
                  Original: ~4 MB
                </Badge>
                <Badge variant="light" color="blue">
                  High: ~2 MB
                </Badge>
                <Badge variant="light" color="green">
                  Medium: ~1 MB
                </Badge>
                <Badge variant="light" color="yellow">
                  Low: ~0.5 MB
                </Badge>
              </Group>
            </Stack>
          </Stack>
        </Paper>

        {/* Sync Status */}
        <Paper p="lg" withBorder bg="gray.0">
          <Stack gap="md">
            <Group gap="xs">
              <IconCloudUpload size={20} />
              <Title order={3} size="h4">
                Sync Status
              </Title>
            </Group>

            <Group justify="space-between">
              <Text size="sm">Items pending sync:</Text>
              <Badge color="green">0</Badge>
            </Group>

            <Group justify="space-between">
              <Text size="sm">Last sync:</Text>
              <Text size="sm" c="dimmed">
                Just now
              </Text>
            </Group>

            <Button leftSection={<IconCloudUpload size={16} />} variant="light" fullWidth>
              Sync Now
            </Button>
          </Stack>
        </Paper>

        {/* Last Updated */}
        {settings.lastUpdated && (
          <Text size="xs" c="dimmed" ta="center">
            Settings last updated: {new Date(settings.lastUpdated).toLocaleString()}
          </Text>
        )}
      </Stack>
    </Container>
  );
}
