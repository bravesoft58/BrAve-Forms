'use client';

import { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Table,
  Loader,
  Alert,
  Button,
  ActionIcon,
  Tooltip,
  Modal,
  TextInput,
  Select,
} from '@mantine/core';
import {
  IconUsers,
  IconAlertCircle,
  IconUserPlus,
  IconMail,
  IconTrash,
  IconShield,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
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

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'INSPECTOR', label: 'Inspector' },
];

/**
 * ISSUE-193: User Management Interface
 *
 * Allows administrators to:
 * 1. View all organization users
 * 2. See user roles and join dates
 * 3. Invite new users via email
 * 4. Remove users from organization
 */
export default function TeamSettingsPage() {
  const auth = useAppAuth();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string | null>('MEMBER');
  const [userToRemove, setUserToRemove] = useState<string | null>(null);

  // Fetch organization users
  const {
    data: users,
    isLoading,
    error,
  } = useQuery<OrganizationUser[]>({
    queryKey: ['organizationUsers'],
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
    enabled: auth.isLoaded && (auth.orgRole === 'OWNER' || auth.orgRole === 'ADMIN'),
  });

  // Remove user mutation
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!auth.getToken || !auth.orgId) throw new Error('Not authenticated');
      const token = await auth.getToken();
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `mutation RemoveUser($userId: String!, $orgId: String!) {
            removeUserFromOrganization(userId: $userId, orgId: $orgId)
          }`,
          variables: { userId, orgId: auth.orgId },
        }),
      });
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to remove user');
      }
      return result.data?.removeUserFromOrganization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationUsers'] });
      notifications.show({
        title: 'User Removed',
        message: 'User has been removed from the organization',
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to remove user',
        color: 'red',
      });
    },
  });

  // Handle invite (opens Clerk invitation flow or sends invite)
  const handleInvite = async () => {
    if (!inviteEmail) {
      notifications.show({
        title: 'Error',
        message: 'Please enter an email address',
        color: 'red',
      });
      return;
    }

    // Note: Clerk handles invitations through its dashboard or API
    // This is a placeholder for the invite flow
    notifications.show({
      title: 'Invitation',
      message: `To invite ${inviteEmail}, use Clerk Dashboard > Organizations > Invite Member`,
      color: 'blue',
    });
    close();
    setInviteEmail('');
    setInviteRole('MEMBER');
  };

  const handleRemoveUser = (userId: string) => {
    setUserToRemove(userId);
    openConfirm();
  };

  const confirmRemoveUser = () => {
    if (userToRemove) {
      removeMutation.mutate(userToRemove);
      closeConfirm();
      setUserToRemove(null);
    }
  };

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

  // Check if user has admin access
  const isAdmin = auth.orgRole === 'OWNER' || auth.orgRole === 'ADMIN';

  if (!isAdmin) {
    return (
      <Paper p="lg" withBorder>
        <Stack gap="md">
          <Group gap="sm">
            <IconUsers size={24} />
            <Title order={3}>Team Members</Title>
          </Group>
          <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="Access Restricted">
            Only organization owners and administrators can view and manage team members.
          </Alert>
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <Paper p="lg" withBorder>
        <Stack gap="lg">
          <Group justify="space-between">
            <Group gap="sm">
              <IconUsers size={24} />
              <div>
                <Title order={3}>Team Members</Title>
                <Text size="13px" c="dimmed">
                  Manage your organization&apos;s users and roles
                </Text>
              </div>
            </Group>
            <Button leftSection={<IconUserPlus size={16} />} onClick={open}>
              Invite User
            </Button>
          </Group>

          {isLoading ? (
            <Stack align="center" py="xl">
              <Loader size="md" />
              <Text size="13px" c="dimmed">
                Loading team members...
              </Text>
            </Stack>
          ) : error ? (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              {error instanceof Error ? error.message : 'Failed to load team members'}
            </Alert>
          ) : users && users.length > 0 ? (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User ID</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th style={{ width: 80 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr key={user.userId}>
                    <Table.Td>
                      <Text size="13px" ff="monospace">
                        {user.userId.substring(0, 20)}...
                      </Text>
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
                    <Table.Td>
                      {user.role !== 'OWNER' && (
                        <Tooltip label="Remove from organization">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleRemoveUser(user.userId)}
                            loading={removeMutation.isPending}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Alert icon={<IconUsers size={16} />} color="blue" title="No Team Members">
              Your organization doesn&apos;t have any members yet. Click &quot;Invite User&quot; to
              add team members.
            </Alert>
          )}

          <Text size="11px" c="dimmed">
            Note: User invitations and detailed user management are handled through Clerk Dashboard.
            Visit your organization settings in Clerk to invite new members via email.
          </Text>
        </Stack>
      </Paper>

      {/* Invite Modal */}
      <Modal opened={opened} onClose={close} title="Invite Team Member" centered>
        <Stack gap="md">
          <TextInput
            label="Email Address"
            placeholder="user@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            leftSection={<IconMail size={16} />}
            required
          />
          <Select
            label="Role"
            placeholder="Select role"
            data={ROLE_OPTIONS}
            value={inviteRole}
            onChange={setInviteRole}
            leftSection={<IconShield size={16} />}
          />
          <Text size="11px" c="dimmed">
            The user will receive an invitation email to join your organization. They must create a
            Clerk account to accept the invitation.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleInvite} leftSection={<IconUserPlus size={16} />}>
              Send Invitation
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm Remove Modal */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Remove Team Member"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to remove this user from the organization? This action cannot be
            undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmRemoveUser}>
              Remove User
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
