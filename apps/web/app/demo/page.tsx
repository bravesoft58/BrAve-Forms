'use client';

import React from 'react';
import { Container, Title, Text, Card, Grid, Badge, Button, Group, Stack } from '@mantine/core';
import { IconDroplet, IconForms, IconUsers, IconShield, IconMobiledata, IconBolt } from '@tabler/icons-react';

export default function DemoPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Title order={1} size="3rem" fw={900} mb="md">
            🏗️ BrAve Forms
          </Title>
          <Title order={2} c="dimmed" fw={400}>
            EPA Compliance Platform for Construction Sites
          </Title>
          <Text size="xl" c="dimmed" mt="md">
            Preventing $25,000-$50,000 daily EPA fines with automated 0.25" rain monitoring
          </Text>
        </div>

        {/* Sprint 2 Completion Status */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="lg">Sprint 2 Status: COMPLETED ✅</Text>
            <Badge color="green" variant="filled">100% Complete</Badge>
          </Group>
          <Text size="sm" c="dimmed">
            All Sprint 2 objectives delivered: Web Dashboard, Form Builder, Weather Monitoring, 
            Multi-tenant Architecture, and Mobile Optimization
          </Text>
        </Card>

        {/* Sprint 2 Features Grid */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Group gap="sm" mb="md">
                <IconDroplet size={32} color="#2196F3" />
                <Title order={3}>Weather Monitoring</Title>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Real-time EPA CGP compliance with EXACTLY 0.25" precipitation threshold monitoring.
                NOAA primary + OpenWeatherMap fallback integration.
              </Text>
              <Badge color="blue" variant="light">EPA Compliant</Badge>
              <Badge color="green" variant="light" ml="xs">Real-time</Badge>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Group gap="sm" mb="md">
                <IconForms size={32} color="#FF9800" />
                <Title order={3}>Form Builder Core</Title>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Drag-and-drop EPA inspection form creation with 20+ field types.
                SWPPP templates, photo capture with GPS, digital signatures.
              </Text>
              <Badge color="orange" variant="light">Drag & Drop</Badge>
              <Badge color="purple" variant="light" ml="xs">EPA Fields</Badge>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Group gap="sm" mb="md">
                <IconUsers size={32} color="#4CAF50" />
                <Title order={3}>Multi-tenant Architecture</Title>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Complete data isolation between construction companies.
                Role-based permissions: Owner → Admin → Manager → Member → Inspector.
              </Text>
              <Badge color="green" variant="light">Secure</Badge>
              <Badge color="teal" variant="light" ml="xs">Isolated</Badge>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Group gap="sm" mb="md">
                <IconMobiledata size={32} color="#E91E63" />
                <Title order={3}>Mobile Optimization</Title>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Construction site optimized: 56px+ touch targets, high contrast for sunlight,
                works with gloves, 30-day offline capability.
              </Text>
              <Badge color="pink" variant="light">Glove-Friendly</Badge>
              <Badge color="yellow" variant="light" ml="xs">Sunlight</Badge>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Technical Stack */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconBolt size={32} color="#9C27B0" />
            <Title order={3}>Technical Architecture</Title>
          </Group>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={500} mb="xs">Frontend</Text>
              <Text size="sm" c="dimmed">
                • Next.js 14 (App Router)<br/>
                • Mantine v7 Components<br/>
                • TanStack Query v5<br/>
                • Apollo Client v4<br/>
                • TypeScript 5.x
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={500} mb="xs">Backend</Text>
              <Text size="sm" c="dimmed">
                • NestJS 10.x + GraphQL<br/>
                • PostgreSQL 15 + TimescaleDB<br/>
                • Prisma ORM 5.x<br/>
                • BullMQ + Redis<br/>
                • Clerk Authentication
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={500} mb="xs">Infrastructure</Text>
              <Text size="sm" c="dimmed">
                • Docker Containerized<br/>
                • MinIO Object Storage<br/>
                • Multi-tenant PostgreSQL RLS<br/>
                • 30-day Offline Capability<br/>
                • EPA Compliance Validated
              </Text>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Agent Coordination Results */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconShield size={32} color="#FF5722" />
            <Title order={3}>Agent Coordination Success</Title>
          </Group>
          <Text mb="md">Successfully coordinated 9 specialized agents in Sprint 2:</Text>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm">
                ✅ <strong>frontend-ux-developer</strong> - Next.js foundation<br/>
                ✅ <strong>security-compliance-officer</strong> - Authentication<br/>
                ✅ <strong>api-integration-architect</strong> - GraphQL client<br/>
                ✅ <strong>weather-integration-specialist</strong> - EPA monitoring<br/>
                ✅ <strong>forms-engine-developer</strong> - Form builder core
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm">
                ✅ <strong>multi-tenant-architect</strong> - Data isolation<br/>
                ✅ <strong>mobile-app-builder</strong> - Construction optimization<br/>
                ✅ <strong>performance-optimizer</strong> - Speed optimization<br/>
                ✅ <strong>project-manager</strong> - Coordination & delivery
              </Text>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Action Links */}
        <Group justify="center" mt="xl">
          <a 
            href="http://localhost:3002/graphql" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            View GraphQL API
          </a>
          <a 
            href="http://localhost:9001" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#FF9800',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              textAlign: 'center',
              border: '2px solid #FF9800',
              marginLeft: '16px'
            }}
          >
            MinIO Storage Console
          </a>
        </Group>

        {/* Footer */}
        <Text size="sm" c="dimmed" ta="center" mt="xl">
          Sprint 2 completed with containerized infrastructure, EPA compliance validation,
          and construction site optimization. Ready for Sprint 3!
        </Text>
      </Stack>
    </Container>
  );
}