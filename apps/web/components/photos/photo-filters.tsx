'use client';

import {
  Group,
  Select,
  Button,
  ActionIcon,
  Collapse,
  Badge,
  Paper,
  TextInput,
  MultiSelect,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { IconX, IconFilter, IconFilterOff, IconMapPin, IconSearch } from '@tabler/icons-react';

/**
 * Filter options for photo gallery
 * Extended to support advanced search and filtering
 */
export interface PhotoFilters {
  projectId?: string;
  formType?: string;
  dateRange?: [Date, Date];
  hasGps?: boolean;
  search?: string;
  userId?: string;
  weather?: string[];
  gpsRadius?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
}

interface PhotoFiltersProps {
  filters: PhotoFilters;
  onChange: (filters: PhotoFilters) => void;
  hideProjectFilter?: boolean;
  showSearch?: boolean;
  showUserFilter?: boolean;
  showWeatherFilter?: boolean;
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
 * Fetch users for filter dropdown
 */
async function fetchUsers() {
  const response = await fetch('/api/users');
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.users || [];
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
 * Weather conditions for filter dropdown
 * Used for EPA compliance filtering (rain events trigger inspections)
 */
const weatherConditions = [
  { value: 'rain', label: 'Rain' },
  { value: 'sun', label: 'Sunny' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'storm', label: 'Storm' },
  { value: 'snow', label: 'Snow' },
  { value: 'fog', label: 'Fog' },
];

/**
 * PhotoFilters - Advanced filter controls for photo gallery
 *
 * Features:
 * - Project selection (optional, hidden on project-specific pages)
 * - Form type selection
 * - Date range picker
 * - GPS filter toggle
 * - Search by description/tags
 * - User filter
 * - Weather condition filter (for EPA compliance)
 * - Clear all filters
 * - Collapsible filter panel
 */
export function PhotoFilters({
  filters,
  onChange,
  hideProjectFilter = false,
  showSearch = false,
  showUserFilter = false,
  showWeatherFilter = false,
}: PhotoFiltersProps) {
  const [filtersOpen, { toggle: toggleFilters }] = useDisclosure(true);

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Fetch users for dropdown (only when user filter is shown)
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: showUserFilter,
  });

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0)
  ).length;

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
          {/* Search Input */}
          {showSearch && (
            <TextInput
              placeholder="Search descriptions/tags..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
              leftSection={<IconSearch size={16} />}
              w={220}
              size="sm"
            />
          )}

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

          {/* User Filter */}
          {showUserFilter && (
            <Select
              placeholder="All Users"
              value={filters.userId || null}
              onChange={(value) => updateFilter('userId', value || undefined)}
              data={users.map((u: { id: string; name: string }) => ({
                value: u.id,
                label: u.name,
              }))}
              clearable
              searchable
              w={180}
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

          {/* Weather Filter */}
          {showWeatherFilter && (
            <MultiSelect
              placeholder="Weather Conditions"
              value={filters.weather || []}
              onChange={(value) => updateFilter('weather', value.length > 0 ? value : undefined)}
              data={weatherConditions}
              clearable
              w={200}
              size="sm"
            />
          )}

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
