'use client';

import { Stack, Group, Title, Box, Skeleton, rem } from '@mantine/core';
import { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  breadcrumbs?: ReactNode; // Slot for Breadcrumbs component (ISSUE-083)
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

/**
 * PageContainer Component
 *
 * Reusable page layout component providing consistent structure across all pages.
 *
 * Features:
 * - Page title with compact sizing (16px, font-weight 600)
 * - Optional breadcrumbs slot (for ISSUE-083 integration)
 * - Optional action buttons area (top-right)
 * - Loading skeleton states
 * - Responsive mobile/desktop layout
 *
 * Design: Compact sizing (13-16px text) following ISSUE-078 standards
 */
export function PageContainer({
  title,
  breadcrumbs,
  actions,
  children,
  loading = false,
}: PageContainerProps) {
  return (
    <Stack gap="md">
      {/* Breadcrumbs slot (optional) */}
      {breadcrumbs && <Box>{breadcrumbs}</Box>}

      {/* Page header with title and actions */}
      <Group justify="space-between" align="center">
        <Title
          order={2}
          style={{
            fontSize: rem(16),
            fontWeight: 600,
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {title}
        </Title>

        {/* Action buttons area (optional) */}
        {actions && (
          <Group gap="xs" wrap="nowrap">
            {actions}
          </Group>
        )}
      </Group>

      {/* Main content area with loading state */}
      <Box>
        {loading ? (
          <Stack gap="sm">
            <Skeleton height={rem(120)} radius="sm" />
            <Skeleton height={rem(80)} radius="sm" />
            <Skeleton height={rem(100)} radius="sm" />
          </Stack>
        ) : (
          children
        )}
      </Box>
    </Stack>
  );
}
