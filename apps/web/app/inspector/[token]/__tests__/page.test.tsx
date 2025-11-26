/**
 * Inspector Portal Page Tests - Sprint 4 ISSUE-103
 *
 * Tests for inspector portal token verification, offline support, and UI
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import InspectorPortalPage from '../page';
import * as qrPortalApi from '@/lib/api/qr-portal';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn().mockReturnValue({ token: 'valid_token_123456789' }),
}));

// Mock QR Portal API
vi.mock('@/lib/api/qr-portal', () => ({
  verifyQRToken: vi.fn(),
  getInspectorProjectInfo: vi.fn(),
  QRPortalAPIError: class QRPortalAPIError extends Error {
    code: string;
    context?: Record<string, unknown>;
    constructor(message: string, code: string, context?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.context = context;
      this.name = 'QRPortalAPIError';
    }
  },
  isOnline: vi.fn().mockReturnValue(true),
  hasValidOfflineToken: vi.fn().mockResolvedValue(false),
  TokenPermission: {
    VIEW_SUBMISSIONS: 'VIEW_SUBMISSIONS',
    VIEW_PHOTOS: 'VIEW_PHOTOS',
    VIEW_PROJECT_INFO: 'VIEW_PROJECT_INFO',
  },
}));

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('InspectorPortalPage', () => {
  const mockVerification = {
    projectId: 'project_456',
    permissions: ['VIEW_SUBMISSIONS', 'VIEW_PHOTOS', 'VIEW_PROJECT_INFO'],
    tokenId: 'token_123',
  };

  const mockProjectInfo = {
    id: 'project_456',
    name: 'Downtown Construction Site',
    address: '123 Main Street, Reno, NV 89501',
    status: 'ACTIVE',
    startDate: '2025-01-15',
    permitNumber: 'NV-SWPPP-2025-0123',
    disturbedAcres: 5.2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockVerification);
    (qrPortalApi.getInspectorProjectInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectInfo);
    (qrPortalApi.hasValidOfflineToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithMantine(<InspectorPortalPage />);

      expect(screen.getByText(/verifying access/i)).toBeInTheDocument();
    });
  });

  describe('Valid Token', () => {
    it('should display portal after token verification', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/inspector portal/i)).toBeInTheDocument();
      });
    });

    it('should show project name', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Construction Site')).toBeInTheDocument();
      });
    });

    it('should show project address', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText('123 Main Street, Reno, NV 89501')).toBeInTheDocument();
      });
    });

    it('should show VIEW ONLY badge', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/view only/i)).toBeInTheDocument();
      });
    });

    it('should show ACTIVE status badge', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      });
    });

    it('should show permit number', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/NV-SWPPP-2025-0123/)).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Based on Permissions', () => {
    it('should show Form Submissions tab when permission granted', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /form submissions/i })).toBeInTheDocument();
      });
    });

    it('should show Photos tab when permission granted', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /photos/i })).toBeInTheDocument();
      });
    });

    it('should show Project Info tab when permission granted', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project info/i })).toBeInTheDocument();
      });
    });

    it('should hide tabs for missing permissions', async () => {
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        projectId: 'project_456',
        permissions: ['VIEW_SUBMISSIONS'], // Only submissions permission
        tokenId: 'token_123',
      });

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /form submissions/i })).toBeInTheDocument();
      });

      // Photos and Project Info tabs should not be visible
      expect(screen.queryByRole('tab', { name: /photos/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /project info/i })).not.toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show invalid token error', async () => {
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new qrPortalApi.QRPortalAPIError('Token not found', 'TOKEN_NOT_FOUND')
      );

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/invalid access token/i)).toBeInTheDocument();
      });
    });

    it('should show expired token error', async () => {
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new qrPortalApi.QRPortalAPIError('Token has expired', 'TOKEN_EXPIRED')
      );

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/access token expired/i)).toBeInTheDocument();
      });
    });

    it('should show network error with retry button', async () => {
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new qrPortalApi.QRPortalAPIError('Network error', 'NETWORK_ERROR')
      );

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new qrPortalApi.QRPortalAPIError('Network error', 'NETWORK_ERROR'))
        .mockResolvedValueOnce(mockVerification);

      (qrPortalApi.getInspectorProjectInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectInfo);

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText(/inspector portal/i)).toBeInTheDocument();
      });
    });
  });

  describe('Offline Mode', () => {
    it('should show offline message when offline with no cache', async () => {
      (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (qrPortalApi.hasValidOfflineToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    it('should load from cache when offline with valid cache', async () => {
      (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (qrPortalApi.hasValidOfflineToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockVerification);
      (qrPortalApi.getInspectorProjectInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectInfo);

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Construction Site')).toBeInTheDocument();
      });
    });

    it('should show OFFLINE badge when in offline mode', async () => {
      (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (qrPortalApi.hasValidOfflineToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (qrPortalApi.verifyQRToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockVerification);
      (qrPortalApi.getInspectorProjectInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjectInfo);

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText('OFFLINE')).toBeInTheDocument();
      });
    });

    it('should show retry button when offline', async () => {
      (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (qrPortalApi.hasValidOfflineToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry connection/i })).toBeInTheDocument();
      });
    });
  });

  describe('Token Format Validation', () => {
    it('should reject short tokens', async () => {
      const { useParams } = await import('next/navigation');
      (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ token: 'short' });

      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/invalid token format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Info Panel', () => {
    it('should show project details when Project Info tab is clicked', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project info/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /project info/i }));

      await waitFor(() => {
        expect(screen.getByText(/project details/i)).toBeInTheDocument();
        expect(screen.getByText(/5.2 acres/i)).toBeInTheDocument();
      });
    });
  });

  describe('Footer Information', () => {
    it('should show token expiration notice', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/token expires in 24 hours/i)).toBeInTheDocument();
      });
    });

    it('should show QR code access notice', async () => {
      renderWithMantine(<InspectorPortalPage />);

      await waitFor(() => {
        expect(screen.getByText(/access granted via qr code scan/i)).toBeInTheDocument();
      });
    });
  });
});
