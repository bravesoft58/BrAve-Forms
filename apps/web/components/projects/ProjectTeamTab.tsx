'use client';

import { Text, Stack, Group, Badge, Table, Loader, Alert, Paper, Avatar } from '@mantine/core';
import { IconUsers, IconAlertCircle, IconShield } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';

interface OrganizationUser {
  userId: string;
  role: string;
  joinedAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'red',
  ADMIN: 'orange',
  MANAGER: 'blue',
  MEMBER: 'green',
  INSPECTOR: 'gray',
};

/**
 * ISSUE-194: Project Team Tab Component
 *
 * Displays organization users that have access to this project.
 * Currently shows all org members since project-level assignments
 * are managed at the organization level.
 */
export function ProjectTeamTab({ projectId }: { projectId: string }) {
  const auth = useAppAuth();

  // Fetch organization users - these users have access to projects in their org
  const {
    data: users,
    isLoading,
    error,
  } = useQuery<OrganizationUser[]>({
    queryKey: ['organizationUsers', projectId],
    queryFn: async () => {
      if (!auth.getToken) return [];
      const token = await auth.getToken();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query GetOrganizationUsers {
            organizationUsers
          }`,
        }),
      });
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to fetch users');
      }
      // Parse the JSON strings returned by the API
      const userData = result.data?.organizationUsers || [];
      return userData.map((u: string) => {
        try {
          return typeof u === 'string' ? JSON.parse(u) : u;
        } catch {
          return { userId: u, role: 'MEMBER', joinedAt: new Date().toISOString() };
        }
      });
    },
    enabled: auth.isLoaded,
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getUserInitials = (userId: string) => {
    // Generate initials from userId (first 2 characters)
    return userId.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Stack gap="md" data-testid="team-tab-content">
        <Stack align="center" py="xl">
          <Loader size="md" />
          <Text size="13px" c="dimmed">
            Loading team members...
          </Text>
        </Stack>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap="md" data-testid="team-tab-content">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          {error instanceof Error ? error.message : 'Failed to load team members'}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="md" data-testid="team-tab-content">
      <Group gap="sm">
        <IconUsers size={20} />
        <Text fw={600} size="14px">
          Project Team
        </Text>
        {users && users.length > 0 && (
          <Badge variant="light" size="sm">
            {users.length} member{users.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </Group>

      <Text size="12px" c="dimmed">
        Organization members with access to this project. User permissions are managed at the
        organization level.
      </Text>

      {users && users.length > 0 ? (
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Joined</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((user) => (
                <Table.Tr key={user.userId}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color="blue">
                        {getUserInitials(user.userId)}
                      </Avatar>
                      <Text size="13px" ff="monospace">
                        {user.userId.substring(0, 16)}...
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={ROLE_COLORS[user.role] || 'gray'}
                      variant="light"
                      leftSection={<IconShield size={12} />}
                    >
                      {user.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="13px" c="dimmed">
                      {formatDate(user.joinedAt)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : (
        <Alert icon={<IconUsers size={16} />} color="blue" title="No Team Members">
          No team members found in this organization.
        </Alert>
      )}

      <Text size="11px" c="dimmed">
        Project-specific user assignments can be configured in Settings &gt; Team. All organization
        members have access based on their role level.
      </Text>
    </Stack>
  );
}
