'use client';

import { Paper, Stack, Group, Text, Badge } from '@mantine/core';
import { IconCloudRain } from '@tabler/icons-react';
import type { MockProject } from '@/lib/mock-data/projects';

interface ProjectCardProps {
  project: MockProject;
}

/**
 * ProjectCard Component (ISSUE-086)
 *
 * Displays project information in a clickable card with:
 * - Project name, address, status
 * - Weather alert icon when rainfall >= 0.25" (EPA CGP threshold)
 * - Compliance badges for pending inspections
 * - Favorite star indicator
 * - Navigation to project detail page
 *
 * Field Optimization:
 * - Large touch targets for glove-friendly use
 * - High contrast for outdoor visibility
 * - Adequate spacing between elements
 */
export function ProjectCard({ project }: ProjectCardProps) {
  // EPA CGP threshold: 0.25 inches triggers inspection requirement
  const hasWeatherAlert = project.recentRainfall >= 0.25;

  return (
    <Paper
      component="a"
      href={`/dashboard/projects/${project.id}`}
      p="md"
      withBorder
      style={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        textDecoration: 'none',
        color: 'inherit',
      }}
      className="hover:shadow-md"
    >
      <Stack gap="xs">
        {/* Project Name + Weather Alert Icon - EXPLICIT PIXEL STRINGS */}
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="14px" lineClamp={1}>
            {project.name}
          </Text>

          {/* Weather Alert Icon (EPA CGP 0.25" threshold) */}
          {hasWeatherAlert && (
            <IconCloudRain
              size={20}
              color="orange"
              data-testid="weather-alert-icon"
              style={{ flexShrink: 0 }}
            />
          )}

          {/* Favorite Star */}
          {!hasWeatherAlert && project.isFavorite && (
            <Text size="16px" style={{ flexShrink: 0 }}>
              ⭐
            </Text>
          )}
        </Group>

        {/* Address - EXPLICIT PIXEL STRING */}
        <Text size="13px" c="dimmed" lineClamp={1}>
          {project.address}
        </Text>

        {/* Status and Compliance Badges */}
        <Group gap="xs" mt="xs">
          <Badge size="sm" variant="light" color={project.status === 'ACTIVE' ? 'blue' : 'gray'}>
            {project.status}
          </Badge>

          {project.compliance.pendingInspections > 0 && (
            <Badge
              size="sm"
              variant="light"
              color={project.compliance.requiresAttention ? 'red' : 'yellow'}
            >
              {project.compliance.pendingInspections} pending
            </Badge>
          )}
        </Group>

        {/* Start Date - EXPLICIT PIXEL STRING */}
        <Text size="11px" c="dimmed" mt="xs">
          Started {new Date(project.startDate).toLocaleDateString()}
        </Text>
      </Stack>
    </Paper>
  );
}
