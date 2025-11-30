'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Button,
} from '@mantine/core';
import { IconWorld, IconClock, IconLanguage, IconRefresh } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import {
  settingsStore,
  setTimezone,
  setTimeFormat,
  setLanguage,
  resetAccountSettings,
  type TimeFormat,
  type Language,
} from '@/lib/stores/settings-store';

/**
 * Common US timezones for construction sites
 */
const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (AST)' },
];

/**
 * Account Settings Page
 *
 * Configure timezone, time format, and language preferences.
 */
export default function AccountPage() {
  const settings = useSnapshot(settingsStore);

  const timeFormatOptions = [
    { value: '12h', label: '12-hour (1:30 PM)' },
    { value: '24h', label: '24-hour (13:30)' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
  ];

  /**
   * Get current time preview in selected format
   */
  const getTimePreview = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: settings.account.timeFormat === '12h',
      timeZone: settings.account.timezone,
    };
    try {
      return now.toLocaleTimeString('en-US', options);
    } catch {
      return now.toLocaleTimeString('en-US', { ...options, timeZone: 'America/New_York' });
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} size="h2">
              Account
            </Title>
            <Text c="dimmed" size="sm">
              Configure regional and language preferences
            </Text>
          </div>
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={resetAccountSettings}
          >
            Reset to Defaults
          </Button>
        </Group>

        {/* Timezone */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconWorld size={20} />
              <Title order={3} size="h4">
                Timezone
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Select your local timezone for accurate scheduling and inspection deadlines.
            </Text>

            <Select
              value={settings.account.timezone}
              onChange={(value) => value && setTimezone(value)}
              data={timezoneOptions}
              placeholder="Select timezone"
              searchable
            />

            <Text size="xs" c="dimmed">
              EPA inspection windows are calculated based on your timezone setting.
            </Text>
          </Stack>
        </Paper>

        {/* Time Format */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconClock size={20} />
              <Title order={3} size="h4">
                Time Format
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Choose how times are displayed throughout the application.
            </Text>

            <SegmentedControl
              value={settings.account.timeFormat}
              onChange={(value) => setTimeFormat(value as TimeFormat)}
              data={timeFormatOptions}
              fullWidth
            />

            <Text size="xs" c="dimmed">
              Current time: {getTimePreview()}
            </Text>
          </Stack>
        </Paper>

        {/* Language */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconLanguage size={20} />
              <Title order={3} size="h4">
                Language
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Select your preferred language for the interface.
            </Text>

            <SegmentedControl
              value={settings.account.language}
              onChange={(value) => setLanguage(value as Language)}
              data={languageOptions}
              fullWidth
            />

            <Text size="xs" c="dimmed">
              {settings.account.language === 'es'
                ? 'La interfaz se mostrara en espanol.'
                : 'The interface will be displayed in English.'}
            </Text>
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
