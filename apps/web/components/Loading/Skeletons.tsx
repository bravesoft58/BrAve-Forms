/**
 * Skeleton Components Library
 *
 * Professional loading states for Sprint 5 features.
 * Uses Mantine Skeleton for consistent styling.
 */

import { Skeleton, Card, SimpleGrid, Stack, Group, Paper, Box } from '@mantine/core';

/**
 * Photo Gallery Grid Skeleton
 * Displays 8 photo card placeholders in a responsive grid
 */
export interface PhotoGallerySkeletonProps {
  /** Number of skeleton cards to display */
  count?: number;
  /** Number of columns per breakpoint */
  cols?: { base?: number; sm?: number; md?: number; lg?: number };
}

export function PhotoGallerySkeleton({
  count = 8,
  cols = { base: 1, sm: 2, md: 3, lg: 4 },
}: PhotoGallerySkeletonProps) {
  return (
    <SimpleGrid cols={cols} data-testid="photo-gallery-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} withBorder data-testid="photo-skeleton-card">
          <Skeleton height={200} radius="md" mb="xs" />
          <Skeleton height={16} width="70%" mb="xs" />
          <Skeleton height={12} width="50%" />
        </Card>
      ))}
    </SimpleGrid>
  );
}

/**
 * Map View Skeleton
 * Displays a large placeholder for map loading
 */
export interface MapViewSkeletonProps {
  /** Height of the map skeleton */
  height?: number | string;
}

export function MapViewSkeleton({ height = 400 }: MapViewSkeletonProps) {
  return (
    <Card withBorder data-testid="map-view-skeleton">
      <Skeleton height={height} radius="md" />
    </Card>
  );
}

/**
 * Sync Queue Table Skeleton
 * Displays pending sync items as skeleton rows
 */
export interface SyncQueueSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
}

export function SyncQueueSkeleton({ rows = 5 }: SyncQueueSkeletonProps) {
  return (
    <Stack gap="xs" data-testid="sync-queue-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} withBorder padding="md" data-testid="sync-skeleton-row">
          <Group justify="space-between">
            <Group gap="sm">
              <Skeleton height={20} width={20} circle />
              <Stack gap={4}>
                <Skeleton height={16} width={180} />
                <Skeleton height={12} width={120} />
              </Stack>
            </Group>
            <Group gap="sm">
              <Skeleton height={24} width={80} radius="xl" />
              <Skeleton height={12} width={60} />
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

/**
 * Settings Form Skeleton
 * Displays form field placeholders
 */
export interface SettingsFormSkeletonProps {
  /** Number of form fields to display */
  fields?: number;
  /** Whether to show a submit button skeleton */
  showButton?: boolean;
}

export function SettingsFormSkeleton({ fields = 5, showButton = true }: SettingsFormSkeletonProps) {
  return (
    <Stack gap="md" data-testid="settings-form-skeleton">
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} data-testid="settings-skeleton-field">
          <Skeleton height={14} width={100} mb="xs" />
          <Skeleton height={36} radius="sm" />
        </Box>
      ))}
      {showButton && <Skeleton height={36} width={120} radius="sm" />}
    </Stack>
  );
}

/**
 * Dashboard Stats Skeleton
 * Displays stat cards placeholders
 */
export interface DashboardStatsSkeletonProps {
  /** Number of stat cards to display */
  count?: number;
}

export function DashboardStatsSkeleton({ count = 4 }: DashboardStatsSkeletonProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} data-testid="dashboard-stats-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <Paper key={index} p="md" withBorder data-testid="stats-skeleton-card">
          <Group justify="space-between" mb="xs">
            <Skeleton height={14} width={80} />
            <Skeleton height={24} width={24} circle />
          </Group>
          <Skeleton height={32} width={60} mb="xs" />
          <Skeleton height={12} width={100} />
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/**
 * Table Skeleton
 * Generic table loading state
 */
export interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns to display */
  columns?: number;
  /** Whether to show header row */
  showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 4, showHeader = true }: TableSkeletonProps) {
  return (
    <Stack gap="xs" data-testid="table-skeleton">
      {showHeader && (
        <Group gap="md" p="xs" data-testid="table-skeleton-header">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height={14} width={`${100 / columns - 2}%`} />
          ))}
        </Group>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Group key={rowIndex} gap="md" p="xs" data-testid="table-skeleton-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={16} width={`${100 / columns - 2}%`} />
          ))}
        </Group>
      ))}
    </Stack>
  );
}

/**
 * Card List Skeleton
 * Generic card list loading state
 */
export interface CardListSkeletonProps {
  /** Number of cards to display */
  count?: number;
  /** Whether cards should display horizontally */
  horizontal?: boolean;
}

export function CardListSkeleton({ count = 3, horizontal = false }: CardListSkeletonProps) {
  const cards = Array.from({ length: count }).map((_, index) => (
    <Card key={index} withBorder padding="md" data-testid="card-list-skeleton-item">
      {horizontal ? (
        <Group gap="md" wrap="nowrap">
          <Skeleton height={60} width={60} radius="md" />
          <Stack gap="xs" style={{ flex: 1 }}>
            <Skeleton height={16} width="70%" />
            <Skeleton height={12} width="50%" />
          </Stack>
        </Group>
      ) : (
        <Stack gap="xs">
          <Skeleton height={120} radius="md" />
          <Skeleton height={16} width="80%" />
          <Skeleton height={12} width="60%" />
        </Stack>
      )}
    </Card>
  ));

  return (
    <Stack gap="md" data-testid="card-list-skeleton">
      {cards}
    </Stack>
  );
}

/**
 * Profile Skeleton
 * User profile loading state
 */
export function ProfileSkeleton() {
  return (
    <Stack gap="lg" data-testid="profile-skeleton">
      <Group gap="lg">
        <Skeleton height={80} width={80} circle />
        <Stack gap="xs" style={{ flex: 1 }}>
          <Skeleton height={24} width={200} />
          <Skeleton height={14} width={150} />
        </Stack>
      </Group>
      <SettingsFormSkeleton fields={4} showButton={false} />
    </Stack>
  );
}

/**
 * Inspection Details Skeleton
 * Inspection detail page loading state
 */
export function InspectionDetailsSkeleton() {
  return (
    <Stack gap="lg" data-testid="inspection-details-skeleton">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Skeleton height={28} width={300} />
          <Skeleton height={14} width={200} />
        </Stack>
        <Skeleton height={36} width={120} radius="sm" />
      </Group>

      {/* Status and Info */}
      <Paper p="md" withBorder>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Stack key={index} gap="xs">
              <Skeleton height={12} width={60} />
              <Skeleton height={20} width={100} />
            </Stack>
          ))}
        </SimpleGrid>
      </Paper>

      {/* Photos */}
      <Paper p="md" withBorder>
        <Skeleton height={20} width={100} mb="md" />
        <PhotoGallerySkeleton count={4} cols={{ base: 2, sm: 2, md: 4 }} />
      </Paper>
    </Stack>
  );
}
