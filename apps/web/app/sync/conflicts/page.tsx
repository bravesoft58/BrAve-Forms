'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Paper,
  Badge,
  Button,
  Table,
  ActionIcon,
  Alert,
  Loader,
  Tooltip,
  SimpleGrid,
} from '@mantine/core';
import {
  IconRefresh,
  IconTrash,
  IconEye,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconGitMerge,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { useAppAuth } from '@/app/providers';
import {
  conflictStore,
  loadConflicts,
  resolveConflict,
  deleteConflict,
  clearResolvedConflicts,
  selectConflict,
  getConflictStats,
  getConflictById,
  type SyncConflict,
  type ResolutionStrategy,
} from '@/lib/stores/conflict-store';
import { ConflictComparisonModal } from '@/components/Sync/ConflictComparisonModal';

/**
 * Get resource type display label
 */
function getResourceTypeLabel(type: SyncConflict['resourceType']): string {
  switch (type) {
    case 'form_submission':
      return 'Form';
    case 'photo':
      return 'Photo';
    case 'annotation':
      return 'Annotation';
    case 'form_update':
      return 'Update';
    default:
      return 'Unknown';
  }
}

/**
 * Get resource type badge color
 */
function getResourceTypeBadgeColor(type: SyncConflict['resourceType']): string {
  switch (type) {
    case 'form_submission':
      return 'blue';
    case 'photo':
      return 'green';
    case 'annotation':
      return 'yellow';
    case 'form_update':
      return 'violet';
    default:
      return 'gray';
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get resolution strategy label
 */
function getResolutionLabel(strategy: ResolutionStrategy): string {
  switch (strategy) {
    case 'keep_local':
      return 'Kept Local';
    case 'keep_server':
      return 'Kept Server';
    case 'merge':
      return 'Merged';
    default:
      return 'Unknown';
  }
}

export default function ConflictsPage() {
  const { orgId, userId } = useAppAuth();
  const state = useSnapshot(conflictStore);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);

  // Load conflicts on mount
  useEffect(() => {
    loadConflicts();
  }, []);

  // CRITICAL: Fail-fast validation for multi-tenant isolation
  if (!orgId || orgId.trim() === '') {
    return (
      <Container size="xl" py="md">
        <Alert color="red" icon={<IconAlertTriangle size={16} />} title="Authentication Required">
          Organization ID is required to view conflicts. Please ensure you are logged in with a
          valid organization.
        </Alert>
      </Container>
    );
  }

  // Get conflicts for current org (orgId is now guaranteed to be valid)
  const orgConflicts = state.conflicts.filter((c) => c.orgId === orgId);
  const pendingConflicts = orgConflicts.filter((c) => c.status === 'pending');
  const resolvedConflicts = orgConflicts.filter((c) => c.status === 'resolved');
  const stats = getConflictStats(orgId);

  // Handle refresh
  const handleRefresh = () => {
    loadConflicts();
  };

  // Handle view conflict
  const handleViewConflict = (conflictId: string) => {
    try {
      const conflict = getConflictById(conflictId);
      if (conflict) {
        setSelectedConflict(conflict);
        selectConflict(conflictId);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to view conflict:', error);
    }
  };

  // Handle resolve conflict
  const handleResolveConflict = (
    conflictId: string,
    strategy: ResolutionStrategy,
    mergedData?: Record<string, unknown>
  ) => {
    // Validate userId for audit trail
    if (!userId || userId.trim() === '') {
      // eslint-disable-next-line no-console
      console.error('Cannot resolve conflict: userId is required for audit trail');
      return;
    }
    try {
      resolveConflict(conflictId, strategy, userId, mergedData);
      setSelectedConflict(null);
      selectConflict(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to resolve conflict:', error);
    }
  };

  // Handle delete conflict
  const handleDeleteConflict = (conflictId: string) => {
    try {
      deleteConflict(conflictId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete conflict:', error);
    }
  };

  // Handle clear resolved
  const handleClearResolved = () => {
    try {
      clearResolvedConflicts(orgId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear resolved conflicts:', error);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setSelectedConflict(null);
    selectConflict(null);
  };

  if (state.isLoading) {
    return (
      <Container size="xl" py="md">
        <Stack align="center" gap="md" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading conflicts...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Title order={1} size="h2">
              Sync Conflicts
            </Title>
            {pendingConflicts.length > 0 && (
              <Badge color="yellow" size="lg" variant="filled">
                {pendingConflicts.length} pending
              </Badge>
            )}
          </Group>
          <Group>
            <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={handleRefresh}>
              Refresh
            </Button>
            {resolvedConflicts.length > 0 && (
              <Button
                leftSection={<IconTrash size={16} />}
                variant="light"
                color="red"
                onClick={handleClearResolved}
              >
                Clear History
              </Button>
            )}
          </Group>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Paper p="md" withBorder>
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Pending
              </Text>
              <Text size="xl" fw={700} c="yellow">
                {stats.pending}
              </Text>
            </Stack>
          </Paper>
          <Paper p="md" withBorder>
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Resolved Today
              </Text>
              <Text size="xl" fw={700} c="green">
                {stats.resolvedToday}
              </Text>
            </Stack>
          </Paper>
          <Paper p="md" withBorder>
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Total Resolved
              </Text>
              <Text size="xl" fw={700}>
                {stats.resolved}
              </Text>
            </Stack>
          </Paper>
          <Paper p="md" withBorder>
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase">
                All Time
              </Text>
              <Text size="xl" fw={700}>
                {stats.total}
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Error Alert */}
        {state.error && (
          <Alert color="red" icon={<IconAlertTriangle size={16} />}>
            {state.error}
          </Alert>
        )}

        {/* Pending Conflicts Section */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconAlertTriangle size={20} color="var(--mantine-color-yellow-6)" />
              <Title order={3} size="h4">
                Pending Conflicts
              </Title>
            </Group>

            {pendingConflicts.length === 0 ? (
              <Alert color="green" icon={<IconCheck size={16} />}>
                No pending conflicts! All data is synchronized.
              </Alert>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Detected</Table.Th>
                    <Table.Th>Differences</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingConflicts.map((conflict) => (
                    <Table.Tr key={conflict.id}>
                      <Table.Td>
                        <Badge color={getResourceTypeBadgeColor(conflict.resourceType)}>
                          {getResourceTypeLabel(conflict.resourceType)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconClock size={14} />
                          <Text size="sm">{formatTimestamp(conflict.detectedAt)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="yellow">
                          {conflict.differences.length} fields
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="View & Resolve">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleViewConflict(conflict.id)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Paper>

        {/* Resolved Conflicts History */}
        {resolvedConflicts.length > 0 && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group gap="xs">
                <IconCheck size={20} color="var(--mantine-color-green-6)" />
                <Title order={3} size="h4">
                  Resolution History
                </Title>
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Resolved</Table.Th>
                    <Table.Th>Resolution</Table.Th>
                    <Table.Th>By</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {resolvedConflicts.slice(0, 10).map((conflict) => (
                    <Table.Tr key={conflict.id}>
                      <Table.Td>
                        <Badge
                          color={getResourceTypeBadgeColor(conflict.resourceType)}
                          variant="light"
                        >
                          {getResourceTypeLabel(conflict.resourceType)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {conflict.resolution?.resolvedAt
                            ? formatTimestamp(conflict.resolution.resolvedAt)
                            : 'Unknown'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            conflict.resolution?.strategy === 'keep_local'
                              ? 'blue'
                              : conflict.resolution?.strategy === 'keep_server'
                                ? 'green'
                                : 'violet'
                          }
                          variant="light"
                          leftSection={<IconGitMerge size={12} />}
                        >
                          {conflict.resolution?.strategy
                            ? getResolutionLabel(conflict.resolution.strategy)
                            : 'Unknown'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {conflict.resolution?.resolvedBy || 'Unknown'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label="Delete from history">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteConflict(conflict.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {resolvedConflicts.length > 10 && (
                <Text size="sm" c="dimmed" ta="center">
                  Showing 10 of {resolvedConflicts.length} resolved conflicts
                </Text>
              )}
            </Stack>
          </Paper>
        )}

        {/* Legend */}
        <Paper p="md" bg="gray.0">
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Resolution Strategies:
            </Text>
            <Group gap="md">
              <Group gap="xs">
                <Badge color="blue" variant="light">
                  Keep Local
                </Badge>
                <Text size="xs" c="dimmed">
                  Use your offline changes
                </Text>
              </Group>
              <Group gap="xs">
                <Badge color="green" variant="light">
                  Keep Server
                </Badge>
                <Text size="xs" c="dimmed">
                  Use the server version
                </Text>
              </Group>
              <Group gap="xs">
                <Badge color="violet" variant="light">
                  Merge
                </Badge>
                <Text size="xs" c="dimmed">
                  Choose field-by-field
                </Text>
              </Group>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      {/* Conflict Comparison Modal */}
      {selectedConflict && (
        <ConflictComparisonModal
          conflict={selectedConflict}
          onResolve={handleResolveConflict}
          onClose={handleCloseModal}
        />
      )}
    </Container>
  );
}
