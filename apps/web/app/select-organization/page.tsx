'use client';

import { Container, Title, Text, Stack, Card, Button } from '@mantine/core';
import { IconBuilding, IconHelmet } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Organization Selection Page - Simplified for Initial Testing
 *
 * TODO: Replace with real Clerk OrganizationList when implementing production auth
 * For now, this is a placeholder that redirects to dashboard with mock auth
 */
export default function SelectOrganizationPage() {
  const router = useRouter();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl" align="center">
        {/* Header */}
        <Stack gap="md" align="center">
          <IconHelmet size={64} color="#0ea5e9" />
          <Title order={1} ta="center">
            Development Mode
          </Title>
          <Text size="lg" c="dimmed" ta="center" maw={600}>
            Authentication is simplified for initial testing. You are automatically logged in as a
            test administrator.
          </Text>
        </Stack>

        {/* Organization Selection */}
        <Card
          shadow="lg"
          padding="xl"
          radius="md"
          withBorder
          style={{ width: '100%', maxWidth: '800px' }}
        >
          <Stack gap="md" align="center">
            <Title order={3} ta="center">
              <IconBuilding size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Test Organization
            </Title>

            <Text size="sm" c="dimmed" ta="center">
              Currently logged in as: Admin User (dev-org-123)
            </Text>

            <Button
              size="lg"
              onClick={() => router.push('/dashboard')}
              style={{ minWidth: '200px' }}
            >
              Go to Dashboard
            </Button>

            <Text size="xs" c="dimmed" ta="center" mt="md">
              Note: Full organization management will be available in production release
            </Text>
          </Stack>
        </Card>

        {/* Footer Information */}
        <Stack gap="sm" align="center">
          <Text size="xs" c="dimmed" ta="center">
            BrAve Forms helps construction companies maintain EPA and OSHA compliance with automated
            inspections and regulatory tracking.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
