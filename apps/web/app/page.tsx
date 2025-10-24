'use client';

import { Text, Badge, rem, Button } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { Breadcrumbs } from '@/components/Layout/Breadcrumbs';

export default function HomePage() {
  return (
    <PageContainer
      title="Dashboard"
      breadcrumbs={<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />}
      actions={
        <Button
          size="compact-sm"
          variant="light"
          leftSection={<IconRefresh size={12} />}
          styles={{
            root: {
              fontSize: rem(11),
              height: rem(28),
              padding: `0 ${rem(10)}`,
            },
          }}
        >
          Refresh
        </Button>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <Text fw={600} c="blue.6" mb="xs" style={{ fontSize: rem(20), lineHeight: 1.3 }}>
          🏗️ BrAve Forms
        </Text>
        <Text c="dimmed" fw={500} mb="md" style={{ fontSize: rem(13), lineHeight: 1.4 }}>
          Clean Development Environment Ready!
        </Text>
        <Badge size="sm" color="green" variant="light" style={{ fontSize: rem(11) }}>
          Authentication Removed - Ready for Development
        </Badge>

        <div style={{ marginTop: rem(24) }}>
          <Text style={{ fontSize: rem(12), lineHeight: 1.6 }}>
            ✅ All containers running
            <br />
            ✅ Frontend: localhost:3005
            <br />
            ✅ Backend: localhost:3002
            <br />
            ✅ Database: localhost:5434
            <br />✅ No authentication barriers
          </Text>
        </div>
      </div>
    </PageContainer>
  );
}
