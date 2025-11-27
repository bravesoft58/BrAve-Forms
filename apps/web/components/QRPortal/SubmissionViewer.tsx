'use client';

import { useState } from 'react';
import {
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Accordion,
  Paper,
  Center,
  ThemeIcon,
  Divider,
  ActionIcon,
  Collapse,
  Tooltip,
  Box,
  Loader,
  Alert,
  useMantineTheme,
} from '@mantine/core';
import {
  IconClipboardList,
  IconCalendar,
  IconUser,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconEye,
  IconFileDescription,
} from '@tabler/icons-react';
import {
  useInspectorSubmissions,
  InspectorSubmission,
  InspectorFormField,
} from '@/hooks/useInspectorPortal';

interface SubmissionViewerProps {
  projectId: string;
  token: string;
}

/**
 * SubmissionViewer Component - Sprint 4 ISSUE-103, Updated Sprint 5 ISSUE-165
 *
 * Read-only viewer for form submissions in the inspector portal.
 * Now fetches real data from the backend API.
 *
 * Features:
 * - Accordion view of form sections
 * - Field values displayed read-only
 * - Status badges (Approved, Submitted, etc.)
 * - Submission metadata (who, when)
 * - Loading and error states
 */
export function SubmissionViewer({ projectId: _projectId, token }: SubmissionViewerProps) {
  const theme = useMantineTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: submissions, isLoading, error } = useInspectorSubmissions(token);

  // Get status color
  const getStatusColor = (status: InspectorSubmission['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'green';
      case 'SUBMITTED':
        return 'blue';
      case 'REVIEWED':
        return 'cyan';
      case 'REJECTED':
        return 'red';
      case 'DRAFT':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Get status icon
  const getStatusIcon = (status: InspectorSubmission['status']) => {
    switch (status) {
      case 'APPROVED':
        return <IconCheck size={12} />;
      case 'SUBMITTED':
        return <IconClock size={12} />;
      case 'REVIEWED':
        return <IconEye size={12} />;
      case 'REJECTED':
        return <IconAlertCircle size={12} />;
      default:
        return <IconFileDescription size={12} />;
    }
  };

  // Format field value for display
  const formatFieldValue = (field: InspectorFormField): string => {
    if (field.value === null || field.value === undefined) return '-';

    switch (field.type) {
      case 'checkbox':
        return field.value ? 'Yes' : 'No';
      case 'date':
        return new Date(field.value as string).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      case 'datetime':
        return new Date(field.value as string).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'number':
        return String(field.value);
      default:
        return String(field.value);
    }
  };

  // Category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EPA_SWPPP':
      case 'EPA_CGP':
        return 'teal';
      case 'OSHA_SAFETY':
        return 'orange';
      case 'STATE_PERMIT':
        return 'violet';
      default:
        return 'gray';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading submissions...</Text>
        </Stack>
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={20} />}
        title="Failed to load submissions"
        color="red"
        variant="light"
      >
        {error.message || 'Unable to load form submissions. Please try again.'}
      </Alert>
    );
  }

  // Empty state
  if (!submissions || submissions.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <ThemeIcon size={48} variant="light" color="gray" radius="xl">
            <IconClipboardList size={24} />
          </ThemeIcon>
          <Text c="dimmed" ta="center">
            No form submissions found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Submissions will appear here once forms are completed
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {/* Submissions count */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} found
        </Text>
        <Badge variant="light" color="blue">
          Last 30 days
        </Badge>
      </Group>

      {/* Submission cards */}
      {submissions.map((submission) => (
        <Card key={submission.id} shadow="xs" radius="md" withBorder p={0}>
          {/* Header - clickable to expand */}
          <Box
            p="md"
            onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
            style={{ cursor: 'pointer' }}
          >
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Stack gap={4}>
                <Group gap="xs">
                  <Text fw={600} size="sm">
                    {submission.templateName}
                  </Text>
                  <Badge
                    size="xs"
                    variant="light"
                    color={getCategoryColor(submission.templateCategory)}
                  >
                    {submission.templateCategory.replace('_', ' ')}
                  </Badge>
                </Group>
                <Group gap="md">
                  <Group gap={4}>
                    <IconUser size={12} color={theme.colors.gray[5]} />
                    <Text size="xs" c="dimmed">
                      {submission.submittedBy}
                    </Text>
                  </Group>
                  <Group gap={4}>
                    <IconCalendar size={12} color={theme.colors.gray[5]} />
                    <Text size="xs" c="dimmed">
                      {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </Group>
                </Group>
              </Stack>
              <Group gap="xs">
                <Badge
                  size="sm"
                  variant="light"
                  color={getStatusColor(submission.status)}
                  leftSection={getStatusIcon(submission.status)}
                >
                  {submission.status}
                </Badge>
                <Tooltip label={expandedId === submission.id ? 'Collapse' : 'Expand'}>
                  <ActionIcon variant="subtle" color="gray">
                    {expandedId === submission.id ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Box>

          {/* Expanded content */}
          <Collapse in={expandedId === submission.id}>
            <Divider />
            <Box p="md" bg="gray.0">
              <Accordion variant="separated" radius="md">
                {submission.sections.map((section) => (
                  <Accordion.Item key={section.id} value={section.id}>
                    <Accordion.Control>
                      <Text size="sm" fw={500}>
                        {section.title}
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="sm">
                        {section.fields.map((field) => (
                          <Paper key={field.id} p="xs" radius="sm" withBorder>
                            <Group justify="space-between" wrap="wrap">
                              <Text size="xs" c="dimmed">
                                {field.label}
                              </Text>
                              <Text size="sm" fw={500}>
                                {formatFieldValue(field)}
                              </Text>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Box>
          </Collapse>
        </Card>
      ))}
    </Stack>
  );
}
