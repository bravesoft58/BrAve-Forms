import { OrganizationList } from '@clerk/nextjs';
import { Container, Title, Text, Stack, Card } from '@mantine/core';
import { IconBuilding, IconHelmet } from '@tabler/icons-react';

/**
 * Organization Selection Page
 * 
 * This page is shown when users need to:
 * 1. Join an existing construction company
 * 2. Create a new construction company organization
 * 3. Switch between organizations they're already part of
 * 
 * Enforces the CLAUDE.md requirement that personal accounts are disabled.
 */
export default function SelectOrganizationPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl" align="center">
        {/* Header */}
        <Stack gap="md" align="center">
          <IconHelmet size={64} color="#0ea5e9" />
          <Title order={1} ta="center">
            Select Your Construction Company
          </Title>
          <Text size="lg" c="dimmed" ta="center" maw={600}>
            BrAve Forms requires you to be part of a construction company organization 
            to manage EPA and OSHA compliance. Choose an existing company or create a new one.
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
          <Stack gap="md">
            <Title order={3} ta="center">
              <IconBuilding size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Construction Companies
            </Title>
            
            <Text size="sm" c="dimmed" ta="center">
              Join an existing company or create a new one to get started with compliance management.
            </Text>

            <OrganizationList
              appearance={{
                elements: {
                  organizationListPreviewButton: {
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    minHeight: '60px',
                    '&:hover': {
                      backgroundColor: '#f9fafb',
                      borderColor: '#0ea5e9',
                    },
                  },
                  organizationListCreateOrganizationButton: {
                    backgroundColor: '#0ea5e9',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    minHeight: '60px',
                    '&:hover': {
                      backgroundColor: '#0284c7',
                    },
                  },
                  card: {
                    boxShadow: 'none',
                    border: 'none',
                  },
                  pageScrollBox: {
                    padding: '0',
                  },
                },
                layout: {
                  shimmer: false,
                },
              }}
              hidePersonal // Enforce organization-only access per CLAUDE.md
              skipInvitationScreen={false}
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
            />
          </Stack>
        </Card>

        {/* Footer Information */}
        <Stack gap="sm" align="center">
          <Text size="sm" c="dimmed" ta="center">
            Need help? Contact your construction company administrator.
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            BrAve Forms helps construction companies maintain EPA and OSHA compliance 
            with automated inspections and regulatory tracking.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}