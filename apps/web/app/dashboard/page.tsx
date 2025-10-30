'use client';

// Route segment config to prevent prerender errors with auth/runtime-only data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import { Container, Title, Tabs, Stack, Group, Text, Badge, Card, Grid } from '@mantine/core';
import {
  IconBuilding,
  IconClipboardList,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconBell,
  IconClock,
  IconCloudRain,
  IconCamera,
} from '@tabler/icons-react';
import { useAuth } from '@clerk/nextjs';
import { OrganizationDashboard } from '@/components/Organization/OrganizationDashboard';
import { ProjectSelector } from '@/components/Projects/ProjectSelector';
import { RoleGuard, useRolePermissions, UserRole } from '@/components/Auth/RoleGuard';
import { OrganizationProvider } from '@/components/Organization/OrganizationProvider';

/**
 * Main Dashboard Page for BrAve Forms
 *
 * Provides role-based access to:
 * - Organization overview with compliance metrics
 * - Project management with tenant isolation
 * - Team management (admin only)
 * - Analytics and reporting (management+)
 *
 * Enforces complete tenant isolation using Clerk Organizations
 */
function DashboardContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent SSR/SSG - only render in browser
  if (!isMounted) {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { orgRole } = useAuth();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { getCurrentRole } = useRolePermissions();

  const userRole = getCurrentRole() || 'MEMBER';

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1}>
            <Group gap="sm">
              <IconBuilding size={32} color="#2563eb" />
              Construction Dashboard
            </Group>
          </Title>
          <Text size="sm" c="dimmed">
            EPA and OSHA compliance management for construction projects
          </Text>
        </Stack>

        <Group>
          <Badge variant="light" color="blue" size="lg">
            {orgRole}
          </Badge>

          {/* Notifications */}
          <RoleGuard requiredRoles={['OWNER', 'ADMIN', 'MANAGER']}>
            <Badge variant="filled" color="orange" leftSection="3">
              <IconBell size={14} />
            </Badge>
          </RoleGuard>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconBuilding size={16} />}>
            Overview
          </Tabs.Tab>

          <Tabs.Tab value="projects" leftSection={<IconClipboardList size={16} />}>
            Projects
          </Tabs.Tab>

          {/* Team Management - Management Access Only */}
          <RoleGuard requiredRoles={['OWNER', 'ADMIN', 'MANAGER']} fallback={null}>
            <Tabs.Tab value="team" leftSection={<IconUsers size={16} />}>
              Team
            </Tabs.Tab>
          </RoleGuard>

          {/* Analytics - Management Access Only */}
          <RoleGuard requiredRoles={['OWNER', 'ADMIN', 'MANAGER']} fallback={null}>
            <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
              Analytics
            </Tabs.Tab>
          </RoleGuard>

          {/* Settings - Admin Only */}
          <RoleGuard requiredRoles={['OWNER', 'ADMIN']} fallback={null}>
            <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
              Settings
            </Tabs.Tab>
          </RoleGuard>
        </Tabs.List>

        {/* Organization Overview Tab */}
        <Tabs.Panel value="overview" pt="lg">
          <OrganizationDashboard userRole={userRole} />
        </Tabs.Panel>

        {/* Projects Tab - All Team Members */}
        <Tabs.Panel value="projects" pt="lg">
          <ProjectSelector
            userRole={userRole}
            onProjectSelect={setSelectedProjectId}
            selectedProjectId={selectedProjectId}
            showCreateButton={true}
          />
        </Tabs.Panel>

        {/* Team Management Tab - Management Only */}
        <Tabs.Panel value="team" pt="lg">
          <RoleGuard requiredRoles={['OWNER', 'ADMIN', 'MANAGER']}>
            <TeamManagementPanel userRole={userRole} />
          </RoleGuard>
        </Tabs.Panel>

        {/* Analytics Tab - Management Only */}
        <Tabs.Panel value="analytics" pt="lg">
          <RoleGuard requiredRoles={['OWNER', 'ADMIN', 'MANAGER']}>
            <AnalyticsPanel userRole={userRole} />
          </RoleGuard>
        </Tabs.Panel>

        {/* Settings Tab - Admin Only */}
        <Tabs.Panel value="settings" pt="lg">
          <RoleGuard requiredRoles={['OWNER', 'ADMIN']}>
            <SettingsPanel userRole={userRole} />
          </RoleGuard>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

/**
 * Team Management Panel - Role-based user management
 */
