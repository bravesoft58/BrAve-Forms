'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Grid, 
  Card, 
  Text, 
  Badge, 
  Group,
  Stack,
  Button,
  Progress,
  RingProgress,
  ActionIcon,
  Menu,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { 
  IconBuilding, 
  IconUsers, 
  IconClipboardCheck, 
  IconAlertTriangle,
  IconTrendingUp,
  IconEye,
  IconSettings,
  IconDownload,
  IconFilter,
  IconRefresh,
} from '@tabler/icons-react';
import { useAuth } from '@clerk/nextjs';
import { gql, useQuery } from '@apollo/client';
import { notifications } from '@mantine/notifications';

// GraphQL Queries
const GET_ORGANIZATION_DASHBOARD = gql`
  query GetOrganizationDashboard {
    currentOrganization {
      id
      name
      plan
      stats {
        totalProjects
        activeProjects
        totalInspections
        pendingInspections
        complianceRate
        totalUsers
        usersByRole {
          role
          count
        }
        projectsByStatus {
          status
          count
        }
        inspectionStats {
          type
          total
          compliant
          overdue
        }
      }
    }
    projects {
      id
      name
      status
      compliance {
        overallScore
        requiresAttention
        overdueInspections
      }
      recentInspections {
        id
        type
        status
        overdue
        inspectionDate
      }
    }
  }
`;

interface OrganizationDashboardProps {
  userRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'INSPECTOR';
}

