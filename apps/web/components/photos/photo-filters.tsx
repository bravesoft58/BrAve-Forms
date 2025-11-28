'use client';

import { Group, Select, Button, ActionIcon, Collapse, Badge, Paper } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { IconX, IconFilter, IconFilterOff, IconMapPin } from '@tabler/icons-react';

/**
 * Filter options for photo gallery
 */
export interface PhotoFilters {
  projectId?: string;
  formType?: string;
  dateRange?: [Date, Date];
  hasGps?: boolean;
}

interface PhotoFiltersProps {
  filters: PhotoFilters;
  onChange: (filters: PhotoFilters) => void;
  hideProjectFilter?: boolean;
}

/**
 * Fetch projects for filter dropdown
 */
async function fetchProjects() {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.projects || [];
}

/**
 * Form types for filter dropdown
 */
const formTypes = [
  { value: 'daily-log', label: 'Daily Log' },
  { value: 'safety-inspection', label: 'Safety Inspection' },
  { value: 'swppp-inspection', label: 'SWPPP Inspection' },
  { value: 'equipment-checklist', label: 'Equipment Checklist' },
  { value: 'concrete-pour', label: 'Concrete Pour' },
];

/**
 * PhotoFilters - Filter controls for photo gallery
 *
 * Features:
 * - Project selection (optional, hidden on project-specific pages)
 * - Form type selection
 * - Date range picker
 * - GPS filter toggle
 * - Clear all filters
 */
export function PhotoFilters({ filters, onChange, hideProjectFilter = false }: PhotoFiltersProps) {
  const [filtersOpen, { toggle: toggleFilters }] = useDisclosure(true);

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    onChange({});
  };

  // Update single filter
  const updateFilter = <K extends keyof PhotoFilters>(key: K, value: PhotoFilters[K]) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  // Toggle GPS filter
  const toggleGpsFilter = () => {
    updateFilter('hasGps', filters.hasGps ? undefined : true);
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb={filtersOpen ? 'md' : 0}>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={toggleFilters}
            title={filtersOpen ? 'Hide filters' : 'Show filters'}
          >
            {filtersOpen ? <IconFilterOff size={18} /> : <IconFilter size={18} />}
          </ActionIcon>

          {activeFilterCount > 0 && (
            <Badge size="sm" variant="filled" color="blue">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </Badge>
          )}
        </Group>

        {activeFilterCount > 0 && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconX size={14} />}
            onClick={clearFilters}
          >
            Clear all
          </Button>
        )}
      </Group>

      <Collapse in={filtersOpen}>
        <Group gap="md" wrap="wrap">
          {/* Project Filter */}
          {!hideProjectFilter && (
            <Select
              placeholder="All Projects"
              value={filters.projectId || null}
              onChange={(value) => updateFilter('projectId', value || undefined)}
              data={projects.map((p: { id: string; name: string }) => ({
                value: p.id,
                label: p.name,
              }))}
              clearable
              searchable
              w={200}
              size="sm"
            />
          )}

          {/* Form Type Filter */}
          <Select
            placeholder="All Form Types"
            value={filters.formType || null}
            onChange={(value) => updateFilter('formType', value || undefined)}
            data={formTypes}
            clearable
            w={180}
            size="sm"
          />

          {/* Date Range Filter */}
          <DatePickerInput
            type="range"
            placeholder="Date Range"
            value={filters.dateRange || [null, null]}
            onChange={(value) => {
              if (value && value[0] && value[1]) {
                updateFilter('dateRange', value as [Date, Date]);
              } else {
                updateFilter('dateRange', undefined);
              }
            }}
            clearable
            w={220}
            size="sm"
          />

          {/* GPS Filter Toggle */}
          <Button
            variant={filters.hasGps ? 'filled' : 'light'}
            size="sm"
            leftSection={<IconMapPin size={14} />}
            onClick={toggleGpsFilter}
          >
            GPS Only
          </Button>
        </Group>
      </Collapse>
    </Paper>
  );
}

export default PhotoFilters;
