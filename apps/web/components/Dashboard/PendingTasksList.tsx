'use client';

import { Paper, Text, Stack, Group, ThemeIcon, Badge, Skeleton } from '@mantine/core';
import { IconClipboardCheck } from '@tabler/icons-react';
import { usePendingTasks } from '@/hooks/useDashboard';

export function PendingTasksList() {
  const { data: tasks, isLoading, error } = usePendingTasks();

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
        {isLoading ? (
          <>
            <Skeleton height={50} radius="sm" />
            <Skeleton height={50} radius="sm" />
          </>
        ) : error ? (
          <Text size="13px" c="red">
            Failed to load tasks
          </Text>
        ) : !tasks || tasks.length === 0 ? (
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
