'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Modal,
  Button,
  Stack,
  Group,
  Text,
  Paper,
  ActionIcon,
  Tooltip,
  Badge,
  CopyButton,
  Divider,
  Alert,
  Center,
  Loader,
  useMantineTheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconQrcode,
  IconRefresh,
  IconDownload,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconEye,
  IconWifi,
  IconWifiOff,
} from '@tabler/icons-react';
import { useAuth } from '@clerk/nextjs';
import {
  generateQRToken,
  revokeAllProjectTokens,
  QRToken,
  TokenPermission,
  QRPortalAPIError,
  isOnline,
} from '@/lib/api/qr-portal';

interface ProjectQRCodeProps {
  projectId: string;
  projectName: string;
}

interface TokenInfo {
  id: string;
  token: string;
  expiresAt: Date;
  permissions: TokenPermission[];
}

/**
 * ProjectQRCode Component - Sprint 4 ISSUE-102
 *
 * Displays a QR code button that opens a modal with:
 * - QR code for inspector portal access
 * - Shareable link
 * - Token expiration countdown
 * - Regenerate button (invalidates old tokens)
 *
 * Features:
 * - QR code downloads as PNG with error handling
 * - Link can be copied to clipboard
 * - Shows READ-ONLY badge
 * - 24-hour token expiration display
 * - Real API integration with Clerk authentication
 * - Offline detection
 */
