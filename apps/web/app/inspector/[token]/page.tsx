'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Stack,
  Title,
  Text,
  Alert,
  Card,
  Group,
  Badge,
  Tabs,
  Box,
  Center,
  Loader,
  Paper,
  ThemeIcon,
  Divider,
  Button,
  useMantineTheme,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconClipboardList,
  IconPhoto,
  IconBuilding,
  IconCalendar,
  IconMapPin,
  IconShield,
  IconClock,
  IconEye,
  IconWifiOff,
  IconRefresh,
} from '@tabler/icons-react';
import { SubmissionViewer } from '@/components/QRPortal/SubmissionViewer';
import { PhotoGalleryViewer } from '@/components/QRPortal/PhotoGalleryViewer';
import {
  verifyQRToken,
  getInspectorProjectInfo,
  QRPortalAPIError,
  isOnline,
  hasValidOfflineToken,
  VerifiedTokenPayload,
  InspectorProjectInfo,
  TokenPermission,
} from '@/lib/api/qr-portal';

/**
 * Portal state interface for inspector portal page
 */
interface PortalState {
  status: 'loading' | 'valid' | 'expired' | 'invalid' | 'error' | 'offline';
  token?: VerifiedTokenPayload;
  project?: InspectorProjectInfo;
  error?: string;
  isOfflineMode?: boolean;
}

/**
 * Inspector Portal Page - Sprint 4 ISSUE-103
 *
 * Public page for inspectors to view project compliance data
 * via QR code access. Features:
 * - Token verification via GraphQL API
 * - Offline support with IndexedDB caching
 * - READ-ONLY access to submissions, photos, and project info
 * - Permission-based tab visibility
 */
