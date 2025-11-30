'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  Progress,
  FileButton,
  Modal,
  ThemeIcon,
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
  IconUpload,
} from '@tabler/icons-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useAppAuth } from '@/app/providers';

/**
 * Calculate profile completion percentage based on user data
 * Criteria:
 * - First name (20%)
 * - Last name (20%)
 * - Profile image (20%)
 * - Email verified (20%)
 * - Phone number (20%)
 */
export function calculateProfileCompletion(user: {
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  hasImage?: boolean;
  primaryEmailAddress?: { verification?: { status: string | null } | null } | null;
  phoneNumbers?: Array<{ phoneNumber?: string }> | null;
}): number {
  let score = 0;

  // First name (20%)
  if (user.firstName && user.firstName.trim() !== '') {
    score += 20;
  }

  // Last name (20%)
  if (user.lastName && user.lastName.trim() !== '') {
    score += 20;
  }

  // Profile image (20%) - check hasImage or if imageUrl is not the default Clerk avatar
  if (user.hasImage || (user.imageUrl && !user.imageUrl.includes('img.clerk.com/default'))) {
    score += 20;
  }

  // Email verified (20%)
  if (user.primaryEmailAddress?.verification?.status === 'verified') {
    score += 20;
  }

  // Phone number (20%)
  if (user.phoneNumbers && user.phoneNumbers.length > 0 && user.phoneNumbers[0]?.phoneNumber) {
    score += 20;
  }

  return score;
}

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
  const resetRef = useRef<() => void>(null);

  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phoneNumbers?.[0]?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Delete account modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.error(`Failed to update profile for user ${user.id}, org ${orgId}:`, errorMessage);
      setSaveError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle open Clerk user profile (for password, 2FA, etc.)
  const handleOpenSecuritySettings = () => {
    openUserProfile();
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !user) return;

    // Validate file exists and has content
    if (file.size === 0) {
      setAvatarError('Please select a valid image file');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError(
        `Image must be less than 10MB (current: ${Math.round(file.size / 1024 / 1024)}MB)`
      );
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      await user.setProfileImage({ file });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      resetRef.current?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.error(
        `Failed to upload avatar for user ${user.id}: ` +
          `fileSize=${file.size}, fileType=${file.type}, error=${errorMessage}`
      );
      setAvatarError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;

    setIsDeleting(true);

    try {
      await user.delete();
      // User will be automatically signed out and redirected
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.error(`Failed to delete account for user ${user.id}, org ${orgId}:`, errorMessage);
      setSaveError('Failed to delete account. Please try again or contact support.');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate profile completion (memoized)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only recompute when specific fields change
  const profileCompletion = useMemo(() => {
    return user ? calculateProfileCompletion(user) : 0;
  }, [
    user?.firstName,
    user?.lastName,
    user?.hasImage,
    user?.imageUrl,
    user?.primaryEmailAddress?.verification?.status,
    user?.phoneNumbers,
  ]);

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
        {/* Page Header with Profile Completion */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} size="h2">
              Profile
            </Title>
            <Text c="dimmed" size="sm">
              Manage your account information
            </Text>
          </div>
          <Paper p="md" withBorder style={{ minWidth: 200 }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Profile Completion
                </Text>
                <Text size="sm" fw={600} c={profileCompletion === 100 ? 'green' : 'blue'}>
                  {profileCompletion}%
                </Text>
              </Group>
              <Progress
                value={profileCompletion}
                color={profileCompletion === 100 ? 'green' : 'blue'}
                size="sm"
                radius="xl"
              />
              {profileCompletion < 100 && (
                <Text size="xs" c="dimmed">
                  Complete your profile for better team visibility
                </Text>
              )}
            </Stack>
          </Paper>
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
              {/* Avatar with Upload */}
              <Stack align="center" gap="xs">
                <Avatar src={user.imageUrl} size={100} radius="xl" color="blue">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </Avatar>
                <FileButton resetRef={resetRef} onChange={handleAvatarUpload} accept="image/*">
                  {(props) => (
                    <Button
                      {...props}
                      variant="light"
                      size="md"
                      leftSection={<IconUpload size={16} />}
                      loading={isUploadingAvatar}
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      Upload Photo
                    </Button>
                  )}
                </FileButton>
                {avatarError && (
                  <Text size="xs" c="red">
                    {avatarError}
                  </Text>
                )}
              </Stack>

              {/* Form Fields */}
              <Stack gap="sm" style={{ flex: 1 }}>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label="First Name"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value.slice(0, 50))}
                    leftSection={<IconUser size={16} />}
                    maxLength={50}
                    error={firstName.length >= 50 ? 'Maximum 50 characters' : undefined}
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value.slice(0, 50))}
                    leftSection={<IconUser size={16} />}
                    maxLength={50}
                    error={lastName.length >= 50 ? 'Maximum 50 characters' : undefined}
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
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      {/* Delete Account Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light" size="lg">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
            <Text fw={600}>Delete Account</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />}>
            This action is permanent and cannot be undone.
          </Alert>

          <Text size="sm">Deleting your account will:</Text>

          <Stack gap="xs" pl="md">
            <Text size="sm" c="dimmed">
              - Remove all your personal data
            </Text>
            <Text size="sm" c="dimmed">
              - Remove you from your organization
            </Text>
            <Text size="sm" c="dimmed">
              - Delete all your form submissions (if not required for compliance)
            </Text>
            <Text size="sm" c="dimmed">
              - Revoke access to all projects
            </Text>
          </Stack>

          <TextInput
            label="Type DELETE to confirm"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            error={
              deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE'
                ? 'Please type DELETE exactly'
                : undefined
            }
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              disabled={deleteConfirmText !== 'DELETE'}
              leftSection={<IconTrash size={16} />}
            >
              Delete My Account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