export function OrganizationDashboard({ userRole }: OrganizationDashboardProps) {
  const { orgId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_DASHBOARD, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      notifications.show({
        title: 'Dashboard Updated',
        message: 'Latest data has been loaded',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Refresh Failed',
        message: 'Could not update dashboard data',
        color: 'red',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text>Loading organization dashboard...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert
        variant="filled"
        color="red"
        title="Dashboard Error"
        icon={<IconAlertTriangle size={16} />}
      >
        Could not load organization dashboard. Please contact support if the issue persists.
      </Alert>
    );
  }

  const organization = data?.currentOrganization;
  const projects = data?.projects || [];
  const stats = organization?.stats;

  if (!organization) {
    return (
      <Alert
        variant="light"
        color="yellow"
        title="No Organization"
        icon={<IconBuilding size={16} />}
      >
        You don't seem to be part of an organization. Please join or create one to access the dashboard.
      </Alert>
    );
  }

  // Calculate derived metrics
  const complianceColor = stats?.complianceRate >= 90 ? 'green' : stats?.complianceRate >= 70 ? 'yellow' : 'red';
  const urgentProjects = projects.filter((p: any) => p.compliance.requiresAttention).length;
  const overdueTotal = projects.reduce((sum: number, p: any) => sum + p.compliance.overdueInspections, 0);

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1}>
            <Group gap="sm">
              <IconBuilding size={32} color="#0ea5e9" />
              {organization.name}
            </Group>
          </Title>
          <Text size="sm" c="dimmed">
            {organization.plan} Plan • Organization Dashboard
          </Text>
        </Stack>

        <Group>
          <ActionIcon
            variant="light"
            size="lg"
            loading={refreshing}
            onClick={handleRefresh}
          >
            <IconRefresh size={18} />
          </ActionIcon>

          {/* Management Actions - Only for ADMIN and above */}
          {(['OWNER', 'ADMIN'] as const).includes(userRole) && (
            <Menu position="bottom-end" withArrow>
              <Menu.Target>
                <Button variant="light" leftSection={<IconSettings size={16} />}>
                  Manage
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUsers size={16} />}>
                  User Management
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size={16} />}>
                  Organization Settings
                </Menu.Item>
                <Menu.Item leftSection={<IconDownload size={16} />}>
                  Export Data
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

      {/* Critical Alerts */}
      {overdueTotal > 0 && (
        <Alert
          variant="filled"
          color="red"
          title="Immediate Action Required"
          icon={<IconAlertTriangle size={16} />}
          mb="md"
        >
          <Text>
            <strong>{overdueTotal}</strong> inspections are overdue and may result in EPA violations. 
            Review projects requiring attention immediately.
          </Text>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg">
            <Stack gap="xs">
              <Group justify="space-between">
                <IconBuilding size={20} color="#0ea5e9" />
                <Badge variant="light" color="blue">
                  Projects
                </Badge>
              </Group>
              <Text size="xl" fw={700}>
                {stats.totalProjects}
              </Text>
              <Text size="sm" c="dimmed">
                {stats.activeProjects} active
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg">
            <Stack gap="xs">
              <Group justify="space-between">
                <IconClipboardCheck size={20} color="#10b981" />
                <Badge variant="light" color="green">
                  Inspections
                </Badge>
              </Group>
              <Text size="xl" fw={700}>
                {stats.totalInspections}
              </Text>
              <Text size="sm" c="dimmed">
                {stats.pendingInspections} pending
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg">
            <Stack gap="xs">
              <Group justify="space-between">
                <RingProgress
                  size={40}
                  thickness={4}
                  sections={[{ value: stats.complianceRate, color: complianceColor }]}
                />
                <Badge variant="light" color={complianceColor}>
                  Compliance
                </Badge>
              </Group>
              <Text size="xl" fw={700}>
                {Math.round(stats.complianceRate)}%
              </Text>
              <Text size="sm" c="dimmed">
                EPA compliance rate
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg">
            <Stack gap="xs">
              <Group justify="space-between">
                <IconUsers size={20} color="#8b5cf6" />
                <Badge variant="light" color="violet">
                  Team
                </Badge>
              </Group>
              <Text size="xl" fw={700}>
                {stats.totalUsers}
              </Text>
              <Text size="sm" c="dimmed">
                organization members
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        {/* Projects Overview - All Roles */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card shadow="sm" padding="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Title order={3}>Projects Overview</Title>
              <Group>
                <ActionIcon variant="light" size="sm">
                  <IconFilter size={14} />
                </ActionIcon>
                <ActionIcon variant="light" size="sm">
                  <IconEye size={14} />
                </ActionIcon>
              </Group>
            </Group>

            <Stack gap="md">
              {projects.slice(0, 6).map((project: any) => (
                <Card key={project.id} withBorder padding="md">
                  <Group justify="space-between">
                    <Stack gap={4}>
                      <Text fw={500}>{project.name}</Text>
                      <Group gap="xs">
                        <Badge 
                          variant="light" 
                          color={project.status === 'ACTIVE' ? 'green' : 'gray'}
                          size="xs"
                        >
                          {project.status}
                        </Badge>
                        {project.compliance.requiresAttention && (
                          <Badge variant="filled" color="red" size="xs">
                            Needs Attention
                          </Badge>
                        )}
                      </Group>
                    </Stack>

                    <Stack align="flex-end" gap={4}>
                      <Text size="sm" fw={500} c={complianceColor}>
                        {Math.round(project.compliance.overallScore)}% Compliant
                      </Text>
                      <Text size="xs" c="dimmed">
                        {project.recentInspections.length} recent inspections
                      </Text>
                    </Stack>
                  </Group>

                  <Progress
                    value={project.compliance.overallScore}
                    color={project.compliance.overallScore >= 80 ? 'green' : 'red'}
                    size="sm"
                    mt="xs"
                  />
                </Card>
              ))}

              {projects.length > 6 && (
                <Button variant="light" fullWidth>
                  View All {projects.length} Projects
                </Button>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Team & Analytics - Management Only */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md" h="100%">
            {(['OWNER', 'ADMIN', 'MANAGER'] as const).includes(userRole) && (
              <Card shadow="sm" padding="lg">
                <Title order={4} mb="md">Team Distribution</Title>
                <Stack gap="sm">
                  {stats.usersByRole.map((roleData: any) => (
                    <Group key={roleData.role} justify="space-between">
                      <Text size="sm" tt="capitalize">
                        {roleData.role.toLowerCase()}s
                      </Text>
                      <Badge variant="light" size="sm">
                        {roleData.count}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </Card>
            )}

            {/* Inspection Analytics */}
            <Card shadow="sm" padding="lg" style={{ flex: 1 }}>
              <Title order={4} mb="md">Inspection Types</Title>
              <Stack gap="sm">
                {stats.inspectionStats.map((inspectionType: any) => (
                  <div key={inspectionType.type}>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" tt="capitalize">
                        {inspectionType.type.replace('_', ' ').toLowerCase()}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {inspectionType.compliant}/{inspectionType.total}
                      </Text>
                    </Group>
                    <Progress
                      value={(inspectionType.compliant / inspectionType.total) * 100}
                      color={inspectionType.overdue > 0 ? 'red' : 'green'}
                      size="xs"
                    />
                  </div>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}