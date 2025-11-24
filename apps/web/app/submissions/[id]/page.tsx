'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import { Container, Title, Text, Stack, Button, Group, Badge, Image, Paper } from '@mantine/core';
import { findSubmissionById } from '@/lib/api/submissions';
import { UseAsTemplateDialog } from './UseAsTemplateDialog';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAppAuth();
  const submissionId = params.id as string;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: async () => {
      const token = auth.getToken ? await auth.getToken() : 'dev-token-123';
      return findSubmissionById(submissionId, token);
    },
    enabled: !!submissionId && !submissionId.startsWith('offline-') && auth.isLoaded,
  });

  if (isLoading) {
    return (
      <Container size="xl" py="md">
        <Text>Loading submission...</Text>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container size="xl" py="md">
        <Stack gap="md">
          <Title order={1} size="h2">
            Submission Not Found
          </Title>
          <Text c="dimmed">
            The submission you&apos;re looking for doesn&apos;t exist or may be queued for sync.
          </Text>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Stack>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'gray',
      submitted: 'blue',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status.toLowerCase()] || 'gray';
  };

  const template = submission.template;
  const formData = submission.data || {};

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Button variant="light" onClick={() => router.back()}>
              ← Back
            </Button>
            <Title order={1} size="h2">
              {template?.name || 'Submission'}
            </Title>
            <Badge color={getStatusColor(submission.status)} size="lg">
              {submission.status}
            </Badge>
          </Group>
        </Group>

        {/* Metadata */}
        <Paper p="md" style={{ backgroundColor: '#f7fafc' }}>
          <Stack gap="xs">
            <Group>
              <Text size="sm" fw={600} c="dimmed">
                Submitted By:
              </Text>
              <Text size="sm">{submission.createdBy?.name || 'Unknown'}</Text>
            </Group>
            <Group>
              <Text size="sm" fw={600} c="dimmed">
                Submitted At:
              </Text>
              <Text size="sm">
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
              </Text>
            </Group>
            {template?.version && (
              <Group>
                <Text size="sm" fw={600} c="dimmed">
                  Template Version:
                </Text>
                <Text size="sm">{template.version}</Text>
              </Group>
            )}
          </Stack>
        </Paper>

        {/* Form Data */}
        {template?.schema?.sections ? (
          <Stack gap="lg">
            {template.schema.sections.map((section: any) => (
              <Paper key={section.id} p="md" shadow="sm">
                <Title order={2} size="h3" mb="md">
                  {section.title}
                </Title>
                <Stack gap="md">
                  {section.fields?.map((field: any) => {
                    const value = formData[field.id];

                    return (
                      <div key={field.id}>
                        <Text size="sm" fw={500} mb="xs">
                          {field.label}
                        </Text>
                        <div>
                          {field.type === 'photo' && value ? (
                            <Image
                              src={value}
                              alt={field.label}
                              width={200}
                              height={200}
                              fit="cover"
                              radius="md"
                            />
                          ) : field.type === 'signature' && value ? (
                            <Image
                              src={value}
                              alt="Signature"
                              width={300}
                              height={100}
                              fit="contain"
                              radius="md"
                            />
                          ) : (
                            <Text size="sm" c={value ? undefined : 'dimmed'}>
                              {value || 'N/A'}
                            </Text>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Paper p="md">
            <Text c="dimmed">No form data available</Text>
          </Paper>
        )}

        {/* Actions */}
        <Group>
          <Button onClick={() => window.print()}>Print</Button>
          <Button variant="light" onClick={() => setIsDialogOpen(true)}>
            Use as Template
          </Button>
        </Group>

        {/* Use as Template Dialog */}
        <UseAsTemplateDialog
          submissionId={submissionId}
          templateId={submission.templateId}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </Stack>
    </Container>
  );
}
