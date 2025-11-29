/**
 * Tests for SyncStatusDashboard page
 *
 * Tests the sync status dashboard display with:
 * - Current sync status display
 * - Last sync and next sync timestamps
 * - Sync statistics display
 * - Storage usage display
 * - 30-day offline countdown
 * - Warning alerts for low storage and offline expiration
 *
 * @security Tests verify proper loading and error states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import React from 'react';

// Define mocks before vi.mock calls
const mockUseSyncDashboard = vi.fn();

// Mock the useSyncStatus hook
vi.mock('@/hooks/useSyncStatus', () => ({
  useSyncDashboard: () => mockUseSyncDashboard(),
  calculateOfflineDaysRemaining: (lastSync: Date | string | null): number => {
    if (!lastSync) return 30;
    const lastSyncDate = typeof lastSync === 'string' ? new Date(lastSync) : lastSync;
    const daysSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 30 - Math.floor(daysSinceSync));
  },
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  },
}));

// Mock Mantine hooks
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: () => false,
}));

// Import after mocks
import SyncStatusPage from '../page';

// Default mock data for success state
const createMockData = (overrides = {}) => ({
  syncStatus: {
    data: {
      status: 'synced',
      lastSync: '2025-11-28T10:00:00Z',
      nextSync: '2025-11-28T10:15:00Z',
      isOnline: true,
    },
    isLoading: false,
    isError: false,
    isFetching: false,
  },
  stats: {
    data: {
      formsSyncedToday: 12,
      photosUploadedToday: 45,
      pendingItems: 3,
      failedItems: 0,
    },
    isLoading: false,
    isError: false,
    isFetching: false,
  },
  storage: {
    data: {
      used: 52428800, // 50 MB
      available: 1073741824, // 1 GB
    },
    isLoading: false,
    isError: false,
    isFetching: false,
  },
  offlineDaysRemaining: 25,
  isLoading: false,
  isError: false,
  ...overrides,
});

// Test wrapper
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MantineProvider>
  );
};

describe('SyncStatusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSyncDashboard.mockReturnValue(createMockData());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page layout', () => {
    it('renders page title correctly', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByRole('heading', { name: /sync status/i })).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  describe('Current status display', () => {
    it('displays synced status correctly', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('SYNCED')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('displays syncing status correctly', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          syncStatus: {
            data: {
              status: 'syncing',
              lastSync: '2025-11-28T10:00:00Z',
              nextSync: null,
              isOnline: true,
            },
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('SYNCING')).toBeInTheDocument();
    });

    it('displays offline status correctly', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          syncStatus: {
            data: {
              status: 'offline',
              lastSync: '2025-11-28T10:00:00Z',
              nextSync: null,
              isOnline: false,
            },
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('displays error status correctly', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          syncStatus: {
            data: {
              status: 'error',
              lastSync: '2025-11-28T10:00:00Z',
              nextSync: null,
              isOnline: true,
            },
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });
  });

  describe('Timestamp display', () => {
    it('displays last sync timestamp', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('Last Sync')).toBeInTheDocument();
      // The timestamp will be formatted to locale string
    });

    it('displays next sync timestamp', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('Next Auto-Sync')).toBeInTheDocument();
    });

    it('displays Never when no last sync', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          syncStatus: {
            data: {
              status: 'synced',
              lastSync: null,
              nextSync: null,
              isOnline: true,
            },
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getAllByText('Never').length).toBeGreaterThan(0);
    });
  });

  describe('Sync statistics', () => {
    it('displays forms synced today', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('Forms Synced')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays photos uploaded today', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('Photos Uploaded')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('displays pending items', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('Pending Items')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays failed items', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('Failed Items')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Storage display', () => {
    it('displays storage usage', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText('Local Storage')).toBeInTheDocument();
      expect(screen.getByText(/50\.00 MB/)).toBeInTheDocument();
    });

    it('displays storage percentage', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText(/% used/)).toBeInTheDocument();
    });

    it('displays 30-day countdown', () => {
      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText(/30-day offline capacity/)).toBeInTheDocument();
      expect(screen.getByText(/25 days remaining/)).toBeInTheDocument();
    });
  });

  describe('Warning alerts', () => {
    it('shows offline countdown warning when less than 7 days', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          offlineDaysRemaining: 5,
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText(/Offline Sync Warning/)).toBeInTheDocument();
      // Use getAllByText since the days remaining appears in multiple places (badge, countdown, alert)
      expect(screen.getAllByText(/5 days remaining/).length).toBeGreaterThan(0);
    });

    it('shows expired warning when 0 days remaining', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          offlineDaysRemaining: 0,
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText(/Offline Period Expired/)).toBeInTheDocument();
    });

    it('shows low storage warning when over 90% used', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          storage: {
            data: {
              used: 966367642, // ~90% of 1GB
              available: 1073741824,
            },
            isLoading: false,
            isError: false,
            isFetching: false,
          },
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText(/Low Storage Warning/)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading state', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          isLoading: true,
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText(/Loading sync status/)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error state', () => {
      mockUseSyncDashboard.mockReturnValue(
        createMockData({
          isError: true,
        })
      );

      render(<SyncStatusPage />, { wrapper });

      expect(screen.getByText(/Error loading sync status/)).toBeInTheDocument();
    });
  });
});
