'use client';

import { Stack, Group, Text, Badge, Card, Button } from '@mantine/core';
import { 
  IconMapPin, 
  IconCalendar, 
  IconDroplet,
  IconUser,
  IconChevronRight
} from '@tabler/icons-react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app.store';

// Mock inspection data - in real app this would come from API
const recentInspections = [
  {
    id: '1',
    projectName: 'Downtown Office Complex',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    type: 'Storm Water',
    status: 'completed',
    rainfall: 0.31,
    inspector: 'John Smith',
    violations: 0,
  },
  {
    id: '2',
    projectName: 'Residential Development - Phase 2',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    type: 'Weekly',
    status: 'completed',
    rainfall: 0,
    inspector: 'Sarah Johnson',
    violations: 1,
  },
  {
    id: '3',
    projectName: 'Industrial Warehouse',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    type: 'Storm Water',
    status: 'pending_review',
    rainfall: 0.45,
    inspector: 'Mike Davis',
    violations: 0,
  },
];

export function RecentInspections() {
  const appState = useAppStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending_review': return 'yellow';
      case 'overdue': return 'red';
      case 'in_progress': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending_review': return 'Pending Review';
      case 'overdue': return 'Overdue';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (recentInspections.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        No recent inspections found
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {recentInspections.map((inspection) => (
        <Card key={inspection.id} padding="md" radius="sm" withBorder>
          <Group justify="space-between" mb="sm">
            <div style={{ flex: 1 }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text fw={600} size="sm" lineClamp={1}>
                  {inspection.projectName}
                </Text>
                <Badge 
                  color={getStatusColor(inspection.status)} 
                  size="sm"
                  variant="light"
                >
                  {getStatusLabel(inspection.status)}
                </Badge>
              </Group>
              
              <Stack gap="xs">
                <Group gap="sm">
                  <Group gap="xs">
                    <IconCalendar size={14} color="var(--mantine-color-blue-6)" />
                    <Text size="xs" c="dimmed">
                      {formatDate(inspection.date)}
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconMapPin size={14} color="var(--mantine-color-green-6)" />
                    <Text size="xs" c="dimmed">
                      {inspection.type}
                    </Text>
                  </Group>
                </Group>
                
                <Group gap="sm">
                  <Group gap="xs">
                    <IconUser size={14} color="var(--mantine-color-gray-6)" />
                    <Text size="xs" c="dimmed">
                      {inspection.inspector}
                    </Text>
                  </Group>
                  
                  {inspection.rainfall > 0 && (
                    <Group gap="xs">
                      <IconDroplet size={14} color="var(--mantine-color-blue-6)" />
                      <Text size="xs" c="dimmed">
                        {inspection.rainfall}" rainfall
                      </Text>
                      {inspection.rainfall >= 0.25 && (
                        <Badge size="xs" color="orange" variant="dot">
                          EPA Trigger
                        </Badge>
                      )}
                    </Group>
                  )}
                </Group>
                
                {inspection.violations > 0 && (
                  <Group gap="xs">
                    <Text size="xs" c="red" fw={500}>
                      ⚠️ {inspection.violations} violation{inspection.violations > 1 ? 's' : ''} found
                    </Text>
                  </Group>
                )}
              </Stack>
            </div>
            
            <Button 
              variant="subtle" 
              size="sm" 
              rightSection={<IconChevronRight size={14} />}
              component={Link}
              href={`/inspections/${inspection.id}`}
            >
              View
            </Button>
          </Group>
        </Card>
      ))}

      {/* Show all inspections link */}
      <Group justify="center" mt="sm">
        <Button 
          variant="subtle" 
          component={Link} 
          href="/inspections"
        >
          View All Inspections
        </Button>
      </Group>

      {/* Offline status */}
      {appState.networkStatus === 'offline' && (
        <Text size="xs" c="orange" ta="center" mt="sm">
          ⚠️ Working offline - recent inspections may not be current
        </Text>
      )}
    </Stack>
  );
}