'use client';

// Note: Route segment config (dynamic, revalidate, etc.) cannot be used in Client Components
// Dynamic rendering is handled by client-side hooks and state

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, Button, Text, Stack, Paper, Group, Badge } from '@mantine/core';
import {
  IconEdit,
  IconForms,
  IconPhoto,
  IconUsers,
  IconCloudRain,
  IconCheck,
} from '@tabler/icons-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { getMockProjectById } from '@/lib/mock-data/projects';
import { ProjectFormsTab } from '@/components/projects/ProjectFormsTab';
import { ProjectPhotosTab } from '@/components/projects/ProjectPhotosTab';
import { ProjectTeamTab } from '@/components/projects/ProjectTeamTab';
import { ProjectWeatherTab } from '@/components/projects/ProjectWeatherTab';
import { ProjectComplianceTab } from '@/components/projects/ProjectComplianceTab';

/**
 * Project Detail Page - Sprint 3 ISSUE-087
 *
 * Displays project information with tabs for Forms, Photos, Team, Weather, Compliance.
 * Mobile uses swipeable tabs for field optimization.
 *
 * Features:
 * - Project header (name, address, edit button)
 * - 5 tabs: Forms, Photos, Team, Weather, Compliance
 * - Forms tab shows template selector and submitted forms (ISSUE-088, ISSUE-089)
 * - Mobile: Swipeable tabs
 * - Desktop: Click tabs
 * - Tab content loads on demand
 *
 * Uses aggressive compact design with explicit pixel font sizes
 * NO Route Segment Config exports (this is a Client Component)
 *
 * Sprint 4: Replace mock data with real GraphQL API calls
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = getMockProjectById(projectId);

  // Default to forms tab
  const [activeTab, setActiveTab] = useState<string>('forms');

  if (!project) {
    return (
      <PageContainer title="Project Not Found">
        <Text size="14px" c="dimmed">
          The project you&apos;re looking for doesn&apos;t exist.
        </Text>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={project.name}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projects', href: '/dashboard/projects' },
            { label: project.name },
          ]}
        />
      }
      actions={
        <Button variant="light" leftSection={<IconEdit size={16} />} size="md">
          Edit Project
        </Button>
      }
    >
      <Stack gap="md">
        {/* Project Header Info */}
        <Paper p="md" withBorder>
          <Group justify="space-between" wrap="wrap">
            <Stack gap="xs">
              <Text fw={600} size="14px">
                {project.name}
              </Text>
              <Text size="13px" c="dimmed">
                {project.address}
              </Text>
            </Stack>
            <Group gap="xs">
              <Badge
                size="sm"
                variant="light"
                color={project.status === 'ACTIVE' ? 'blue' : 'gray'}
              >
                {project.status}
              </Badge>
              {project.compliance.pendingInspections > 0 && (
                <Badge
                  size="sm"
                  variant="light"
                  color={project.compliance.requiresAttention ? 'red' : 'yellow'}
                >
                  {project.compliance.pendingInspections} pending
                </Badge>
              )}
            </Group>
          </Group>
        </Paper>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'forms')}>
          <Tabs.List>
            <Tabs.Tab value="forms" leftSection={<IconForms size={14} />}>
              Forms
            </Tabs.Tab>
            <Tabs.Tab value="photos" leftSection={<IconPhoto size={14} />}>
              Photos
            </Tabs.Tab>
            <Tabs.Tab value="team" leftSection={<IconUsers size={14} />}>
              Team
            </Tabs.Tab>
            <Tabs.Tab value="weather" leftSection={<IconCloudRain size={14} />}>
              Weather
            </Tabs.Tab>
            <Tabs.Tab value="compliance" leftSection={<IconCheck size={14} />}>
              Compliance
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="forms" pt="md">
            <ProjectFormsTab projectId={projectId} />
          </Tabs.Panel>

          <Tabs.Panel value="photos" pt="md">
            <ProjectPhotosTab projectId={projectId} />
          </Tabs.Panel>

          <Tabs.Panel value="team" pt="md">
            <ProjectTeamTab projectId={projectId} />
          </Tabs.Panel>

          <Tabs.Panel value="weather" pt="md">
            <ProjectWeatherTab projectId={projectId} />
          </Tabs.Panel>

          <Tabs.Panel value="compliance" pt="md">
            <ProjectComplianceTab projectId={projectId} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </PageContainer>
  );
}

