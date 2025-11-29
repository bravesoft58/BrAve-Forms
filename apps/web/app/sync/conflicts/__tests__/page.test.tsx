import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import ConflictsPage from '../page';
import { resetConflictStore, addConflict, type ConflictVersion } from '@/lib/stores/conflict-store';

// Mock useAppAuth hook
const mockOrgId = 'org_test123';
const mockUserId = 'user_test123';

vi.mock('@/app/providers', () => ({
  useAppAuth: () => ({
    orgId: mockOrgId,
    userId: mockUserId,
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Wrapper with MantineProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe('ConflictsPage', () => {
  beforeEach(() => {
    resetConflictStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should render the page title', () => {
    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Sync Conflicts')).toBeInTheDocument();
  });

  it('should show refresh button', () => {
    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should display statistics cards', () => {
    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Resolved Today')).toBeInTheDocument();
    expect(screen.getByText('Total Resolved')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should show empty state when no conflicts', () => {
    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    expect(screen.getByText(/no pending conflicts/i)).toBeInTheDocument();
    expect(screen.getByText(/all data is synchronized/i)).toBeInTheDocument();
  });

  it('should display pending conflicts when they exist', async () => {
    // Add a conflict first
    const localVersion: ConflictVersion = {
      data: { name: 'Local Name' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    };

    const serverVersion: ConflictVersion = {
      data: { name: 'Server Name' },
      modifiedAt: '2025-11-28T11:00:00Z',
      modifiedBy: 'user2',
      version: 2,
    };

    addConflict('res_123', 'form_submission', localVersion, serverVersion, mockOrgId);

    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Form')).toBeInTheDocument();
    });
  });

  it('should show pending badge with count', async () => {
    const version: ConflictVersion = {
      data: { name: 'Test' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    };

    addConflict('res_1', 'form_submission', version, version, mockOrgId);
    addConflict('res_2', 'photo', version, version, mockOrgId);

    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('2 pending')).toBeInTheDocument();
    });
  });

  it('should display resolution strategies legend', () => {
    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Resolution Strategies:')).toBeInTheDocument();
    expect(screen.getByText('Keep Local')).toBeInTheDocument();
    expect(screen.getByText('Keep Server')).toBeInTheDocument();
    expect(screen.getByText(/^merge$/i)).toBeInTheDocument();
  });

  it('should show different resource type badges', async () => {
    const version: ConflictVersion = {
      data: { name: 'Test' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    };

    addConflict('res_1', 'form_submission', version, version, mockOrgId);
    addConflict('res_2', 'photo', version, version, mockOrgId);
    addConflict('res_3', 'annotation', version, version, mockOrgId);

    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Form')).toBeInTheDocument();
      expect(screen.getByText('Photo')).toBeInTheDocument();
      expect(screen.getByText('Annotation')).toBeInTheDocument();
    });
  });

  it('should open modal when clicking view button', async () => {
    const localVersion: ConflictVersion = {
      data: { name: 'Local' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    };

    const serverVersion: ConflictVersion = {
      data: { name: 'Server' },
      modifiedAt: '2025-11-28T11:00:00Z',
      modifiedBy: 'user2',
      version: 2,
    };

    addConflict('res_123', 'form_submission', localVersion, serverVersion, mockOrgId);

    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const viewButton = screen.getByRole('button', { name: /view & resolve/i });
      fireEvent.click(viewButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Resolve Conflict')).toBeInTheDocument();
    });
  });

  it('should filter conflicts by organization', async () => {
    const version: ConflictVersion = {
      data: { name: 'Test' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    };

    // Add conflict for current org
    addConflict('res_1', 'form_submission', version, version, mockOrgId);
    // Add conflict for different org
    addConflict('res_2', 'form_submission', version, version, 'other_org');

    render(
      <TestWrapper>
        <ConflictsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should only show badge for current org's conflict
      expect(screen.getByText('1 pending')).toBeInTheDocument();
    });
  });
});