export default function InspectorPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const theme = useMantineTheme();

  const [state, setState] = useState<PortalState>({ status: 'loading' });

  /**
   * Verify token and load portal data
   * Includes offline fallback via IndexedDB cache
   */
  const verifyAndLoadPortal = useCallback(async (accessToken: string) => {
    try {
      // Check if this looks like a valid token format
      if (!accessToken || accessToken.length < 20) {
        setState({ status: 'invalid', error: 'Invalid token format' });
        return;
      }

      // Check for offline mode with cached token
      if (!isOnline()) {
        const hasCachedToken = await hasValidOfflineToken(accessToken);
        if (hasCachedToken) {
          // Try to load from cache
          try {
            const verification = await verifyQRToken(accessToken);
            const projectInfo = await getInspectorProjectInfo(accessToken);

            setState({
              status: 'valid',
              token: verification,
              project: projectInfo,
              isOfflineMode: true,
            });
            return;
          } catch {
            setState({
              status: 'offline',
              error: 'Unable to verify token while offline. Please reconnect to the internet.',
            });
            return;
          }
        } else {
          setState({
            status: 'offline',
            error:
              'You are offline and this token has not been verified before. Please connect to the internet to verify access.',
          });
          return;
        }
      }

      // Online: Verify token via API
      const verification = await verifyQRToken(accessToken);

      // Get project info
      const projectInfo = await getInspectorProjectInfo(accessToken);

      setState({
        status: 'valid',
        token: verification,
        project: projectInfo,
        isOfflineMode: false,
      });

      // eslint-disable-next-line no-console
      console.info('Inspector portal loaded', {
        tokenId: verification.tokenId,
        projectId: verification.projectId,
        permissions: verification.permissions,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Inspector portal verification failed:', {
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });

      if (err instanceof QRPortalAPIError) {
        switch (err.code) {
          case 'TOKEN_EXPIRED':
            setState({ status: 'expired', error: err.message });
            break;
          case 'TOKEN_REVOKED':
          case 'TOKEN_NOT_FOUND':
            setState({
              status: 'invalid',
              error: 'This access link is no longer valid. Please request a new QR code.',
            });
            break;
          case 'NETWORK_ERROR': {
            // Try offline fallback
            const hasCachedToken = await hasValidOfflineToken(accessToken);
            if (hasCachedToken) {
              try {
                const verification = await verifyQRToken(accessToken);
                const projectInfo = await getInspectorProjectInfo(accessToken);
                setState({
                  status: 'valid',
                  token: verification,
                  project: projectInfo,
                  isOfflineMode: true,
                });
                return;
              } catch {
                // Fall through to error state
              }
            }
            setState({
              status: 'error',
              error: 'Network error. Please check your connection and try again.',
            });
            break;
          }
          default:
            setState({ status: 'error', error: err.message });
        }
      } else {
        setState({
          status: 'error',
          error: 'Failed to verify access token. Please try again.',
        });
      }
    }
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setState({ status: 'invalid', error: 'No access token provided' });
      return;
    }

    verifyAndLoadPortal(token);
  }, [token, verifyAndLoadPortal]);

  /**
   * Retry verification (useful when coming back online)
   */
  const handleRetry = useCallback(() => {
    setState({ status: 'loading' });
    verifyAndLoadPortal(token);
  }, [token, verifyAndLoadPortal]);

  /**
   * Check if token has a specific permission
   */
  function hasPermission(permission: string): boolean {
    return state.token?.permissions?.includes(permission as TokenPermission) ?? false;
  }

  // Render based on state
  if (state.status === 'loading') {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Loader size="lg" color="blue" />
          <Text size="md" fw={500} c="dark.6">
            Verifying access...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (state.status === 'expired') {
    return (
      <Container size="sm" py="xl">
        <Alert
          icon={<IconClock size={24} />}
          title="Access Token Expired"
          color="orange"
          variant="filled"
          radius="md"
        >
          <Text>
            This access link has expired. Please contact the project manager to request a new QR
            code.
          </Text>
        </Alert>
      </Container>
    );
  }

  if (state.status === 'offline') {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Alert
            icon={<IconWifiOff size={24} />}
            title="Offline"
            color="orange"
            variant="filled"
            radius="md"
          >
            <Text>{state.error}</Text>
          </Alert>
          <Button
            leftSection={<IconRefresh size={18} />}
            variant="light"
            onClick={handleRetry}
            fullWidth
          >
            Retry Connection
          </Button>
        </Stack>
      </Container>
    );
  }

  if (state.status === 'invalid' || state.status === 'error') {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Alert
            icon={<IconAlertCircle size={24} />}
            title={state.status === 'invalid' ? 'Invalid Access Token' : 'Error'}
            color="red"
            variant="filled"
            radius="md"
          >
            <Text>{state.error || 'This access link is not valid. Please scan a valid QR code.'}</Text>
          </Alert>
          {state.status === 'error' && (
            <Button
              leftSection={<IconRefresh size={18} />}
              variant="light"
              onClick={handleRetry}
              fullWidth
            >
              Try Again
            </Button>
          )}
        </Stack>
      </Container>
    );
  }

  // Valid token - render inspector portal
  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.gray[0],
      }}
    >
      {/* Header Section */}
      <Paper
        shadow="sm"
        p="md"
        radius={0}
        style={{
          backgroundColor: theme.colors.blue[7],
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Stack gap={4}>
              <Group gap="xs">
                <ThemeIcon size="lg" variant="light" color="white" radius="md">
                  <IconShield size={20} />
                </ThemeIcon>
                <Title order={3} c="white" fw={600}>
                  Inspector Portal
                </Title>
              </Group>
              <Text size="sm" c="blue.1" fw={500}>
                Read-only compliance access
              </Text>
            </Stack>
            <Group gap="xs">
              {state.isOfflineMode && (
                <Badge size="lg" variant="filled" color="orange" radius="md">
                  <Group gap={4}>
                    <IconWifiOff size={14} />
                    OFFLINE
                  </Group>
                </Badge>
              )}
              <Badge size="lg" variant="light" color="white" radius="md">
                <Group gap={4}>
                  <IconEye size={14} />
                  VIEW ONLY
                </Group>
              </Badge>
            </Group>
          </Group>
        </Container>
      </Paper>

      {/* Project Info Banner */}
      {state.project && (
        <Paper shadow="xs" radius={0} p="md" mb="md">
          <Container size="lg">
            <Group justify="space-between" wrap="wrap" gap="md">
              <Stack gap={4}>
                <Text size="sm" c="dimmed" fw={500}>
                  Project
                </Text>
                <Title order={4}>{state.project.name}</Title>
                <Group gap="xs">
                  <IconMapPin size={14} color={theme.colors.gray[6]} />
                  <Text size="sm" c="dimmed">
                    {state.project.address}
                  </Text>
                </Group>
              </Stack>
              <Stack gap="xs" align="flex-end">
                <Badge
                  color={state.project.status === 'ACTIVE' ? 'green' : 'gray'}
                  variant="light"
                  size="lg"
                >
                  {state.project.status}
                </Badge>
                {state.project.permitNumber && (
                  <Text size="xs" c="dimmed">
                    Permit: {state.project.permitNumber}
                  </Text>
                )}
              </Stack>
            </Group>
          </Container>
        </Paper>
      )}

      {/* Main Content Tabs */}
      <Container size="lg" py="md">
        <Tabs defaultValue="submissions" variant="pills" radius="md">
          <Paper shadow="xs" p="xs" mb="md" radius="md">
            <Tabs.List grow>
              {hasPermission('VIEW_SUBMISSIONS') && (
                <Tabs.Tab
                  value="submissions"
                  leftSection={<IconClipboardList size={18} />}
                  fw={500}
                >
                  Form Submissions
                </Tabs.Tab>
              )}
              {hasPermission('VIEW_PHOTOS') && (
                <Tabs.Tab value="photos" leftSection={<IconPhoto size={18} />} fw={500}>
                  Photos
                </Tabs.Tab>
              )}
              {hasPermission('VIEW_PROJECT_INFO') && (
                <Tabs.Tab value="project" leftSection={<IconBuilding size={18} />} fw={500}>
                  Project Info
                </Tabs.Tab>
              )}
            </Tabs.List>
          </Paper>

          {/* Form Submissions Panel */}
          {hasPermission('VIEW_SUBMISSIONS') && (
            <Tabs.Panel value="submissions">
              <SubmissionViewer projectId={state.token?.projectId || ''} />
            </Tabs.Panel>
          )}

          {/* Photos Panel */}
          {hasPermission('VIEW_PHOTOS') && (
            <Tabs.Panel value="photos">
              <PhotoGalleryViewer projectId={state.token?.projectId || ''} />
            </Tabs.Panel>
          )}

          {/* Project Info Panel */}
          {hasPermission('VIEW_PROJECT_INFO') && (
            <Tabs.Panel value="project">
              <Card shadow="xs" radius="md" p="lg">
                <Stack gap="md">
                  <Title order={5}>Project Details</Title>
                  <Divider />
                  {state.project && (
                    <Stack gap="lg">
                      <Group justify="space-between">
                        <Stack gap={2}>
                          <Text size="sm" c="dimmed">
                            Project Name
                          </Text>
                          <Text fw={500}>{state.project.name}</Text>
                        </Stack>
                        <Stack gap={2} align="flex-end">
                          <Text size="sm" c="dimmed">
                            Status
                          </Text>
                          <Badge
                            color={state.project.status === 'ACTIVE' ? 'green' : 'gray'}
                            variant="light"
                          >
                            {state.project.status}
                          </Badge>
                        </Stack>
                      </Group>

                      <Stack gap={2}>
                        <Text size="sm" c="dimmed">
                          Location
                        </Text>
                        <Group gap="xs">
                          <IconMapPin size={16} color={theme.colors.gray[6]} />
                          <Text>{state.project.address}</Text>
                        </Group>
                      </Stack>

                      <Group justify="space-between" grow>
                        <Stack gap={2}>
                          <Text size="sm" c="dimmed">
                            Start Date
                          </Text>
                          <Group gap="xs">
                            <IconCalendar size={16} color={theme.colors.gray[6]} />
                            <Text>
                              {new Date(state.project.startDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Text>
                          </Group>
                        </Stack>
                        <Stack gap={2}>
                          <Text size="sm" c="dimmed">
                            Disturbed Area
                          </Text>
                          <Text fw={500}>{state.project.disturbedAcres} acres</Text>
                        </Stack>
                      </Group>

                      {state.project.permitNumber && (
                        <Stack gap={2}>
                          <Text size="sm" c="dimmed">
                            SWPPP Permit
                          </Text>
                          <Badge variant="outline" color="blue" size="lg">
                            {state.project.permitNumber}
                          </Badge>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Tabs.Panel>
          )}
        </Tabs>

        {/* Footer with token info */}
        <Paper shadow="xs" p="md" mt="lg" radius="md" bg="gray.1">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Text size="xs" c="dimmed">
              Access granted via QR code scan
            </Text>
            <Group gap="xs">
              <IconClock size={14} color={theme.colors.gray[5]} />
              <Text size="xs" c="dimmed">
                Token expires in 24 hours
              </Text>
            </Group>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}
