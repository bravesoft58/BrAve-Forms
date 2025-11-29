'use client';

import { useState } from 'react';
import {
  Modal,
  Table,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Code,
  Paper,
  Divider,
  Alert,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconGitMerge,
  IconDeviceFloppy,
  IconAlertTriangle,
  IconClock,
  IconUser,
} from '@tabler/icons-react';
import type {
  SyncConflict,
  FieldDifference,
  ResolutionStrategy,
} from '@/lib/stores/conflict-store';

interface ConflictComparisonModalProps {
  conflict: SyncConflict;
  onResolve: (
    conflictId: string,
    strategy: ResolutionStrategy,
    mergedData?: Record<string, unknown>
  ) => void;
  onClose: () => void;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Get badge color based on difference type
 */
function getDiffBadgeColor(type: FieldDifference['type']): string {
  switch (type) {
    case 'added':
      return 'green';
    case 'removed':
      return 'red';
    case 'modified':
      return 'yellow';
    default:
      return 'gray';
  }
}

/**
 * Get resource type display label
 */
function getResourceTypeLabel(type: SyncConflict['resourceType']): string {
  switch (type) {
    case 'form_submission':
      return 'Form Submission';
    case 'photo':
      return 'Photo';
    case 'annotation':
      return 'Annotation';
    case 'form_update':
      return 'Form Update';
    default:
      return 'Unknown';
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}

export function ConflictComparisonModal({
  conflict,
  onResolve,
  onClose,
}: ConflictComparisonModalProps) {
  // Track which version is selected for each field (for merge mode)
  const [fieldSelections, setFieldSelections] = useState<Record<string, 'local' | 'server'>>({});
  const [isMergeMode, setIsMergeMode] = useState(false);

  // Initialize selections with server values (default)
  const initializeMergeMode = () => {
    const selections: Record<string, 'local' | 'server'> = {};
    conflict.differences.forEach((diff) => {
      selections[diff.fieldId] = 'server';
    });
    setFieldSelections(selections);
    setIsMergeMode(true);
  };

  // Toggle field selection in merge mode
  const toggleFieldSelection = (fieldId: string) => {
    setFieldSelections((prev) => ({
      ...prev,
      [fieldId]: prev[fieldId] === 'local' ? 'server' : 'local',
    }));
  };

  // Handle Keep Local resolution
  const handleKeepLocal = () => {
    onResolve(conflict.id, 'keep_local');
    onClose();
  };

  // Handle Keep Server resolution
  const handleKeepServer = () => {
    onResolve(conflict.id, 'keep_server');
    onClose();
  };

  // Handle Merge resolution
  const handleMerge = () => {
    // Build merged data from selections
    const mergedData: Record<string, unknown> = { ...conflict.serverVersion.data };

    conflict.differences.forEach((diff) => {
      if (fieldSelections[diff.fieldId] === 'local') {
        // Use local value
        if (diff.type === 'added' || diff.type === 'modified') {
          mergedData[diff.fieldId] = diff.localValue;
        }
      } else {
        // Use server value (already in mergedData from spread)
        if (diff.type === 'removed') {
          delete mergedData[diff.fieldId];
        }
      }
    });

    onResolve(conflict.id, 'merge', mergedData);
    onClose();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="xl"
      title={
        <Group gap="sm">
          <IconAlertTriangle size={20} color="var(--mantine-color-yellow-6)" />
          <Text fw={600}>Resolve Conflict</Text>
          <Badge color="blue" variant="light">
            {getResourceTypeLabel(conflict.resourceType)}
          </Badge>
        </Group>
      }
    >
      <Stack gap="md">
        {/* Conflict Info */}
        <Paper p="sm" bg="gray.0">
          <Group justify="space-between">
            <Group gap="xs">
              <IconClock size={16} />
              <Text size="sm" c="dimmed">
                Detected: {formatTimestamp(conflict.detectedAt)}
              </Text>
            </Group>
            <Badge color={conflict.status === 'pending' ? 'yellow' : 'green'}>
              {conflict.status}
            </Badge>
          </Group>
        </Paper>

        {/* Version Headers */}
        <Group grow>
          <Paper p="sm" bg="blue.0" withBorder>
            <Stack gap="xs">
              <Group gap="xs">
                <IconDeviceFloppy size={16} />
                <Text fw={600} size="sm">
                  Local Version
                </Text>
              </Group>
              <Group gap="xs">
                <IconUser size={12} />
                <Text size="xs" c="dimmed">
                  {conflict.localVersion.modifiedBy}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {formatTimestamp(conflict.localVersion.modifiedAt)}
              </Text>
            </Stack>
          </Paper>
          <Paper p="sm" bg="green.0" withBorder>
            <Stack gap="xs">
              <Group gap="xs">
                <IconDeviceFloppy size={16} />
                <Text fw={600} size="sm">
                  Server Version
                </Text>
              </Group>
              <Group gap="xs">
                <IconUser size={12} />
                <Text size="xs" c="dimmed">
                  {conflict.serverVersion.modifiedBy}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {formatTimestamp(conflict.serverVersion.modifiedAt)}
              </Text>
            </Stack>
          </Paper>
        </Group>

        <Divider label="Field Differences" labelPosition="center" />

        {/* Differences Table */}
        {conflict.differences.length === 0 ? (
          <Alert color="gray">
            No field-level differences detected. The versions may differ only in metadata.
          </Alert>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '20%' }}>Field</Table.Th>
                <Table.Th style={{ width: '35%' }}>
                  <Group gap="xs">
                    <Badge size="xs" color="blue" variant="light">
                      Local
                    </Badge>
                  </Group>
                </Table.Th>
                <Table.Th style={{ width: '35%' }}>
                  <Group gap="xs">
                    <Badge size="xs" color="green" variant="light">
                      Server
                    </Badge>
                  </Group>
                </Table.Th>
                {isMergeMode && <Table.Th style={{ width: '10%' }}>Choose</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {conflict.differences.map((diff) => (
                <Table.Tr key={diff.fieldId}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Code fz="sm">{diff.fieldLabel}</Code>
                      <Badge size="xs" color={getDiffBadgeColor(diff.type)} variant="light">
                        {diff.type}
                      </Badge>
                    </Stack>
                  </Table.Td>
                  <Table.Td
                    style={{
                      backgroundColor:
                        isMergeMode && fieldSelections[diff.fieldId] === 'local'
                          ? 'var(--mantine-color-blue-1)'
                          : undefined,
                    }}
                  >
                    <Text size="sm" style={{ wordBreak: 'break-word' }}>
                      {formatValue(diff.localValue)}
                    </Text>
                  </Table.Td>
                  <Table.Td
                    style={{
                      backgroundColor:
                        isMergeMode && fieldSelections[diff.fieldId] === 'server'
                          ? 'var(--mantine-color-green-1)'
                          : undefined,
                    }}
                  >
                    <Text size="sm" style={{ wordBreak: 'break-word' }}>
                      {formatValue(diff.serverValue)}
                    </Text>
                  </Table.Td>
                  {isMergeMode && (
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Use Local">
                          <ActionIcon
                            size="sm"
                            variant={fieldSelections[diff.fieldId] === 'local' ? 'filled' : 'light'}
                            color="blue"
                            onClick={() => toggleFieldSelection(diff.fieldId)}
                          >
                            L
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Use Server">
                          <ActionIcon
                            size="sm"
                            variant={
                              fieldSelections[diff.fieldId] === 'server' ? 'filled' : 'light'
                            }
                            color="green"
                            onClick={() => toggleFieldSelection(diff.fieldId)}
                          >
                            S
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Divider />

        {/* Resolution Actions */}
        <Group justify="space-between">
          {isMergeMode ? (
            <>
              <Button leftSection={<IconCheck size={16} />} onClick={handleMerge} color="violet">
                Apply Merged Changes
              </Button>
              <Button variant="subtle" color="gray" onClick={() => setIsMergeMode(false)}>
                Cancel Merge
              </Button>
            </>
          ) : (
            <>
              <Group>
                <Button
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleKeepLocal}
                  color="blue"
                >
                  Keep Local
                </Button>
                <Button
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleKeepServer}
                  color="green"
                >
                  Keep Server
                </Button>
                <Button
                  leftSection={<IconGitMerge size={16} />}
                  onClick={initializeMergeMode}
                  variant="light"
                  color="violet"
                >
                  Merge
                </Button>
              </Group>
              <Button
                leftSection={<IconX size={16} />}
                onClick={onClose}
                variant="subtle"
                color="gray"
              >
                Cancel
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}

export default ConflictComparisonModal;
