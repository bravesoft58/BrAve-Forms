'use client';

import { Container, Title, Text, Badge, rem } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="lg" py="md">
      <div style={{ textAlign: 'center' }}>
        <Title order={1} fw={600} c="blue.6" mb="xs" style={{ fontSize: rem(20), lineHeight: 1.3 }}>
          🏗️ BrAve Forms
        </Title>
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
    </Container>
  );
}
