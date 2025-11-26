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

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  value: string | number | boolean | string[];
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

interface FormSubmission {
  id: string;
  templateName: string;
  templateCategory: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  submittedBy: string;
  submittedAt: string;
  sections: FormSection[];
}

interface SubmissionViewerProps {
  projectId: string;
}

/**
 * SubmissionViewer Component - Sprint 4 ISSUE-103
 *
 * Read-only viewer for form submissions in the inspector portal.
 * Displays submitted forms with expandable sections.
 *
 * Features:
 * - Filter by date range, template, status
 * - Accordion view of form sections
 * - Field values displayed read-only
 * - Status badges (Approved, Submitted, etc.)
 * - Submission metadata (who, when)
 */
export function SubmissionViewer({ projectId: _projectId }: SubmissionViewerProps) {
  const theme = useMantineTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mock submissions for development
  // TODO: Replace with actual GraphQL query when backend integration is complete
  const mockSubmissions: FormSubmission[] = [
    {
      id: 'sub_001',
      templateName: 'Daily Site Inspection',
      templateCategory: 'OSHA_SAFETY',
      status: 'APPROVED',
      submittedBy: 'John Inspector',
      submittedAt: '2025-11-25T14:30:00Z',
      sections: [
        {
          id: 'sec_1',
          title: 'General Information',
          fields: [
            { id: 'f1', name: 'date', label: 'Inspection Date', type: 'date', value: '2025-11-25' },
            {
              id: 'f2',
              name: 'weather',
              label: 'Weather Conditions',
              type: 'select',
              value: 'Clear',
            },
            {
              id: 'f3',
              name: 'temperature',
              label: 'Temperature (F)',
              type: 'number',
              value: 72,
            },
          ],
        },
        {
          id: 'sec_2',
          title: 'Safety Checklist',
          fields: [
            {
              id: 'f4',
              name: 'hardHats',
              label: 'Hard Hats in Use',
              type: 'checkbox',
              value: true,
            },
            {
              id: 'f5',
              name: 'safetyVests',
              label: 'Safety Vests Worn',
              type: 'checkbox',
              value: true,
            },
            {
              id: 'f6',
              name: 'hazards',
              label: 'Hazards Identified',
              type: 'textarea',
              value: 'None identified',
            },
          ],
        },
      ],
    },
    {
      id: 'sub_002',
      templateName: 'Storm Water Inspection',
      templateCategory: 'EPA_SWPPP',
      status: 'SUBMITTED',
      submittedBy: 'Jane Compliance',
      submittedAt: '2025-11-24T09:15:00Z',
      sections: [
        {
          id: 'sec_1',
          title: 'Weather Event Details',
          fields: [
            {
              id: 'f1',
              name: 'precipitation',
              label: 'Precipitation (inches)',
              type: 'number',
              value: 0.35,
            },
            {
              id: 'f2',
              name: 'stormStart',
              label: 'Storm Start Time',
              type: 'datetime',
              value: '2025-11-23T22:00:00Z',
            },
            {
              id: 'f3',
              name: 'stormEnd',
              label: 'Storm End Time',
              type: 'datetime',
              value: '2025-11-24T06:00:00Z',
            },
          ],
        },
        {
          id: 'sec_2',
          title: 'BMP Assessment',
          fields: [
            {
              id: 'f4',
              name: 'erosionControl',
              label: 'Erosion Controls Effective',
              type: 'checkbox',
              value: true,
            },
            {
              id: 'f5',
              name: 'sedimentBasin',
              label: 'Sediment Basin Status',
              type: 'select',
              value: 'Operational - 75% capacity',
            },
            {
              id: 'f6',
              name: 'correctiveActions',
              label: 'Corrective Actions Needed',
              type: 'textarea',
              value: 'Install additional silt fence along eastern boundary',
            },
          ],
        },
      ],
    },
    {
      id: 'sub_003',
      templateName: 'Weekly Stormwater Log',
      templateCategory: 'EPA_CGP',
      status: 'REVIEWED',
      submittedBy: 'Mike Supervisor',
      submittedAt: '2025-11-23T16:45:00Z',
      sections: [
        {
          id: 'sec_1',
          title: 'Weekly Summary',
          fields: [
            {
              id: 'f1',
              name: 'weekEnding',
              label: 'Week Ending',
              type: 'date',
              value: '2025-11-22',
            },
            {
              id: 'f2',
              name: 'totalRain',
              label: 'Total Rainfall (inches)',
              type: 'number',
              value: 1.25,
            },
            {
              id: 'f3',
              name: 'inspectionsCompleted',
              label: 'Inspections Completed',
              type: 'number',
              value: 3,
            },
          ],
        },
      ],
    },
  ];

  // Get status color
  const getStatusColor = (status: FormSubmission['status']) => {
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
  const getStatusIcon = (status: FormSubmission['status']) => {
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
  const formatFieldValue = (field: FormField): string => {
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

  // Empty state
  if (mockSubmissions.length === 0) {
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
          {mockSubmissions.length} submission{mockSubmissions.length !== 1 ? 's' : ''} found
        </Text>
        <Badge variant="light" color="blue">
          Last 30 days
        </Badge>
      </Group>

      {/* Submission cards */}
      {mockSubmissions.map((submission) => (
        <Card key={submission.id} shadow="xs" radius="md" withBorder p={0}>
          {/* Header - clickable to expand */}
          <Box
            p="md"
            onClick={() =>
              setExpandedId(expandedId === submission.id ? null : submission.id)
            }
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
