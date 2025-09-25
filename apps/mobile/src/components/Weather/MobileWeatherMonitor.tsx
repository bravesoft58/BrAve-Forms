import React from 'react';
import { Container, Card, Title, Text, Badge, Group } from '@mantine/core';
import { IconCloudRain, IconDroplet } from '@tabler/icons-react';

export function MobileWeatherMonitor() {
  return (
    <Container size="lg" p="md">
      <Card shadow="sm" p="md" mb="md">
        <Group gap="md">
          <IconCloudRain size={32} color="#0ea5e9" />
          <div>
            <Title order={2}>Weather Monitoring</Title>
            <Text c="dimmed">EPA CGP Compliance • 0.25" Threshold</Text>
          </div>
        </Group>
      </Card>

      <Card shadow="sm" p="md" className="weather-critical">
        <Group gap="md" mb="md">
          <IconDroplet size={24} />
          <div>
            <Text size="lg" fw={700}>Last 24 Hours Rainfall</Text>
            <Text size="xl" fw={900}>0.31"</Text>
            <Badge color="red" variant="filled">
              EPA Threshold Exceeded
            </Badge>
          </div>
        </Group>

        <Text>
          Inspection required within 24 hours during working hours per EPA CGP requirements.
        </Text>
      </Card>
    </Container>
  );
}