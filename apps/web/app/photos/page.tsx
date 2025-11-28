'use client';

import { useState, useCallback } from 'react';
import { Stack, Title, Group, Text, Breadcrumbs, Anchor } from '@mantine/core';
import { IconPhoto, IconHome } from '@tabler/icons-react';
import Link from 'next/link';
import { PhotoGalleryGrid, Photo } from '@/components/photos';
import { PhotoFilters } from '@/components/photos/photo-filters';

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
 * All Photos Page - Browse all photos across all projects
 *
 * Features:
 * - Responsive grid view of all photos
 * - Filter by project, form type, date range, GPS
 * - Infinite scroll for large photo sets
 * - Click photo to open in lightbox (ISSUE-129)
 */
export default function AllPhotosPage() {
  const [filters, setFilters] = useState<Filters>({});

  // Photo click handler - will be enhanced for lightbox in ISSUE-129
  const handlePhotoClick = useCallback((_photo: Photo) => {
    // TODO: Open lightbox (ISSUE-129)
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

      {/* Page Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>All Photos</Title>
          <Text c="dimmed" size="sm">
            Browse and manage photos from all projects
          </Text>
        </div>
      </Group>

      {/* Filters */}
      <PhotoFilters filters={filters} onChange={setFilters} />

      {/* Photo Grid */}
      <PhotoGalleryGrid filters={filters} onPhotoClick={handlePhotoClick} pageSize={24} />
    </Stack>
  );
}
