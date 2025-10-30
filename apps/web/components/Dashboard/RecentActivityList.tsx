'use client';

import { Paper, Text, Stack, Group, ThemeIcon, Badge } from '@mantine/core';
import { IconHistory, IconFileText, IconCamera, IconClipboard } from '@tabler/icons-react';

interface ActivityItem {
  id: string;
  type: 'inspection' | 'photo' | 'form';
  projectName: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'draft';
}

// Mock data for Sprint 3 (will be replaced with real API in Sprint 4)
const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    type: 'inspection',
    projectName: 'Mill Street Construction',
    description: 'Post-Storm Inspection',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    status: 'completed',
  },
  {
    id: '2',
    type: 'photo',
    projectName: 'Rancho Road Homes',
    description: 'Site Photos Uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    status: 'completed',
  },
  {
    id: '3',
    type: 'form',
    projectName: 'Mill Street Construction',
    description: 'Daily Dust Log',
    timestamp: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
    status: 'completed',
  },
  {
    id: '4',
    type: 'inspection',
    projectName: 'Downtown Plaza',
    description: 'Weekly SWPPP Review',
    timestamp: new Date(Date.now() - 1000 * 60 * 360), // 6 hours ago
    status: 'pending',
  },
  {
    id: '5',
    type: 'form',
    projectName: 'Rancho Road Homes',
    description: 'BMP Maintenance Log',
    timestamp: new Date(Date.now() - 1000 * 60 * 480), // 8 hours ago
    status: 'draft',
  },
];

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'inspection':
      return IconClipboard;
    case 'photo':
      return IconCamera;
    case 'form':
      return IconFileText;
    default:
      return IconFileText;
  }
}

function formatTimestamp(date: Date): string {
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
  const activities = mockActivityData.slice(0, limit);

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
        {activities.length === 0 ? (
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
                        {activity.description}
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
