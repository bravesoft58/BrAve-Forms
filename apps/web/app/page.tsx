'use client';

import { Container, Title, Text, Badge } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="lg" py="xl">
      <div style={{ textAlign: 'center' }}>
        <Title order={1} size="h1" fw={700} c="blue.6" mb="xs">
          🏗️ BrAve Forms
        </Title>
        <Text size="xl" c="dimmed" fw={500} mb="md">
          Clean Development Environment Ready!
        </Text>
        <Badge size="lg" color="green" variant="light">
          Authentication Removed - Ready for Development
        </Badge>
        
        <div style={{ marginTop: '2rem' }}>
          <Text>
            ✅ All containers running<br/>
            ✅ Frontend: localhost:3005<br/>
            ✅ Backend: localhost:3002<br/>
            ✅ Database: localhost:5434<br/>
            ✅ No authentication barriers
          </Text>
        </div>
      </div>
    </Container>
  );
}