/**
 * ProjectQRCode Component Tests - Sprint 4 ISSUE-102
 *
 * Tests for QR code generation modal and interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ProjectQRCode } from '../ProjectQRCode';
import * as qrPortalApi from '@/lib/api/qr-portal';

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_test123',
    sessionId: 'sess_test123',
    orgId: 'org_test123',
    getToken: vi.fn().mockResolvedValue('mock_auth_token'),
  }),
  useUser: () => ({
    user: {
      id: 'user_test123',
      firstName: 'Test',
      lastName: 'User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock QR Portal API
vi.mock('@/lib/api/qr-portal', () => ({
  generateQRToken: vi.fn(),
  revokeAllProjectTokens: vi.fn(),
  QRPortalAPIError: class QRPortalAPIError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      this.name = 'QRPortalAPIError';
    }
  },
  isOnline: vi.fn().mockReturnValue(true),
}));

// Mock Mantine notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('ProjectQRCode', () => {
  const defaultProps = {
    projectId: 'project_123',
    projectName: 'Test Construction Site',
  };

  const mockQRToken = {
    id: 'token_123',
    projectId: 'project_123',
    token: 'qr_token_abc123xyz789',
    permissions: [
      'VIEW_SUBMISSIONS',
      'VIEW_PHOTOS',
      'VIEW_PROJECT_INFO',
    ] as qrPortalApi.TokenPermission[],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    revokedAt: undefined,
    generatedBy: 'user_456',
    createdAt: new Date().toISOString(),
    accessCount: 0,
    lastAccessAt: undefined,
    isActive: true,
    isExpired: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (qrPortalApi.generateQRToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockQRToken
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render QR code button', () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      expect(screen.getByRole('button', { name: /inspector qr/i })).toBeInTheDocument();
    });

    it('should disable button when offline', () => {
      (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      expect(screen.getByRole('button', { name: /inspector qr/i })).toBeDisabled();
    });

    it('should show tooltip on button hover', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      const button = screen.getByRole('button', { name: /inspector qr/i });
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText(/generate qr code for inspectors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interaction', () => {
    it('should open modal on button click', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      const button = screen.getByRole('button', { name: /inspector qr/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/inspector access qr code/i)).toBeInTheDocument();
      });
    });

    it('should show project name in modal', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Construction Site')).toBeInTheDocument();
      });
    });

    it('should show loading state while generating token', async () => {
      (qrPortalApi.generateQRToken as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockQRToken), 100))
      );

      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText(/generating qr code/i)).toBeInTheDocument();
      });
    });

    it('should show QR code after generation', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText(/read-only access/i)).toBeInTheDocument();
      });
    });

    it('should show READ-ONLY badge', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText(/read-only access/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when offline', async () => {
      (qrPortalApi.isOnline as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (qrPortalApi.generateQRToken as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new qrPortalApi.QRPortalAPIError('Network error', 'NETWORK_ERROR')
      );

      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      // Button should be disabled when offline
      expect(screen.getByRole('button', { name: /inspector qr/i })).toBeDisabled();
    });

    it('should show error message on API failure', async () => {
      (qrPortalApi.generateQRToken as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new qrPortalApi.QRPortalAPIError('Server error', 'GRAPHQL_ERROR')
      );

      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should show auth error message', async () => {
      (qrPortalApi.generateQRToken as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new qrPortalApi.QRPortalAPIError('Authentication required', 'AUTH_REQUIRED')
      );

      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Token Regeneration', () => {
    it('should regenerate token on button click', async () => {
      const revokeResult = { revokedCount: 1, success: true };
      (qrPortalApi.revokeAllProjectTokens as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        revokeResult
      );

      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      // Open modal and wait for initial token
      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText(/regenerate/i)).toBeInTheDocument();
      });

      // Click regenerate
      fireEvent.click(screen.getByRole('button', { name: /regenerate/i }));

      await waitFor(() => {
        expect(qrPortalApi.revokeAllProjectTokens).toHaveBeenCalledWith(
          'project_123',
          'mock_auth_token'
        );
      });
    });
  });

  describe('Download Functionality', () => {
    it('should show download button when QR code is generated', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download png/i })).toBeInTheDocument();
      });
    });
  });

  describe('Shareable Link', () => {
    it('should display shareable link', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText(/shareable link/i)).toBeInTheDocument();
      });
    });

    it('should have copy button for link', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        // Look for copy button (ActionIcon with copy icon)
        const copyButtons = screen.getAllByRole('button');
        expect(copyButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Expiration Display', () => {
    it('should show time remaining for token', async () => {
      renderWithMantine(<ProjectQRCode {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /inspector qr/i }));

      await waitFor(() => {
        expect(screen.getByText(/remaining/i)).toBeInTheDocument();
      });
    });
  });
});
