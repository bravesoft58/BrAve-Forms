'use client';

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from '@clerk/nextjs';
import { Group, Button, Text, Stack, Badge } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';

export function AuthHeader() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 1000,
        padding: '16px 24px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '0 0 0 12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '280px',
      }}
    >
      <SignedOut>
        <Group gap="md">
          <SignInButton mode="modal">
            <Button
              size="md"
              variant="filled"
              style={{
                minHeight: '48px',
                fontSize: '16px',
                fontWeight: 600,
                minWidth: '120px',
              }}
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              size="md"
              variant="outline"
              style={{
                minHeight: '48px',
                fontSize: '16px',
                fontWeight: 600,
                minWidth: '120px',
              }}
            >
              Sign Up
            </Button>
          </SignUpButton>
        </Group>
      </SignedOut>
      <SignedIn>
        <OrganizationContext />
      </SignedIn>
    </header>
  );
}

function OrganizationContext() {
  const { orgId, orgRole, orgSlug } = useAuth();

  return (
    <Stack gap="sm" align="flex-end">
      {/* User Button - Organization switching removed for single-tenant deployment */}
      <Group gap="md" align="center">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: '48px',
                height: '48px',
              },
              userButtonTrigger: {
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              },
            },
          }}
          afterSignOutUrl="/"
          showName
        />
      </Group>

      {/* Organization Context Display */}
      {orgId && (
        <Group gap="xs" style={{ fontSize: '12px', color: '#6b7280' }}>
          <IconBuilding size={14} />
          <Text size="xs" c="dimmed">
            Construction Company: {orgSlug || 'Q&D Construction'}
          </Text>
          {orgRole && (
            <Badge size="xs" variant="light" color="blue">
              {orgRole.toLowerCase()}
            </Badge>
          )}
        </Group>
      )}
    </Stack>
  );
}
