'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Stack,
  Button,
  TextInput,
  Select,
  Group,
  Table,
  Badge,
} from '@mantine/core';
import { findAllSubmissions } from '@/lib/api/submissions';
import { getMockFormTemplates } from '@/lib/mock-data/form-templates';
import { useCopyYesterdaysLog } from '@/hooks/useCopyYesterdaysLog';

export default function SubmissionsPage() {
  const router = useRouter();
  const copyYesterdaysLog = useCopyYesterdaysLog();

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    templateId: '',
    status: '',
    search: '',
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', filters],
    queryFn: () =>
      findAllSubmissions({
        filter: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          templateId: filters.templateId || undefined,
          status: filters.status || undefined,
        },
        search: filters.search || undefined,
        orderBy: { submittedAt: 'desc' },
      }),
  });

  const templates = getMockFormTemplates();

  // Find first daily log template for "Copy Yesterday's Log" button
  const dailyLogTemplate = useMemo(() => {
    return templates.find((t) => t.category === 'daily-logs') || templates[0];
  }, [templates]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleCopyYesterday = async () => {
    if (dailyLogTemplate) {
      await copyYesterdaysLog.mutateAsync({ templateId: dailyLogTemplate.id });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      templateId: '',
      status: '',
      search: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'gray',
      submitted: 'blue',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status.toLowerCase()] || 'gray';
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1} size="h2">
            Form Submissions
          </Title>
          <Group gap="sm">
            {dailyLogTemplate && (
              <Button
                onClick={handleCopyYesterday}
                disabled={copyYesterdaysLog.isPending}
                color="green"
                variant="light"
                size="md"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {copyYesterdaysLog.isPending ? 'Copying...' : "Copy Yesterday's Log"}
              </Button>
            )}
            <Button component={Link} href="/dashboard/forms">
              Fill New Form
            </Button>
          </Group>
        </Group>

        {/* Filters */}
        <Stack gap="md" p="md" style={{ backgroundColor: '#f7fafc', borderRadius: '8px' }}>
          <Group grow>
            <TextInput
              placeholder="Search submissions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <TextInput
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <TextInput
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
            <Select
              label="Form Template"
              placeholder="All Templates"
              data={[
                { value: '', label: 'All Templates' },
                ...templates.map((t) => ({ value: t.id, label: t.title })),
              ]}
              value={filters.templateId}
              onChange={(value) => handleFilterChange('templateId', value || '')}
            />
            <Select
              label="Status"
              placeholder="All Statuses"
              data={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value || '')}
            />
          </Group>
          <Button variant="light" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </Stack>

        {/* Submissions List */}
        {isLoading ? (
          <Text>Loading submissions...</Text>
        ) : !submissions || submissions.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text size="lg" c="dimmed">
              No submissions found
            </Text>
            <Button component={Link} href="/dashboard/forms">
              Fill your first form
            </Button>
          </Stack>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Form Name</Table.Th>
                <Table.Th>Submitted By</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {submissions.map((submission: any) => (
                <Table.Tr key={submission.id}>
                  <Table.Td>{submission.template?.name || 'Unknown'}</Table.Td>
                  <Table.Td>{submission.createdBy?.name || 'Unknown'}</Table.Td>
                  <Table.Td>
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : 'N/A'}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(submission.status)}>{submission.status}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => router.push(`/submissions/${submission.id}`)}
                    >
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Container>
  );
}
