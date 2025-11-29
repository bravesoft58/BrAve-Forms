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
  Divider,
  Button,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconCalendar,
  IconRuler,
  IconRefresh,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import {
  settingsStore,
  setTheme,
  setDateFormat,
  setUnits,
  resetDisplaySettings,
  type ThemeMode,
  type DateFormat,
  type MeasurementUnits,
} from '@/lib/stores/settings-store';

/**
 * Display Settings Page
 *
 * Configure theme, date format, and measurement units.
 */
export default function DisplayPage() {
  const settings = useSnapshot(settingsStore);

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  ];

  const unitOptions = [
    { value: 'imperial', label: 'Imperial (inches, feet)' },
    { value: 'metric', label: 'Metric (mm, meters)' },
  ];

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} size="h2">
              Display
            </Title>
            <Text c="dimmed" size="sm">
              Customize the appearance of the application
            </Text>
          </div>
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={resetDisplaySettings}
          >
            Reset to Defaults
          </Button>
        </Group>

        {/* Theme */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              {settings.display.theme === 'dark' ? (
                <IconMoon size={20} />
              ) : settings.display.theme === 'light' ? (
                <IconSun size={20} />
              ) : (
                <IconDeviceDesktop size={20} />
              )}
              <Title order={3} size="h4">
                Theme
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Choose your preferred color scheme. System will match your device settings.
            </Text>

            <SegmentedControl
              value={settings.display.theme}
              onChange={(value) => setTheme(value as ThemeMode)}
              data={themeOptions}
              fullWidth
            />
          </Stack>
        </Paper>

        {/* Date Format */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconCalendar size={20} />
              <Title order={3} size="h4">
                Date Format
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Choose how dates are displayed throughout the application.
            </Text>

            <Select
              value={settings.display.dateFormat}
              onChange={(value) => value && setDateFormat(value as DateFormat)}
              data={dateFormatOptions}
              placeholder="Select date format"
            />

            <Text size="xs" c="dimmed">
              Example:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </Text>
          </Stack>
        </Paper>

        {/* Measurement Units */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconRuler size={20} />
              <Title order={3} size="h4">
                Measurement Units
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Choose your preferred measurement system for rain and distance values.
            </Text>

            <SegmentedControl
              value={settings.display.units}
              onChange={(value) => setUnits(value as MeasurementUnits)}
              data={unitOptions}
              fullWidth
            />

            <Divider />

            <Stack gap="xs">
              <Text size="sm" fw={500}>
                EPA Rain Threshold Display
              </Text>
              <Text size="xs" c="dimmed">
                {settings.display.units === 'imperial'
                  ? 'Rain events will be shown in inches. EPA threshold: 0.25 inches'
                  : 'Rain events will be shown in millimeters. EPA threshold: 6.35 mm'}
              </Text>
            </Stack>
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