export function ProjectQRCode({ projectId, projectName }: ProjectQRCodeProps) {
  const theme = useMantineTheme();
  const { getToken } = useAuth();
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate the inspector portal URL
   */
  const getInspectorUrl = useCallback((token: string): string => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/inspector/${token}`;
  }, []);

  /**
   * Handle modal open - generate token if not exists
   */
  const handleOpen = useCallback(async () => {
    setOpened(true);
    if (!tokenInfo) {
      await generateToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenInfo]);

  /**
   * Generate a new QR token via API
   * Includes detailed error handling and logging
   */
  const generateToken = useCallback(async () => {
    // Check online status
    if (!isOnline()) {
      setError('You are offline. Please connect to the internet to generate a QR code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get auth token from Clerk
      const authToken = await getToken();
      if (!authToken) {
        throw new QRPortalAPIError(
          'Authentication required. Please sign in again.',
          'AUTH_REQUIRED',
        );
      }

      // Generate token via API with all VIEW permissions
      const qrToken: QRToken = await generateQRToken(
        {
          projectId,
          permissions: ['VIEW_SUBMISSIONS', 'VIEW_PHOTOS', 'VIEW_PROJECT_INFO'],
          expiryHours: 24,
        },
        authToken,
      );

      setTokenInfo({
        id: qrToken.id,
        token: qrToken.token,
        expiresAt: new Date(qrToken.expiresAt),
        permissions: qrToken.permissions,
      });

      // eslint-disable-next-line no-console
      console.info('QR token generated successfully', {
        tokenId: qrToken.id,
        projectId,
        expiresAt: qrToken.expiresAt,
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      // eslint-disable-next-line no-console
      console.error('QR token generation failed:', {
        projectId,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, getToken]);

  /**
   * Regenerate token - revokes old tokens first
   */
  const handleRegenerate = useCallback(async () => {
    if (!isOnline()) {
      setError('You are offline. Please connect to the internet to regenerate the QR code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = await getToken();
      if (!authToken) {
        throw new QRPortalAPIError(
          'Authentication required. Please sign in again.',
          'AUTH_REQUIRED',
        );
      }

      // Revoke all existing tokens for this project
      const revokeResult = await revokeAllProjectTokens(projectId, authToken);
      // eslint-disable-next-line no-console
      console.info('Previous tokens revoked', {
        projectId,
        revokedCount: revokeResult.revokedCount,
      });

      // Generate new token
      const qrToken = await generateQRToken(
        {
          projectId,
          permissions: ['VIEW_SUBMISSIONS', 'VIEW_PHOTOS', 'VIEW_PROJECT_INFO'],
          expiryHours: 24,
        },
        authToken,
      );

      setTokenInfo({
        id: qrToken.id,
        token: qrToken.token,
        expiresAt: new Date(qrToken.expiresAt),
        permissions: qrToken.permissions,
      });

      notifications.show({
        title: 'QR Code Regenerated',
        message: `Previous ${revokeResult.revokedCount} token(s) have been invalidated`,
        color: 'green',
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      // eslint-disable-next-line no-console
      console.error('QR token regeneration failed:', {
        projectId,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, getToken]);

  /**
   * Download QR code as PNG with proper error handling
   */
  const handleDownload = useCallback(async () => {
    if (!tokenInfo) return;

    setDownloading(true);

    try {
      const svg = document.getElementById('qr-code-svg');
      if (!svg) {
        throw new Error('QR code element not found. Please try refreshing the page.');
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas not supported in this browser.');
      }

      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            canvas.width = 256;
            canvas.height = 256;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 256, 256);
            ctx.drawImage(img, 0, 0);

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${projectName.replace(/\s+/g, '-')}-qr-code.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            resolve();
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load QR code image for download.'));
        };

        // Encode SVG data safely
        const encodedSvg = encodeURIComponent(svgData);
        img.src = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
      });

      notifications.show({
        title: 'QR Code Downloaded',
        message: 'QR code saved successfully',
        color: 'green',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('QR download failed:', {
        error: err instanceof Error ? err.message : String(err),
        projectName,
      });

      notifications.show({
        title: 'Download Failed',
        message: err instanceof Error ? err.message : 'Could not download QR code. Try again.',
        color: 'red',
      });
    } finally {
      setDownloading(false);
    }
  }, [tokenInfo, projectName]);

  /**
   * Calculate time remaining until token expiration
   */
  const getTimeRemaining = useCallback((): string => {
    if (!tokenInfo) return '';
    const now = new Date();
    const diff = tokenInfo.expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }, [tokenInfo]);

  /**
   * Extract user-friendly error message from various error types
   */
  function getErrorMessage(err: unknown): string {
    if (err instanceof QRPortalAPIError) {
      switch (err.code) {
        case 'AUTH_REQUIRED':
          return 'Authentication required. Please sign in again.';
        case 'NETWORK_ERROR':
          return 'Network error. Please check your connection and try again.';
        case 'GRAPHQL_ERROR':
          return err.message || 'Server error. Please try again later.';
        default:
          return err.message;
      }
    }

    if (err instanceof Error) {
      return err.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  const online = isOnline();

  return (
    <>
      {/* QR Code Button */}
      <Tooltip label="Generate QR code for inspectors" withArrow>
        <Button
          variant="light"
          leftSection={<IconQrcode size={16} />}
          onClick={handleOpen}
          disabled={!online}
        >
          Inspector QR
        </Button>
      </Tooltip>

      {/* QR Code Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group gap="xs">
            <IconQrcode size={20} />
            <Text fw={600}>Inspector Access QR Code</Text>
          </Group>
        }
        size="md"
        centered
      >
        <Stack gap="md">
          {/* Project name */}
          <Text size="sm" c="dimmed" ta="center">
            {projectName}
          </Text>

          {/* Offline warning */}
          {!online && (
            <Alert icon={<IconWifiOff size={16} />} color="orange" variant="light">
              You are offline. QR code generation requires an internet connection.
            </Alert>
          )}

          {/* Error display */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              withCloseButton
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Loading state */}
          {loading && (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="md" />
                <Text size="sm" c="dimmed">
                  Generating QR code...
                </Text>
              </Stack>
            </Center>
          )}

          {/* QR Code display */}
          {!loading && tokenInfo && (
            <>
              {/* Permission badge */}
              <Center>
                <Badge variant="light" color="blue" size="lg" leftSection={<IconEye size={14} />}>
                  READ-ONLY ACCESS
                </Badge>
              </Center>

              {/* Online status indicator */}
              <Center>
                <Badge
                  variant="dot"
                  color={online ? 'green' : 'red'}
                  size="sm"
                  leftSection={online ? <IconWifi size={10} /> : <IconWifiOff size={10} />}
                >
                  {online ? 'Online' : 'Offline'}
                </Badge>
              </Center>

              {/* QR Code */}
              <Paper withBorder p="lg" radius="md" bg="white">
                <Center>
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={getInspectorUrl(tokenInfo.token)}
                    size={200}
                    level="M"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor={theme.colors.dark[9]}
                  />
                </Center>
              </Paper>

              {/* Expiration info */}
              <Group justify="center" gap="xs">
                <IconClock size={14} color={theme.colors.gray[6]} />
                <Text size="xs" c="dimmed">
                  {getTimeRemaining()}
                </Text>
              </Group>

              <Divider />

              {/* Shareable link */}
              <Stack gap="xs">
                <Text size="xs" fw={500} c="dimmed">
                  SHAREABLE LINK
                </Text>
                <Paper withBorder p="xs" radius="sm" bg="gray.0">
                  <Group justify="space-between" wrap="nowrap">
                    <Text
                      size="xs"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {getInspectorUrl(tokenInfo.token)}
                    </Text>
                    <CopyButton value={getInspectorUrl(tokenInfo.token)} timeout={2000}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          color={copied ? 'teal' : 'gray'}
                          variant="subtle"
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Paper>
              </Stack>

              {/* Action buttons */}
              <Group grow>
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownload}
                  loading={downloading}
                  disabled={downloading}
                >
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  leftSection={<IconRefresh size={16} />}
                  onClick={handleRegenerate}
                  loading={loading}
                  disabled={!online}
                >
                  Regenerate
                </Button>
              </Group>

              {/* Warning about regeneration */}
              <Text size="xs" c="dimmed" ta="center" fs="italic">
                Regenerating will invalidate all previous QR codes for this project
              </Text>
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}
