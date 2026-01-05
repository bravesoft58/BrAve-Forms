'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { Text, Stack, Select, Button, Paper, Group, Loader, Alert } from '@mantine/core';
import { IconAlertCircle, IconClipboardCheck } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
}

/**
 * ISSUE-189: New Inspection Page
 *
 * Allows users to:
 * 1. Select a project for the inspection
 * 2. Select a form template to use
 * 3. Navigate to form fill page
 */
export default function NewInspectionPage() {
  const router = useRouter();
  const auth = useAppAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Fetch projects
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!auth.getToken) return [];
      const token = await auth.getToken();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query GetProjects {
            projects {
              id
              name
              address
            }
          }`,
        }),
      });
      const result = await response.json();
      return result.data?.projects || [];
    },
    enabled: auth.isLoaded,
  });

  // Fetch form templates
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery<FormTemplate[]>({
    queryKey: ['formTemplates'],
    queryFn: async () => {
      if (!auth.getToken) return [];
      const token = await auth.getToken();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query GetFormTemplates {
            formTemplates {
              id
              name
              description
              category
            }
          }`,
        }),
      });
      const result = await response.json();
      return result.data?.formTemplates || [];
    },
    enabled: auth.isLoaded,
  });

  const handleStartInspection = () => {
    if (selectedProject && selectedTemplate) {
      router.push(`/dashboard/forms/${selectedTemplate}/fill?projectId=${selectedProject}`);
    }
  };

  const isLoading = projectsLoading || templatesLoading;
  const error = projectsError || templatesError;

  return (
    <PageContainer
      title="New Inspection"
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Inspections', href: '/dashboard/inspections' },
            { label: 'New' },
          ]}
        />
      }
    >
      <Paper p="lg" withBorder>
        <Stack gap="lg">
          <Group gap="sm">
            <IconClipboardCheck size={24} />
            <Text fw={600} size="16px">
              Start New Inspection
            </Text>
          </Group>

          {isLoading && (
            <Stack align="center" py="lg">
              <Loader size="md" />
              <Text size="13px" c="dimmed">
                Loading projects and templates...
              </Text>
            </Stack>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              Failed to load data. Please try again.
            </Alert>
          )}

          {!isLoading && !error && (
            <>
              <Select
                label="Select Project"
                placeholder="Choose a project for this inspection"
                data={
                  projects?.map((p) => ({
                    value: p.id,
                    label: `${p.name} - ${p.address}`,
                  })) || []
                }
                value={selectedProject}
                onChange={setSelectedProject}
                searchable
                clearable
                size="md"
              />

              <Select
                label="Select Form Template"
                placeholder="Choose an inspection form"
                data={
                  templates?.map((t) => ({
                    value: t.id,
                    label: t.name,
                    description: t.category,
                  })) || []
                }
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                searchable
                clearable
                size="md"
                disabled={!selectedProject}
              />

              {selectedTemplate && templates && (
                <Paper p="sm" bg="gray.0" radius="sm">
                  <Text size="13px" c="dimmed">
                    {templates.find((t) => t.id === selectedTemplate)?.description ||
                      'No description available'}
                  </Text>
                </Paper>
              )}

              <Button
                size="md"
                onClick={handleStartInspection}
                disabled={!selectedProject || !selectedTemplate}
                fullWidth
              >
                Start Inspection
              </Button>

              {!projects?.length && (
                <Alert color="yellow" title="No Projects">
                  You need to create a project first before starting an inspection.
                  <Button
                    variant="subtle"
                    size="xs"
                    mt="xs"
                    onClick={() => router.push('/dashboard/projects/new')}
                  >
                    Create Project
                  </Button>
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </PageContainer>
  );
}
