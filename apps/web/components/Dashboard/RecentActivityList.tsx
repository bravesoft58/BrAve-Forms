'use client';

import { Paper, Text, Stack, Group, ThemeIcon, Badge, Skeleton } from '@mantine/core';
import { IconHistory, IconFileText, IconCamera, IconClipboard } from '@tabler/icons-react';
import { useRecentActivity, RecentActivity } from '@/hooks/useDashboard';

function getActivityIcon(type: RecentActivity['type']) {
  switch (type) {
    case 'inspection':
      return IconClipboard;
    case 'photo':
      return IconCamera;
    case 'submission':
      return IconFileText;
    default:
      return IconFileText;
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

interface RecentActivityListProps {
  limit?: number;
}

export function RecentActivityList({ limit = 5 }: RecentActivityListProps) {
  const { data: activities, isLoading, error } = useRecentActivity(limit);

  return (
    <Paper withBorder p="md" data-testid="recent-activity-widget">
      <Group mb="xs" gap="xs">
        <ThemeIcon variant="light" color="blue" size="sm">
          <IconHistory size={14} />
        </ThemeIcon>
        <Text fw={600} size="13px">
          Recent Activity
        </Text>
      </Group>

      <Stack gap="xs">
        {isLoading ? (
          <>
            <Skeleton height={60} radius="sm" />
            <Skeleton height={60} radius="sm" />
            <Skeleton height={60} radius="sm" />
          </>
        ) : error ? (
          <Text size="13px" c="red">
            Failed to load activity
          </Text>
        ) : !activities || activities.length === 0 ? (
          <Text size="13px" c="dimmed">
            No recent activity
          </Text>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <Paper key={activity.id} withBorder p="xs" radius="sm">
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon variant="light" color="gray" size="sm">
                    <Icon size={12} />
                  </ThemeIcon>
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Group justify="space-between">
                      <Text size="13px" fw={500} lineClamp={1}>
                        {activity.title}
                      </Text>
                      <Badge
                        size="xs"
                        color={
                          activity.status === 'completed'
                            ? 'green'
                            : activity.status === 'pending'
                              ? 'yellow'
                              : 'gray'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </Group>
                    <Group gap="xs">
                      <Text size="11px" c="dimmed">
                        {activity.projectName}
                      </Text>
                      <Text size="11px" c="dimmed">
                        •
                      </Text>
                      <Text size="11px" c="dimmed">
                        {formatTimestamp(activity.timestamp)}
                      </Text>
                    </Group>
                  </Stack>
                </Group>
              </Paper>
            );
          })
        )}
      </Stack>
    </Paper>
  );
}
