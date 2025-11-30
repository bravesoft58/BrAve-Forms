'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Paper,
  Switch,
  Divider,
  Button,
  TextInput,
  Alert,
  Loader,
} from '@mantine/core';
import {
  IconMail,
  IconBell,
  IconCloud,
  IconCalendar,
  IconFileDescription,
  IconChartBar,
  IconRefresh,
  IconMoon,
  IconSend,
  IconCheck,
  IconCloudUpload,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import {
  settingsStore,
  updateNotificationSetting,
  resetNotificationSettings,
  setQuietHoursEnabled,
  setQuietHoursStartTime,
  setQuietHoursEndTime,
  type NotificationSettings,
} from '@/lib/stores/settings-store';
import {
  useMyPreferences,
  useUpdateNotificationPreferences,
  getNotificationPrefsFromBackend,
} from '@/hooks/useUserPreferences';
import type { NotificationPreferencesInput } from '@/lib/api/user-preferences';

/**
 * Notifications Settings Page
 *
 * ISSUE-173: Configure email and push notification preferences with quiet hours support.
 * Settings sync to backend for cross-device consistency.
 */
export default function NotificationsPage() {
  const settings = useSnapshot(settingsStore);
  const [testSent, setTestSent] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Backend sync hooks
  const { data: backendPrefs, isLoading: loadingPrefs } = useMyPreferences();
  const updateBackendMutation = useUpdateNotificationPreferences();

  // Sync local store with backend on initial load
  useEffect(() => {
    if (backendPrefs) {
      const backendNotifs = getNotificationPrefsFromBackend(backendPrefs);
      // Update local store with backend values
      updateNotificationSetting('emailWeatherAlerts', backendNotifs.emailWeatherAlerts ?? true);
      updateNotificationSetting('emailInspectionReminders', backendNotifs.emailInspectionReminders ?? true);
      updateNotificationSetting('emailFormConfirmations', backendNotifs.emailFormConfirmations ?? true);
      updateNotificationSetting('emailWeeklySummary', backendNotifs.emailWeeklySummary ?? false);
      updateNotificationSetting('pushRealTimeAlerts', backendNotifs.pushRealTimeAlerts ?? true);
      updateNotificationSetting('pushInspectionReminders', backendNotifs.pushInspectionReminders ?? true);
      setQuietHoursEnabled(backendNotifs.quietHoursEnabled ?? false);
      if (backendNotifs.quietHoursStart) setQuietHoursStartTime(backendNotifs.quietHoursStart);
      if (backendNotifs.quietHoursEnd) setQuietHoursEndTime(backendNotifs.quietHoursEnd);
    }
  }, [backendPrefs]);

  /**
   * Sync current local settings to backend
   */
  const syncToBackend = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);

    const input: NotificationPreferencesInput = {
      emailWeatherAlerts: settings.notifications.emailWeatherAlerts,
      emailInspectionReminders: settings.notifications.emailInspectionReminders,
      emailFormConfirmations: settings.notifications.emailFormConfirmations,
      emailWeeklySummary: settings.notifications.emailWeeklySummary,
      pushRealTimeAlerts: settings.notifications.pushRealTimeAlerts,
      pushInspectionReminders: settings.notifications.pushInspectionReminders,
      quietHoursEnabled: settings.notifications.quietHours.enabled,
      quietHoursStart: settings.notifications.quietHours.startTime,
      quietHoursEnd: settings.notifications.quietHours.endTime,
    };

    try {
      await updateBackendMutation.mutateAsync(input);
    } catch (error) {
      setSyncError('Failed to sync settings to server. Changes saved locally.');
    } finally {
      setSyncing(false);
    }
  }, [settings.notifications, updateBackendMutation]);

  /**
   * Send a test notification to verify settings are working
   * STUB: Backend notification service not yet implemented.
   */
  const sendTestNotification = async () => {
    // STUB: Backend API not yet implemented
    // TODO: Connect to POST /api/notifications/test when backend is ready
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Show loading state while fetching preferences
  if (loadingPrefs) {
    return (
      <Container size="md" py="xl">
        <Stack gap="lg" align="center">
          <Loader size="lg" />
          <Text c="dimmed">Loading preferences...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} size="h2">
              Notifications
            </Title>
            <Text c="dimmed" size="sm">
              Configure how you receive alerts and updates
            </Text>
          </div>
          <Group>
            <Button
              variant="filled"
              leftSection={syncing ? <Loader size={14} color="white" /> : <IconCloudUpload size={16} />}
              onClick={syncToBackend}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync to Cloud'}
            </Button>
            <Button
              variant="outline"
              leftSection={<IconSend size={16} />}
              onClick={sendTestNotification}
              disabled={testSent}
            >
              {testSent ? 'Test Sent' : 'Test Notification'}
            </Button>
            <Button
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={resetNotificationSettings}
            >
              Reset
            </Button>
          </Group>
        </Group>

        {/* Sync Error Alert */}
        {syncError && (
          <Alert
            color="orange"
            title="Sync Warning"
            withCloseButton
            onClose={() => setSyncError(null)}
          >
            {syncError}
          </Alert>
        )}

        {/* Test Notification Alert */}
        {testSent && (
          <Alert
            icon={<IconCheck size={16} />}
            title="Test notification sent"
            color="green"
            withCloseButton
            onClose={() => setTestSent(false)}
          >
            Check your email and device for the test notification.
          </Alert>
        )}

        {/* Email Notifications */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconMail size={20} />
              <Title order={3} size="h4">
                Email Notifications
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Receive important updates and alerts via email.
            </Text>

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <IconCloud size={18} />
                  <Text fw={500}>Weather Alerts</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Get notified when rain exceeds 0.25 inches (EPA compliance trigger)
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.notifications.emailWeatherAlerts}
                onChange={(e) =>
                  updateNotificationSetting('emailWeatherAlerts', e.currentTarget.checked)
                }
              />
            </Group>

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <IconCalendar size={18} />
                  <Text fw={500}>Inspection Reminders</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Reminders for upcoming and overdue inspections
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.notifications.emailInspectionReminders}
                onChange={(e) =>
                  updateNotificationSetting('emailInspectionReminders', e.currentTarget.checked)
                }
              />
            </Group>

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <IconFileDescription size={18} />
                  <Text fw={500}>Form Confirmations</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Confirmation emails when forms are submitted
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.notifications.emailFormConfirmations}
                onChange={(e) =>
                  updateNotificationSetting('emailFormConfirmations', e.currentTarget.checked)
                }
              />
            </Group>

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <IconChartBar size={18} />
                  <Text fw={500}>Weekly Summary</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Weekly digest of compliance status and activities
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.notifications.emailWeeklySummary}
                onChange={(e) =>
                  updateNotificationSetting('emailWeeklySummary', e.currentTarget.checked)
                }
              />
            </Group>
          </Stack>
        </Paper>

        {/* Push Notifications */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconBell size={20} />
              <Title order={3} size="h4">
                Push Notifications
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Real-time alerts on your device. Requires browser/app permissions.
            </Text>

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <IconCloud size={18} />
                  <Text fw={500}>Real-Time Weather Alerts</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Instant notifications when weather conditions change
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.notifications.pushRealTimeAlerts}
                onChange={(e) =>
                  updateNotificationSetting('pushRealTimeAlerts', e.currentTarget.checked)
                }
              />
            </Group>

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <IconCalendar size={18} />
                  <Text fw={500}>Inspection Due Reminders</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Push reminders when inspections are due soon
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.notifications.pushInspectionReminders}
                onChange={(e) =>
                  updateNotificationSetting('pushInspectionReminders', e.currentTarget.checked)
                }
              />
            </Group>
          </Stack>
        </Paper>

        {/* Quiet Hours */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconMoon size={20} />
              <Title order={3} size="h4">
                Quiet Hours
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Pause non-critical notifications during off-hours. Critical compliance alerts (weather
              events, inspection deadlines) will always be delivered.
            </Text>

            <Divider />

            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text fw={500}>Enable Quiet Hours</Text>
                <Text size="xs" c="dimmed">
                  Suppress notifications during specified hours
                </Text>
              </div>
              <Switch
                size="lg"
                checked={settings.notifications.quietHours.enabled}
                onChange={(e) => setQuietHoursEnabled(e.currentTarget.checked)}
              />
            </Group>

            {settings.notifications.quietHours.enabled && (
              <>
                <Divider />

                <Group grow>
                  <TextInput
                    label="Start Time"
                    description="When quiet hours begin"
                    type="time"
                    value={settings.notifications.quietHours.startTime}
                    onChange={(e) => setQuietHoursStartTime(e.currentTarget.value)}
                  />
                  <TextInput
                    label="End Time"
                    description="When quiet hours end"
                    type="time"
                    value={settings.notifications.quietHours.endTime}
                    onChange={(e) => setQuietHoursEndTime(e.currentTarget.value)}
                  />
                </Group>

                <Text size="xs" c="dimmed">
                  Example: 10:00 PM to 7:00 AM means no non-critical notifications overnight.
                </Text>
              </>
            )}
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
