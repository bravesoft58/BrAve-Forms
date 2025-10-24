'use client';

import { Stack, Card, Group, Text, ActionIcon, Badge, Anchor } from '@mantine/core';
import {
  IconPlus,
  IconFolder,
  IconFiles,
  IconCloud,
  IconAlertTriangle,
  IconClipboardCheck,
} from '@tabler/icons-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface WeatherAlert {
  id: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

interface PendingTask {
  id: string;
  title: string;
  dueDate: Date;
  urgent: boolean;
}

interface DashboardNavProps {
  weatherAlerts?: WeatherAlert[];
  pendingTasks?: PendingTask[];
}

export function DashboardNav({ weatherAlerts = [], pendingTasks = [] }: DashboardNavProps) {
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getSeverityColor = (severity: 'warning' | 'critical') => {
    return severity === 'critical' ? 'red' : 'yellow';
  };

  return (
    <Stack gap="xs">
      {/* Quick Actions */}
      <Card shadow="sm" padding="sm" radius="md" withBorder>
        <Text size="13px" fw={700} mb="xs" c="dimmed">
          Quick Actions
        </Text>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            component={Link}
            href="/projects/new"
            size={40}
            radius="md"
            variant="light"
            color="blue"
            aria-label="New Project"
            title="New Project"
          >
            <IconPlus size={18} />
          </ActionIcon>
          <ActionIcon
            component={Link}
            href="/forms/new"
            size={40}
            radius="md"
            variant="light"
            color="green"
            aria-label="New Form"
            title="New Form"
          >
            <IconPlus size={18} />
          </ActionIcon>
          <ActionIcon
            component={Link}
            href="/projects"
            size={40}
            radius="md"
            variant="light"
            color="blue"
            aria-label="Projects"
            title="Projects"
          >
            <IconFolder size={18} />
          </ActionIcon>
          <ActionIcon
            component={Link}
            href="/forms"
            size={40}
            radius="md"
            variant="light"
            color="green"
            aria-label="Forms"
            title="Forms"
          >
            <IconFiles size={18} />
          </ActionIcon>
        </Group>
      </Card>

      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <Card shadow="sm" padding="sm" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="13px" fw={700} c="dimmed">
              Weather Alerts
            </Text>
            {weatherAlerts.length > 3 && (
              <Anchor component={Link} href="/weather" size="11px" fw={500} c="blue">
                View all {weatherAlerts.length} alerts
              </Anchor>
            )}
          </Group>
          <Stack gap="xs">
            {weatherAlerts.slice(0, 3).map((alert) => (
              <Group key={alert.id} gap="xs" wrap="nowrap">
                <IconCloud
                  size={16}
                  style={{
                    color:
                      getSeverityColor(alert.severity) === 'red'
                        ? 'var(--mantine-color-red-6)'
                        : 'var(--mantine-color-yellow-6)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={4} mb={2}>
                    <Badge size="xs" color={getSeverityColor(alert.severity)} variant="filled">
                      {alert.severity}
                    </Badge>
                  </Group>
                  <Text size="13px" fw={500} lineClamp={1}>
                    {alert.message}
                  </Text>
                  <Text size="11px" c="dimmed">
                    {formatRelativeTime(alert.timestamp)}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>
        </Card>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <Card shadow="sm" padding="sm" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="13px" fw={700} c="dimmed">
              Pending Tasks
            </Text>
            {pendingTasks.length > 3 && (
              <Anchor component={Link} href="/tasks" size="11px" fw={500} c="blue">
                View all {pendingTasks.length} tasks
              </Anchor>
            )}
          </Group>
          <Stack gap="xs">
            {pendingTasks.slice(0, 3).map((task) => (
              <Group key={task.id} gap="xs" wrap="nowrap">
                {task.urgent ? (
                  <IconAlertTriangle size={16} style={{ color: 'var(--mantine-color-red-6)' }} />
                ) : (
                  <IconClipboardCheck
                    size={16}
                    style={{ color: 'var(--mantine-color-orange-6)' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={4} mb={2}>
                    {task.urgent && (
                      <Badge size="xs" color="red" variant="filled">
                        urgent
                      </Badge>
                    )}
                  </Group>
                  <Text size="13px" fw={500} lineClamp={1}>
                    {task.title}
                  </Text>
                  <Text size="11px" c="dimmed">
                    Due {formatRelativeTime(task.dueDate)}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
