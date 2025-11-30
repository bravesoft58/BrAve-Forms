'use client';

import { Paper, Stack, Group, Text, Badge } from '@mantine/core';
import { IconCloudRain, IconAlertTriangle } from '@tabler/icons-react';
import type { Project } from '@/lib/api/projects';

interface ProjectCardProps {
  project: Project;
}

/**
 * ProjectCard Component (ISSUE-086, Updated ISSUE-170)
 *
 * Displays project information in a clickable card with:
 * - Project name, address, status
 * - Weather alert based on compliance data
 * - Compliance badges for pending/overdue inspections
 * - Navigation to project detail page
 *
 * ISSUE-170: Updated to use real GraphQL API Project type
 *
 * Field Optimization:
 * - Large touch targets for glove-friendly use
 * - High contrast for outdoor visibility
 * - Adequate spacing between elements
 */
export function ProjectCard({ project }: ProjectCardProps) {
  // Check for compliance attention needed (replaces recentRainfall check)
  const hasComplianceAlert = project.compliance.requiresAttention;
  const hasOverdueInspections = project.compliance.overdueInspections > 0;

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
        {/* Project Name + Alert Icon - EXPLICIT PIXEL STRINGS */}
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="14px" lineClamp={1}>
            {project.name}
          </Text>

          {/* Overdue Alert Icon (EPA CGP compliance) */}
          {hasOverdueInspections && (
            <IconAlertTriangle
              size={20}
              color="red"
              data-testid="overdue-alert-icon"
              style={{ flexShrink: 0 }}
            />
          )}

          {/* Weather/Compliance Alert Icon */}
          {!hasOverdueInspections && hasComplianceAlert && (
            <IconCloudRain
              size={20}
              color="orange"
              data-testid="weather-alert-icon"
              style={{ flexShrink: 0 }}
            />
          )}
        </Group>

        {/* Address - EXPLICIT PIXEL STRING */}
        <Text size="13px" c="dimmed" lineClamp={1}>
          {project.address}
        </Text>

        {/* Status and Compliance Badges */}
        <Group gap="xs" mt="xs">
          <Badge
            size="sm"
            variant="light"
            color={project.status === 'ACTIVE' ? 'blue' : project.status === 'CLOSED' ? 'gray' : 'yellow'}
          >
            {project.status}
          </Badge>

          {project.compliance.overdueInspections > 0 && (
            <Badge size="sm" variant="light" color="red">
              {project.compliance.overdueInspections} overdue
            </Badge>
          )}

          {project.compliance.pendingInspections > 0 && project.compliance.overdueInspections === 0 && (
            <Badge
              size="sm"
              variant="light"
              color={project.compliance.requiresAttention ? 'orange' : 'yellow'}
            >
              {project.compliance.pendingInspections} pending
            </Badge>
          )}

          {/* Compliance Score Badge */}
          {project.compliance.overallScore < 80 && (
            <Badge size="sm" variant="light" color="red">
              {Math.round(project.compliance.overallScore)}% score
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
