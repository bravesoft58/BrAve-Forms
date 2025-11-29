import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ConflictComparisonModal } from '../ConflictComparisonModal';
import type { SyncConflict } from '@/lib/stores/conflict-store';

// Wrapper with MantineProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe('ConflictComparisonModal', () => {
  const mockOnResolve = vi.fn();
  const mockOnClose = vi.fn();

  const mockConflict: SyncConflict = {
    id: 'conflict_1',
    resourceId: 'res_123',
    resourceType: 'form_submission',
    localVersion: {
      data: { name: 'Local Name', email: 'local@test.com' },
      modifiedAt: '2025-11-28T10:00:00Z',
      modifiedBy: 'user1',
      version: 1,
    },
    serverVersion: {
      data: { name: 'Server Name', email: 'server@test.com' },
      modifiedAt: '2025-11-28T11:00:00Z',
      modifiedBy: 'user2',
      version: 2,
    },
    differences: [
      {
        fieldId: 'name',
        fieldLabel: 'Name',
        localValue: 'Local Name',
        serverValue: 'Server Name',
        type: 'modified',
      },
      {
        fieldId: 'email',
        fieldLabel: 'Email',
        localValue: 'local@test.com',
        serverValue: 'server@test.com',
        type: 'modified',
      },
    ],
    detectedAt: '2025-11-28T12:00:00Z',
    status: 'pending',
    orgId: 'org_test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the modal with conflict information', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Resolve Conflict')).toBeInTheDocument();
    expect(screen.getByText('Form Submission')).toBeInTheDocument();
  });

  it('should display version information', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Local Version')).toBeInTheDocument();
    expect(screen.getByText('Server Version')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
  });

  it('should display field differences', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Local Name')).toBeInTheDocument();
    expect(screen.getByText('Server Name')).toBeInTheDocument();
  });

  it('should call onResolve with keep_local when clicking Keep Local', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const keepLocalButton = screen.getByRole('button', { name: /keep local/i });
    fireEvent.click(keepLocalButton);

    expect(mockOnResolve).toHaveBeenCalledWith('conflict_1', 'keep_local');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onResolve with keep_server when clicking Keep Server', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const keepServerButton = screen.getByRole('button', { name: /keep server/i });
    fireEvent.click(keepServerButton);

    expect(mockOnResolve).toHaveBeenCalledWith('conflict_1', 'keep_server');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should enter merge mode when clicking Merge', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const mergeButton = screen.getByRole('button', { name: /^merge$/i });
    fireEvent.click(mergeButton);

    // Should show merge mode buttons
    expect(screen.getByRole('button', { name: /apply merged changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel merge/i })).toBeInTheDocument();
  });

  it('should call onClose when clicking Cancel', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display difference type badges', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    // Both differences are 'modified'
    const modifiedBadges = screen.getAllByText('modified');
    expect(modifiedBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('should show pending status badge', () => {
    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={mockConflict}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('should handle conflict with no differences', () => {
    const conflictWithNoDiffs = {
      ...mockConflict,
      differences: [],
    };

    render(
      <TestWrapper>
        <ConflictComparisonModal
          conflict={conflictWithNoDiffs}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/no field-level differences detected/i)).toBeInTheDocument();
  });
});
