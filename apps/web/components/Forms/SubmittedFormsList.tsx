'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack,
  Group,
  Select,
  Paper,
  Table,
  Badge,
  Text,
  Button,
  ScrollArea,
  Loader,
  Alert,
} from '@mantine/core';
import { IconForms, IconPlus, IconCalendar, IconAlertCircle } from '@tabler/icons-react';
import {
  useProjectSubmissions,
  filterSubmissionsByTemplate,
  filterSubmissionsByStatus,
  getSubmissionStatusColor,
} from '@/hooks/useFormSubmissions';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { FormSubmissionStatus } from '@brave-forms/types';

interface SubmittedFormsListProps {
  projectId: string;
}

/**
 * Submitted Forms List Component (ISSUE-089)
 *
 * Displays a list of submitted forms for a project with:
 * - Filter by template and status
 * - Sort by date (newest first)
 * - Click row to view submission details
 * - Empty state when no submissions
 * - Mobile-optimized table/cards
 *
 * Field Optimization:
 * - Large touch targets for glove-friendly use
 * - Clear visual hierarchy
 * - Explicit pixel strings for font sizes
 */
export function SubmittedFormsList({ projectId }: SubmittedFormsListProps) {
  const router = useRouter();
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<FormSubmissionStatus | 'all'>('all');

  // Fetch submissions for this project from API
  const { data: allSubmissions = [], isLoading, error } = useProjectSubmissions(projectId);

  // Fetch templates for filter dropdown from API
  const { data: templates = [], isLoading: templatesLoading } = useFormTemplates({
    isActive: true,
  });

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = allSubmissions;
    filtered = filterSubmissionsByTemplate(filtered, templateFilter);
    filtered = filterSubmissionsByStatus(filtered, statusFilter);
    return filtered;
  }, [allSubmissions, templateFilter, statusFilter]);

  const handleSubmissionClick = (submissionId: string) => {
    router.push(`/dashboard/forms/submissions/${submissionId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="14px" c="dimmed">
            Loading submissions...
          </Text>
        </Stack>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error loading submissions"
        color="red"
        variant="light"
      >
        {error instanceof Error ? error.message : 'Failed to load submissions. Please try again.'}
      </Alert>
    );
  }

  // Empty state
  if (filteredSubmissions.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <IconForms size={48} stroke={1.5} style={{ opacity: 0.3 }} />
          <Text fw={600} size="14px">
            No forms submitted yet
          </Text>
          <Text size="13px" c="dimmed" ta="center">
            {allSubmissions.length === 0
              ? 'Start by selecting a template to fill out your first form.'
              : 'No forms match your current filters.'}
          </Text>
          {allSubmissions.length === 0 && (
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                // Switch to templates tab
                const formsTab = document.querySelector('[data-testid="forms-tab-content"]');
                const templatesTab = formsTab?.querySelector('[value="templates"]') as HTMLElement;
                templatesTab?.click();
              }}
            >
              Fill Your First Form
            </Button>
          )}
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md" data-testid="submitted-forms-list">
      {/* Filters */}
      <Group gap="md" wrap="wrap">
        <Select
          placeholder="Filter by template"
          value={templateFilter}
          onChange={(value) => setTemplateFilter(value || 'all')}
          data={[
            { label: 'All Templates', value: 'all' },
            ...templates.map((template) => ({
              label: template.name,
              value: template.id,
            })),
          ]}
          clearable
          disabled={templatesLoading}
          rightSection={templatesLoading ? <Loader size="xs" /> : undefined}
          style={{ flex: 1, minWidth: '200px' }}
          size="sm"
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={(value) => setStatusFilter((value as FormSubmissionStatus | 'all') || 'all')}
          data={[
            { label: 'All Statuses', value: 'all' },
            { label: 'Draft', value: 'DRAFT' },
            { label: 'Submitted', value: 'SUBMITTED' },
            { label: 'Reviewed', value: 'REVIEWED' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
          ]}
          clearable
          style={{ flex: 1, minWidth: '200px' }}
          size="sm"
        />
      </Group>

      {/* Table - Desktop */}
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ fontSize: '13px' }}>Date</Table.Th>
              <Table.Th style={{ fontSize: '13px' }}>Form</Table.Th>
              <Table.Th style={{ fontSize: '13px' }}>Submitted By</Table.Th>
              <Table.Th style={{ fontSize: '13px' }}>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredSubmissions.map((submission) => (
              <Table.Tr
                key={submission.id}
                onClick={() => handleSubmissionClick(submission.id)}
                style={{ cursor: 'pointer' }}
                data-testid={`submission-row-${submission.id}`}
              >
                <Table.Td style={{ fontSize: '13px' }}>
                  {submission.submittedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  <Text size="11px" c="dimmed" mt={2}>
                    {submission.submittedAt.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </Table.Td>
                <Table.Td style={{ fontSize: '13px', fontWeight: 500 }}>
                  {submission.templateTitle}
                </Table.Td>
                <Table.Td style={{ fontSize: '13px' }}>{submission.submittedBy}</Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    variant="light"
                    color={getSubmissionStatusColor(submission.status)}
                  >
                    {submission.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Mobile Cards View - Hidden on desktop */}
      <Stack gap="md" display={{ base: 'flex', sm: 'none' }}>
        {filteredSubmissions.map((submission) => (
          <Paper
            key={submission.id}
            p="md"
            withBorder
            onClick={() => handleSubmissionClick(submission.id)}
            style={{ cursor: 'pointer' }}
            data-testid={`submission-card-${submission.id}`}
          >
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap">
                <Text fw={600} size="14px" lineClamp={1}>
                  {submission.templateTitle}
                </Text>
                <Badge
                  size="sm"
                  variant="light"
                  color={getSubmissionStatusColor(submission.status)}
                >
                  {submission.status}
                </Badge>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <IconCalendar size={14} style={{ opacity: 0.6 }} />
                <Text size="12px" c="dimmed">
                  {submission.submittedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </Group>
              <Text size="12px" c="dimmed">
                By {submission.submittedBy}
              </Text>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
