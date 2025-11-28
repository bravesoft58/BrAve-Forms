'use client';

import { useState, useCallback } from 'react';
import {
  Stack,
  Title,
  Group,
  Text,
  Breadcrumbs,
  Anchor,
  SegmentedControl,
  Center,
} from '@mantine/core';
import { IconPhoto, IconHome, IconLayoutGrid, IconMap } from '@tabler/icons-react';
import Link from 'next/link';
import { PhotoGalleryGrid, PhotoMapView, Photo } from '@/components/photos';
import { PhotoFilters } from '@/components/photos/photo-filters';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

/**
 * Filter state for photo gallery
 */
interface Filters {
  projectId?: string;
  formType?: string;
  dateRange?: [Date, Date];
  hasGps?: boolean;
}

/**
 * View mode for photos display
 */
type ViewMode = 'grid' | 'map';

/**
 * Fetch photos for map view
 */
async function fetchAllPhotos(filters?: Filters): Promise<Photo[]> {
  const params = new URLSearchParams();
  params.set('take', '100'); // Get more photos for map view

  if (filters?.projectId) {
    params.set('projectId', filters.projectId);
  }
  if (filters?.formType) {
    params.set('formType', filters.formType);
  }
  if (filters?.hasGps !== undefined) {
    params.set('hasGps', String(filters.hasGps));
  }
  if (filters?.dateRange) {
    params.set('startDate', filters.dateRange[0].toISOString());
    params.set('endDate', filters.dateRange[1].toISOString());
  }

  const response = await fetch(`/api/photos?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch photos: ${response.statusText}`);
  }
  const data = await response.json();
  return data.photos || [];
}

/**
 * All Photos Page - Browse all photos across all projects
 *
 * Features:
 * - Toggle between grid and map view
 * - Responsive grid view of all photos
 * - Interactive map with GPS photo markers
 * - Filter by project, form type, date range, GPS
 * - Infinite scroll for large photo sets (grid mode)
 * - Click photo to open in lightbox
 */
export default function AllPhotosPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { orgId } = useAuth();

  // Fetch photos for map view
  const { data: mapPhotos = [] } = useInfiniteQuery({
    queryKey: ['photos', 'all', orgId, filters],
    queryFn: () => fetchAllPhotos(filters),
    getNextPageParam: () => undefined,
    initialPageParam: 0,
    enabled: viewMode === 'map',
    networkMode: 'offlineFirst',
    staleTime: 1000 * 60 * 60, // 1 hour
    select: (data) => data.pages.flat(),
  });

  // Photo click handler - lightbox handles display in grid mode
  const handlePhotoClick = useCallback((_photo: Photo) => {
    // In map mode, this could open lightbox or navigate
  }, []);

  const breadcrumbItems = [
    { title: 'Home', href: '/dashboard', icon: IconHome },
    { title: 'Photos', href: '/photos', icon: IconPhoto },
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
              {item.title}
            </Group>
          </Anchor>
        ))}
      </Breadcrumbs>

      {/* Page Header with View Toggle */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Title order={2}>All Photos</Title>
          <Text c="dimmed" size="sm">
            Browse and manage photos from all projects
          </Text>
        </div>

        {/* View Mode Toggle */}
        <SegmentedControl
          value={viewMode}
          onChange={(value) => setViewMode(value as ViewMode)}
          data={[
            {
              value: 'grid',
              label: (
                <Center style={{ gap: 6 }}>
                  <IconLayoutGrid size={16} />
                  <span>Grid</span>
                </Center>
              ),
            },
            {
              value: 'map',
              label: (
                <Center style={{ gap: 6 }}>
                  <IconMap size={16} />
                  <span>Map</span>
                </Center>
              ),
            },
          ]}
          aria-label="View mode toggle"
        />
      </Group>

      {/* Filters */}
      <PhotoFilters filters={filters} onChange={setFilters} />

      {/* Photo View - Grid or Map */}
      {viewMode === 'grid' ? (
        <PhotoGalleryGrid filters={filters} onPhotoClick={handlePhotoClick} pageSize={24} />
      ) : (
        <PhotoMapView photos={mapPhotos} onPhotoClick={handlePhotoClick} />
      )}
    </Stack>
  );
}
