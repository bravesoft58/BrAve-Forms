'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Paper,
  Avatar,
  TextInput,
  Button,
  Badge,
  Alert,
  Loader,
  SimpleGrid,
} from '@mantine/core';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBuilding,
  IconShield,
  IconKey,
  IconTrash,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useAppAuth } from '@/app/providers';

/**
 * Profile Page
 *
 * Displays and allows editing of user profile information.
 * Connected to Clerk for authentication and user management.
 *
 * Sections:
 * 1. User Information (editable name, read-only email)
 * 2. Organization Info (read-only)
 * 3. Account Actions (password, 2FA, delete)
 */
export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { orgId, orgRole, isLoaded: isAuthLoaded } = useAppAuth();

  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phoneNumbers?.[0]?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update form state when user data loads
  useEffect(() => {
    if (isUserLoaded && user) {
      if (user.firstName && firstName === '') {
        setFirstName(user.firstName);
      }
      if (user.lastName && lastName === '') {
        setLastName(user.lastName);
      }
      if (user.phoneNumbers?.[0]?.phoneNumber && phone === '') {
        setPhone(user.phoneNumbers[0].phoneNumber);
      }
    }
  }, [isUserLoaded, user, firstName, lastName, phone]);

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await user.update({
        firstName,
        lastName,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update profile:', error);
      setSaveError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle open Clerk user profile (for password, 2FA, etc.)
  const handleOpenSecuritySettings = () => {
    openUserProfile();
  };

  // Get role display name
  const getRoleDisplay = (role: string): { label: string; color: string } => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Administrator', color: 'red' };
      case 'OFFICE_USER':
        return { label: 'Office User', color: 'blue' };
      case 'FIELD_USER':
        return { label: 'Field User', color: 'green' };
      case 'INSPECTOR':
        return { label: 'Inspector', color: 'violet' };
      default:
        return { label: role, color: 'gray' };
    }
  };

  // Loading state
  if (!isUserLoaded || !isAuthLoaded) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading profile...</Text>
        </Stack>
      </Container>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
          Please sign in to view your profile.
        </Alert>
      </Container>
    );
  }

  const roleInfo = getRoleDisplay(orgRole);

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} size="h2">
              Profile
            </Title>
            <Text c="dimmed" size="sm">
              Manage your account information
            </Text>
          </div>
        </Group>

        {/* Success/Error Alerts */}
        {saveSuccess && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            Profile updated successfully!
          </Alert>
        )}
        {saveError && (
          <Alert color="red" icon={<IconAlertTriangle size={16} />}>
            {saveError}
          </Alert>
        )}

        {/* User Information */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconUser size={20} />
              <Title order={3} size="h4">
                User Information
              </Title>
            </Group>

            <Group align="flex-start" gap="lg">
              {/* Avatar */}
              <Avatar src={user.imageUrl} size={80} radius="xl" color="blue">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </Avatar>

              {/* Form Fields */}
              <Stack gap="sm" style={{ flex: 1 }}>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label="First Name"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    leftSection={<IconUser size={16} />}
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    leftSection={<IconUser size={16} />}
                  />
                </SimpleGrid>

                <TextInput
                  label="Email"
                  value={user.primaryEmailAddress?.emailAddress || ''}
                  disabled
                  leftSection={<IconMail size={16} />}
                  description="Email is managed by your organization"
                />

                <TextInput
                  label="Phone Number"
                  value={phone || 'Not set'}
                  disabled
                  leftSection={<IconPhone size={16} />}
                  description="Manage via Security Settings (requires verification)"
                />

                <Group justify="flex-end" mt="xs">
                  <Button
                    onClick={handleSaveProfile}
                    loading={isSaving}
                    leftSection={<IconCheck size={16} />}
                  >
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </Group>
          </Stack>
        </Paper>

        {/* Organization Info */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconBuilding size={20} />
              <Title order={3} size="h4">
                Organization
              </Title>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <div>
                <Text size="sm" c="dimmed">
                  Organization ID
                </Text>
                <Text size="sm" ff="monospace">
                  {orgId || 'Not assigned'}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Your Role
                </Text>
                <Badge color={roleInfo.color} variant="light" size="lg">
                  {roleInfo.label}
                </Badge>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Member Since
                </Text>
                <Text size="sm">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Last Sign In
                </Text>
                <Text size="sm">
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
                </Text>
              </div>
            </SimpleGrid>
          </Stack>
        </Paper>

        {/* Account Security */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconShield size={20} />
              <Title order={3} size="h4">
                Account Security
              </Title>
            </Group>

            <Text size="sm" c="dimmed">
              Manage your password, two-factor authentication, and other security settings.
            </Text>

            <Group>
              <Button
                variant="light"
                leftSection={<IconKey size={16} />}
                onClick={handleOpenSecuritySettings}
              >
                Security Settings
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* Danger Zone */}
        <Paper p="lg" withBorder style={{ borderColor: 'var(--mantine-color-red-4)' }}>
          <Stack gap="md">
            <Group gap="xs">
              <IconTrash size={20} color="var(--mantine-color-red-6)" />
              <Title order={3} size="h4" c="red">
                Danger Zone
              </Title>
            </Group>

            <Text size="sm" c="dimmed">
              Once you delete your account, there is no going back. Please be certain.
            </Text>

            <Group>
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleOpenSecuritySettings}
              >
                Delete Account
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
