'use client';

import { Paper, Text, Stack, Group, ThemeIcon, Badge } from '@mantine/core';
import { IconClipboardCheck } from '@tabler/icons-react';

interface PendingTask {
  id: string;
  name: string;
  projectName: string;
  dueTime: string;
  priority: 'high' | 'medium' | 'low';
}

// Mock data for Sprint 3 (will be replaced with real API in Sprint 4)
const mockPendingTasks: PendingTask[] = [
  {
    id: '1',
    name: 'Post-Storm Inspection',
    projectName: 'Mill Street Construction',
    dueTime: '2:00 PM',
    priority: 'high',
  },
  {
    id: '2',
    name: 'Weekly SWPPP Review',
    projectName: 'Rancho Road Homes',
    dueTime: '4:30 PM',
    priority: 'medium',
  },
];

export function PendingTasksList() {
  const tasks = mockPendingTasks;

  return (
    <Paper withBorder p="md" data-testid="pending-tasks-widget">
      <Group mb="xs" gap="xs">
        <ThemeIcon variant="light" color="blue" size="sm">
          <IconClipboardCheck size={14} />
        </ThemeIcon>
        <Text fw={600} size="13px">
          Pending Tasks
        </Text>
      </Group>

      <Stack gap="xs">
        {tasks.length === 0 ? (
          <Text size="13px" c="dimmed">
            No tasks due today
          </Text>
        ) : (
          tasks.map((task) => (
            <Paper key={task.id} withBorder p="xs" radius="sm">
              <Group justify="space-between" mb={4}>
                <Text size="13px" fw={500} lineClamp={1}>
                  {task.name}
                </Text>
                <Badge
                  size="xs"
                  color={
                    task.priority === 'high'
                      ? 'red'
                      : task.priority === 'medium'
                        ? 'yellow'
                        : 'gray'
                  }
                >
                  {task.priority}
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="11px" c="dimmed">
                  {task.projectName}
                </Text>
                <Text size="11px" c="dimmed">
                  •
                </Text>
                <Text size="11px" c="dimmed">
                  Due {task.dueTime}
                </Text>
              </Group>
            </Paper>
          ))
        )}
      </Stack>
    </Paper>
  );
}
