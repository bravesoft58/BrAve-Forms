'use client';

import { useState, useCallback } from 'react';
import { Stack, Title, Group, Text, Breadcrumbs, Anchor, Skeleton } from '@mantine/core';
import { IconPhoto, IconHome, IconFolder } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PhotoGalleryGrid, Photo } from '@/components/photos';
import { PhotoFilters } from '@/components/photos/photo-filters';

/**
 * Filter state for photo gallery
 */
interface Filters {
  formType?: string;
  dateRange?: [Date, Date];
  hasGps?: boolean;
}

/**
 * Fetch project details
 */
async function fetchProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }
  return response.json();
}

/**
 * Project Photos Page - Browse photos for a specific project
 *
 * Features:
 * - Responsive grid view of project photos
 * - Filter by form type, date range, GPS
 * - Infinite scroll for large photo sets
 * - Click photo to open in lightbox (ISSUE-129)
 */
export default function ProjectPhotosPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [filters, setFilters] = useState<Filters>({});

  // Fetch project details for breadcrumb
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  // Photo click handler - will be enhanced for lightbox in ISSUE-129
  const handlePhotoClick = useCallback((_photo: Photo) => {
    // TODO: Open lightbox (ISSUE-129)
  }, []);

  const breadcrumbItems = [
    { title: 'Home', href: '/dashboard', icon: IconHome },
    { title: 'Photos', href: '/photos', icon: IconPhoto },
    { title: project?.name || 'Project', href: `/photos/${projectId}`, icon: IconFolder },
  ];

  return (
    <Stack gap="lg" p="md">
      {/* Breadcrumbs */}
      <Breadcrumbs separator=">">
        {breadcrumbItems.map((item, index) => (
          <Anchor
            key={item.href}
            component={Link}
            href={item.href}
            c={index === breadcrumbItems.length - 1 ? 'dark' : 'dimmed'}
            fw={index === breadcrumbItems.length - 1 ? 500 : 400}
          >
            <Group gap={4}>
              <item.icon size={14} />
              {projectLoading && index === breadcrumbItems.length - 1 ? (
                <Skeleton width={80} height={14} />
              ) : (
                item.title
              )}
            </Group>
          </Anchor>
        ))}
      </Breadcrumbs>

      {/* Page Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>
            {projectLoading ? (
              <Skeleton width={200} height={28} />
            ) : (
              `${project?.name || 'Project'} Photos`
            )}
          </Title>
          <Text c="dimmed" size="sm">
            Browse and manage photos for this project
          </Text>
        </div>
      </Group>

      {/* Filters */}
      <PhotoFilters filters={filters} onChange={setFilters} hideProjectFilter />

      {/* Photo Grid */}
      <PhotoGalleryGrid
        projectId={projectId}
        filters={filters}
        onPhotoClick={handlePhotoClick}
        pageSize={24}
      />
    </Stack>
  );
}
