'use client';

// Note: Route segment config (dynamic, revalidate, etc.) cannot be used in Client Components
// Dynamic rendering is handled by client-side hooks and state

import { useState, useMemo } from 'react';
import {
  SimpleGrid,
  Stack,
  Group,
  TextInput,
  SegmentedControl,
  Button,
  Text,
  Center,
  Loader,
  Alert,
} from '@mantine/core';
import { IconSearch, IconPlus, IconFolderOff, IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useProjects } from '@/hooks/useProjects';

/**
 * Projects List Page - Sprint 3 ISSUE-085, Updated Sprint 6 ISSUE-170
 *
 * Grid view of all projects with filters (Active, Archived),
 * search by name/address, and New Project button.
 *
 * ISSUE-170: Replaced mock data with real GraphQL API calls
 *
 * Features:
 * - Responsive grid (1 col mobile, 2-3 cols desktop)
 * - Filter tabs (Active, All, Archived)
 * - Search by project name or address
 * - Loading state while fetching
 * - Error state with retry button
 * - Empty state when no projects match
 * - New Project button
 *
 * Uses aggressive compact design with explicit pixel font sizes
 * NO Route Segment Config exports (this is a Client Component)
 */
export default function ProjectsListPage() {
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  // Fetch projects from real API
  const { data: projects = [], isLoading, isError, error, refetch } = useProjects();

  // Apply filters and search
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Filter by status
    if (filter === 'active') {
      result = result.filter((p) => p.status === 'ACTIVE');
    } else if (filter === 'archived') {
      result = result.filter((p) => p.status === 'ARCHIVED' || p.status === 'CLOSED');
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.address.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [projects, filter, search]);

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
              { label: 'All', value: 'all' },
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

        {/* Loading State */}
        {isLoading && (
          <Center h={300}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed" size="14px">
                Loading projects...
              </Text>
            </Stack>
          </Center>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Failed to Load Projects"
            color="red"
            variant="light"
          >
            <Stack gap="sm">
              <Text size="13px">
                {error instanceof Error ? error.message : 'An error occurred while loading projects.'}
              </Text>
              <Button
                leftSection={<IconRefresh size={16} />}
                variant="light"
                color="red"
                size="sm"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </Stack>
          </Alert>
        )}

        {/* Projects Grid or Empty State */}
        {!isLoading && !isError && (
          <>
            {filteredProjects.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </SimpleGrid>
            )}
          </>
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
