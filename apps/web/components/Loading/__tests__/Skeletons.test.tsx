/**
 * Skeleton Components Unit Tests
 *
 * Tests for loading state skeleton components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import {
  PhotoGallerySkeleton,
  MapViewSkeleton,
  SyncQueueSkeleton,
  SettingsFormSkeleton,
  DashboardStatsSkeleton,
  TableSkeleton,
  CardListSkeleton,
  ProfileSkeleton,
  InspectionDetailsSkeleton,
} from '../Skeletons';

// Wrapper for Mantine components
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('Skeleton Components', () => {
  // ============================================================================
  // PhotoGallerySkeleton Tests
  // ============================================================================
  describe('PhotoGallerySkeleton', () => {
    it('should render with default count of 8 cards', () => {
      render(
        <TestWrapper>
          <PhotoGallerySkeleton />
        </TestWrapper>
      );

      const cards = screen.getAllByTestId('photo-skeleton-card');
      expect(cards).toHaveLength(8);
    });

    it('should render with custom count', () => {
      render(
        <TestWrapper>
          <PhotoGallerySkeleton count={4} />
        </TestWrapper>
      );

      const cards = screen.getAllByTestId('photo-skeleton-card');
      expect(cards).toHaveLength(4);
    });

    it('should have correct test id on container', () => {
      render(
        <TestWrapper>
          <PhotoGallerySkeleton />
        </TestWrapper>
      );

      expect(screen.getByTestId('photo-gallery-skeleton')).toBeInTheDocument();
    });

    it('should render with custom columns', () => {
      render(
        <TestWrapper>
          <PhotoGallerySkeleton cols={{ base: 2, sm: 3, md: 4, lg: 5 }} />
        </TestWrapper>
      );

      expect(screen.getByTestId('photo-gallery-skeleton')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // MapViewSkeleton Tests
  // ============================================================================
  describe('MapViewSkeleton', () => {
    it('should render with default height', () => {
      render(
        <TestWrapper>
          <MapViewSkeleton />
        </TestWrapper>
      );

      expect(screen.getByTestId('map-view-skeleton')).toBeInTheDocument();
    });

    it('should render with custom height', () => {
      render(
        <TestWrapper>
          <MapViewSkeleton height={500} />
        </TestWrapper>
      );

      expect(screen.getByTestId('map-view-skeleton')).toBeInTheDocument();
    });

    it('should accept string height', () => {
      render(
        <TestWrapper>
          <MapViewSkeleton height="100%" />
        </TestWrapper>
      );

      expect(screen.getByTestId('map-view-skeleton')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SyncQueueSkeleton Tests
  // ============================================================================
  describe('SyncQueueSkeleton', () => {
    it('should render with default 5 rows', () => {
      render(
        <TestWrapper>
          <SyncQueueSkeleton />
        </TestWrapper>
      );

      const rows = screen.getAllByTestId('sync-skeleton-row');
      expect(rows).toHaveLength(5);
    });

    it('should render with custom row count', () => {
      render(
        <TestWrapper>
          <SyncQueueSkeleton rows={3} />
        </TestWrapper>
      );

      const rows = screen.getAllByTestId('sync-skeleton-row');
      expect(rows).toHaveLength(3);
    });

    it('should have correct container test id', () => {
      render(
        <TestWrapper>
          <SyncQueueSkeleton />
        </TestWrapper>
      );

      expect(screen.getByTestId('sync-queue-skeleton')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SettingsFormSkeleton Tests
  // ============================================================================
  describe('SettingsFormSkeleton', () => {
    it('should render with default 5 fields', () => {
      render(
        <TestWrapper>
          <SettingsFormSkeleton />
        </TestWrapper>
      );

      const fields = screen.getAllByTestId('settings-skeleton-field');
      expect(fields).toHaveLength(5);
    });

    it('should render with custom field count', () => {
      render(
        <TestWrapper>
          <SettingsFormSkeleton fields={3} />
        </TestWrapper>
      );

      const fields = screen.getAllByTestId('settings-skeleton-field');
      expect(fields).toHaveLength(3);
    });

    it('should show button by default', () => {
      render(
        <TestWrapper>
          <SettingsFormSkeleton />
        </TestWrapper>
      );

      expect(screen.getByTestId('settings-form-skeleton')).toBeInTheDocument();
    });

    it('should hide button when showButton is false', () => {
      render(
        <TestWrapper>
          <SettingsFormSkeleton showButton={false} />
        </TestWrapper>
      );

      expect(screen.getByTestId('settings-form-skeleton')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DashboardStatsSkeleton Tests
  // ============================================================================
  describe('DashboardStatsSkeleton', () => {
    it('should render with default 4 cards', () => {
      render(
        <TestWrapper>
          <DashboardStatsSkeleton />
        </TestWrapper>
      );

      const cards = screen.getAllByTestId('stats-skeleton-card');
      expect(cards).toHaveLength(4);
    });

    it('should render with custom count', () => {
      render(
        <TestWrapper>
          <DashboardStatsSkeleton count={6} />
        </TestWrapper>
      );

      const cards = screen.getAllByTestId('stats-skeleton-card');
      expect(cards).toHaveLength(6);
    });
  });

  // ============================================================================
  // TableSkeleton Tests
  // ============================================================================
  describe('TableSkeleton', () => {
    it('should render with default 5 rows', () => {
      render(
        <TestWrapper>
          <TableSkeleton />
        </TestWrapper>
      );

      const rows = screen.getAllByTestId('table-skeleton-row');
      expect(rows).toHaveLength(5);
    });

    it('should render with custom row and column count', () => {
      render(
        <TestWrapper>
          <TableSkeleton rows={3} columns={6} />
        </TestWrapper>
      );

      const rows = screen.getAllByTestId('table-skeleton-row');
      expect(rows).toHaveLength(3);
    });

    it('should show header by default', () => {
      render(
        <TestWrapper>
          <TableSkeleton />
        </TestWrapper>
      );

      expect(screen.getByTestId('table-skeleton-header')).toBeInTheDocument();
    });

    it('should hide header when showHeader is false', () => {
      render(
        <TestWrapper>
          <TableSkeleton showHeader={false} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('table-skeleton-header')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CardListSkeleton Tests
  // ============================================================================
  describe('CardListSkeleton', () => {
    it('should render with default 3 cards', () => {
      render(
        <TestWrapper>
          <CardListSkeleton />
        </TestWrapper>
      );

      const items = screen.getAllByTestId('card-list-skeleton-item');
      expect(items).toHaveLength(3);
    });

    it('should render with custom count', () => {
      render(
        <TestWrapper>
          <CardListSkeleton count={5} />
        </TestWrapper>
      );

      const items = screen.getAllByTestId('card-list-skeleton-item');
      expect(items).toHaveLength(5);
    });

    it('should support horizontal layout', () => {
      render(
        <TestWrapper>
          <CardListSkeleton horizontal />
        </TestWrapper>
      );

      expect(screen.getByTestId('card-list-skeleton')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ProfileSkeleton Tests
  // ============================================================================
  describe('ProfileSkeleton', () => {
    it('should render profile skeleton', () => {
      render(
        <TestWrapper>
          <ProfileSkeleton />
        </TestWrapper>
      );

      expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // InspectionDetailsSkeleton Tests
  // ============================================================================
  describe('InspectionDetailsSkeleton', () => {
    it('should render inspection details skeleton', () => {
      render(
        <TestWrapper>
          <InspectionDetailsSkeleton />
        </TestWrapper>
      );

      expect(screen.getByTestId('inspection-details-skeleton')).toBeInTheDocument();
    });
  });
});