function TeamManagementPanel({ userRole }: { userRole: UserRole }) {
  return (
    <Stack gap="md">
      <Title order={2}>Team Management</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg">
            <Title order={3} mb="md">
              Organization Members
            </Title>
            <Text c="dimmed">
              Team member management interface would be here. Shows all users in the organization
              with their roles and permissions.
            </Text>

            {/* TODO: Implement team member list with role management */}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Card shadow="sm" padding="lg">
              <Title order={4} mb="md">
                Quick Actions
              </Title>
              <Stack gap="sm">
                <Text size="sm">• Invite new members</Text>
                <Text size="sm">• Manage roles</Text>
                <Text size="sm">• Project assignments</Text>
              </Stack>
            </Card>

            {userRole === 'OWNER' && (
              <Card shadow="sm" padding="lg">
                <Title order={4} mb="md">
                  Owner Controls
                </Title>
                <Stack gap="sm">
                  <Text size="sm" c="red">
                    • Billing management
                  </Text>
                  <Text size="sm" c="red">
                    • Organization settings
                  </Text>
                  <Text size="sm" c="red">
                    • Data export
                  </Text>
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

/**
 * Analytics Panel - Compliance and performance analytics
 */
function AnalyticsPanel({ userRole: _userRole }: { userRole: UserRole }) {
  return (
    <Stack gap="md">
      <Title order={2}>Analytics & Reporting</Title>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card shadow="sm" padding="lg" h={400}>
            <Title order={3} mb="md">
              Compliance Trends
            </Title>
            <Text c="dimmed">
              EPA compliance trend charts would be displayed here. Shows compliance rates over time,
              weather-triggered inspections, and violation patterns across all organization
              projects.
            </Text>

            {/* TODO: Implement compliance trend visualization */}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md" h="100%">
            <Card shadow="sm" padding="lg">
              <Title order={4} mb="md">
                Key Metrics
              </Title>
              <Stack gap="sm">
                <Group gap="xs">
                  <IconChartBar size={14} />
                  <Text size="sm">Overall compliance rate</Text>
                </Group>
                <Group gap="xs">
                  <IconClock size={14} />
                  <Text size="sm">Average inspection time</Text>
                </Group>
                <Group gap="xs">
                  <IconCloudRain size={14} />
                  <Text size="sm">Weather event response</Text>
                </Group>
                <Group gap="xs">
                  <IconCamera size={14} />
                  <Text size="sm">Photo documentation rate</Text>
                </Group>
              </Stack>
            </Card>

            <Card shadow="sm" padding="lg" style={{ flex: 1 }}>
              <Title order={4} mb="md">
                Export Options
              </Title>
              <Stack gap="sm">
                <Text size="sm">• Monthly compliance reports</Text>
                <Text size="sm">• Inspection data export</Text>
                <Text size="sm">• Photo archive download</Text>
                <Text size="sm">• EPA audit package</Text>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

/**
 * Settings Panel - Organization and system settings
 */
function SettingsPanel({ userRole }: { userRole: UserRole }) {
  return (
    <Stack gap="md">
      <Title order={2}>Organization Settings</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg">
            <Title order={3} mb="md">
              Organization Profile
            </Title>
            <Stack gap="md">
              <Text size="sm">Update organization name, address, and contact information.</Text>

              {/* TODO: Implement organization profile form */}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg">
            <Title order={3} mb="md">
              Compliance Settings
            </Title>
            <Stack gap="md">
              <Text size="sm">
                Configure EPA thresholds, inspection deadlines, and notification preferences.
              </Text>

              {/* TODO: Implement compliance settings form */}
            </Stack>
          </Card>
        </Grid.Col>

        {userRole === 'OWNER' && (
          <>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="lg" withBorder style={{ borderColor: '#fbbf24' }}>
                <Title order={3} mb="md" c="orange">
                  Billing & Subscription
                </Title>
                <Stack gap="md">
                  <Text size="sm">Manage your subscription plan and billing information.</Text>

                  {/* TODO: Implement billing management */}
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="lg" withBorder style={{ borderColor: '#ef4444' }}>
                <Title order={3} mb="md" c="red">
                  Danger Zone
                </Title>
                <Stack gap="md">
                  <Text size="sm">Export all data or permanently delete the organization.</Text>

                  {/* TODO: Implement danger zone actions */}
                </Stack>
              </Card>
            </Grid.Col>
          </>
        )}
      </Grid>
    </Stack>
  );
}

/**
 * Main Dashboard Page with Organization Provider
 * Enforces complete tenant isolation
 */
export default function DashboardPage() {
  return (
    <OrganizationProvider>
      <DashboardContent />
    </OrganizationProvider>
  );
}
