import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import React from 'react';

const TEST_TEMPLATE_ID = 'daily-log';

// Handle expected unhandled rejections from error tests in Node environment
const originalOnUnhandledRejection = process.listeners('unhandledRejection');
beforeEach(() => {
  process.removeAllListeners('unhandledRejection');
  process.on('unhandledRejection', (reason: Error) => {
    if (reason?.message !== 'Network error' && reason?.message !== 'Server error') {
      throw reason;
    }
  });
});

afterEach(() => {
  process.removeAllListeners('unhandledRejection');
  originalOnUnhandledRejection.forEach((listener) => {
    process.on('unhandledRejection', listener as (...args: unknown[]) => void);
  });
});

// Define mocks BEFORE vi.mock calls (hoisting-safe)
const mocks = {
  push: vi.fn(),
  notificationsShow: vi.fn(),
  createSubmission: vi.fn(),
  useNetworkStatus: vi.fn(() => ({ isOnline: true })),
};

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ templateId: 'daily-log' }),
  useRouter: () => ({
    push: (...args: unknown[]) => mocks.push(...args),
  }),
}));

// Mock Mantine notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mocks.notificationsShow(...args),
  },
}));

// Mock createSubmission API
vi.mock('@/lib/api/submissions', () => ({
  createSubmission: (...args: unknown[]) => mocks.createSubmission(...args),
}));

// Mock useNetworkStatus
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mocks.useNetworkStatus(),
}));

// Mock auth provider
vi.mock('@/app/providers', () => ({
  useAppAuth: () => ({
    getToken: async () => 'test-token-123',
    user: { id: 'user-1', name: 'Test User' },
    isLoaded: true,
  }),
}));

// Mock form templates data
vi.mock('@/lib/mock-data/form-templates', () => ({
  getMockFormTemplates: () => [
    {
      id: 'daily-log',
      title: 'Daily Site Log',
      description: 'Daily construction site activity log',
      category: 'Daily',
      fields: [],
    },
  ],
}));

// Mock useMediaQuery hook
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Desktop mode
}));

// Mock useFormDraft hook
vi.mock('@/lib/hooks/useFormDraft', () => ({
  useFormDraft: () => ({
    saveDraft: vi.fn(),
    loadDraft: vi.fn(),
    clearDraft: vi.fn(),
  }),
}));

// Import after mocks are set up
import FormFillPage from '../page';

// QueryClient wrapper for React Query
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return {
    ...render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </MantineProvider>
    ),
    queryClient,
  };
};

describe('FormFillPage - Offline Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to online mode
    mocks.useNetworkStatus.mockReturnValue({ isOnline: true });
    mocks.createSubmission.mockResolvedValue({
      id: 'sub-123',
      templateId: TEST_TEMPLATE_ID,
      data: {},
      status: 'SUBMITTED',
    });

    // Mock IndexedDB for offline queue functionality
    const mockDB = {
      transaction: vi.fn((_storeNames: string[], _mode: string) => ({
        objectStore: vi.fn((_name: string) => ({
          add: vi.fn().mockResolvedValue(undefined),
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
        })),
      })),
      objectStoreNames: {
        contains: vi.fn(() => true),
      },
      createObjectStore: vi.fn(),
    };

    const mockRequest = {
      result: mockDB,
      error: null,
      onsuccess: null as ((event: unknown) => void) | null,
      onerror: null as ((event: unknown) => void) | null,
      onupgradeneeded: null as ((event: unknown) => void) | null,
    };

    (global as unknown as { indexedDB: unknown }).indexedDB = {
      open: (_dbName: string, _version: number) => {
        const request = mockRequest;
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({ target: request });
          }
        }, 0);
        return request;
      },
    };
  });

  it('should queue form submission when offline', async () => {
    // Set offline state
    mocks.useNetworkStatus.mockReturnValue({ isOnline: false });

    const user = userEvent.setup();
    renderWithProviders(<FormFillPage />);

    // Fill form field
    const input = screen.getByRole('textbox', { name: /sample field/i });
    await user.type(input, 'Test value');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Verify user notified of queued submission
    // Per useSubmitForm.ts: title: 'Queued for Sync', message: 'Will submit when connection is restored', color: 'yellow'
    await waitFor(() => {
      expect(mocks.notificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Queued for Sync',
          color: 'yellow',
        })
      );
    });

    // Verify createSubmission was NOT called (queued instead)
    expect(mocks.createSubmission).not.toHaveBeenCalled();
  });

  it('should not navigate when offline submission is queued', async () => {
    // Set offline state
    mocks.useNetworkStatus.mockReturnValue({ isOnline: false });

    const user = userEvent.setup();
    renderWithProviders(<FormFillPage />);

    // Fill form field
    const input = screen.getByRole('textbox', { name: /sample field/i });
    await user.type(input, 'Test value');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Wait for notification
    await waitFor(() => {
      expect(mocks.notificationsShow).toHaveBeenCalled();
    });

    // Verify navigation was NOT called (offline submissions don't navigate)
    expect(mocks.push).not.toHaveBeenCalled();
  });

  // TECH DEBT: The following tests are skipped and tracked for Sprint 5
  // Reference: SPRINT_3_MASTER_PLAN.md - Phase 7 documentation
  // These require features that will be implemented in Sprint 5 (iOS SQLite migration)

  it.skip('should indicate offline status in UI', () => {
    // Sprint 5 Requirement: OfflineBanner component showing when navigator.onLine is false
    // Current status: Component not implemented in FormFillPage
    // Ticket: Track as part of iOS offline persistence epic
    mocks.useNetworkStatus.mockReturnValue({ isOnline: false });
    renderWithProviders(<FormFillPage />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it.skip('should sync queued submissions when back online', async () => {
    // Sprint 5 Requirement: Online event listener and automatic sync trigger
    // Current status: Basic queueing to IndexedDB works, but sync-on-reconnect not implemented
    // Dependency: iOS SQLite migration for reliable offline persistence
    expect(true).toBe(false);
  });

  it.skip('should auto-save draft every 30 seconds', async () => {
    // Sprint 5 Requirement: Timer-based auto-save verification
    // Note: FormRenderer has auto-save logic via useFormDraft
    // Testing requires: vi.useFakeTimers() and IndexedDB verification
    expect(true).toBe(false);
  });

  it.skip('should handle sync conflicts gracefully', async () => {
    // Sprint 5 Requirement: Conflict resolution UI and merge logic
    // Current status: Not implemented - critical for multi-device usage
    // Dependency: Server-side conflict detection API
    expect(true).toBe(false);
  });
});
