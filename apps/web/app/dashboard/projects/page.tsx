'use client';

// Note: Route segment config (dynamic, revalidate, etc.) cannot be used in Client Components
// Dynamic rendering is handled by client-side hooks and state

import { useState } from 'react';
import {
  SimpleGrid,
  Stack,
  Group,
  TextInput,
  SegmentedControl,
  Button,
  Text,
  Center,
} from '@mantine/core';
import { IconSearch, IconPlus, IconFolderOff } from '@tabler/icons-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getMockProjects, filterProjectsByStatus, searchProjects } from '@/lib/mock-data/projects';

/**
 * Projects List Page - Sprint 3 ISSUE-085
 *
 * Grid view of all projects with filters (Active, Favorites, Archived),
 * search by name/address, and New Project button.
 *
 * Features:
 * - Responsive grid (1 col mobile, 2-3 cols desktop)
 * - Filter tabs (Active, Favorites, Archived)
 * - Search by project name or address
 * - Empty state when no projects match
 * - New Project button
 *
 * Uses aggressive compact design with explicit pixel font sizes
 * NO Route Segment Config exports (this is a Client Component)
 *
 * Sprint 4: Replace mock data with real GraphQL API calls
 */
export default function ProjectsListPage() {
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  // Get all projects
  const allProjects = getMockProjects();

  // Apply filters and search
  const filteredProjects = searchProjects(filterProjectsByStatus(allProjects, filter), search);

  return (
    <PageContainer
      title="Projects"
      breadcrumbs={
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Projects' }]} />
      }
      actions={
        <Button leftSection={<IconPlus size={18} />} size="md">
          New Project
        </Button>
      }
    >
      <Stack gap="md">
        {/* Filters and Search */}
        <Group gap="md" wrap="wrap">
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            data={[
              { label: 'Active', value: 'active' },
              { label: 'Favorites', value: 'favorites' },
              { label: 'Archived', value: 'archived' },
            ]}
            size="sm"
          />
          <TextInput
            placeholder="Search projects..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
            size="sm"
          />
        </Group>

        {/* Projects Grid or Empty State */}
        {filteredProjects.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </PageContainer>
  );
}

/**
 * Empty State Component
 *
 * Shows when no projects match current filter/search
 *
 * Font sizes: "14px" heading, "13px" message
 * (Explicit pixel strings to prevent ISSUE-157 font bug)
 */
function EmptyState({ search }: { search: string }) {
  return (
    <Center py="xl" data-testid="empty-state">
      <Stack align="center" gap="md">
        <IconFolderOff size={48} stroke={1.5} style={{ opacity: 0.3 }} />
        <Text fw={600} size="14px">
          No projects found
        </Text>
        <Text size="13px" c="dimmed" ta="center">
          {search
            ? 'Try adjusting your search or filter'
            : 'Create your first project to get started'}
        </Text>
        {!search && (
          <Button leftSection={<IconPlus size={18} />} size="sm" mt="xs">
            New Project
          </Button>
        )}
      </Stack>
    </Center>
  );
}
