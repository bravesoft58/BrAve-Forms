'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack,
  Group,
  SegmentedControl,
  TextInput,
  SimpleGrid,
  Paper,
  Text,
  Badge,
  Loader,
  Alert,
} from '@mantine/core';
import { IconSearch, IconForms, IconAlertCircle } from '@tabler/icons-react';
import { useFormTemplates, FormCategory } from '@/hooks/useFormTemplates';

// Map API categories to display-friendly names
const categoryDisplayMap: Record<FormCategory | 'all', string> = {
  all: 'All',
  EPA_SWPPP: 'EPA SWPPP',
  EPA_CGP: 'EPA CGP',
  OSHA_SAFETY: 'OSHA Safety',
  STATE_PERMIT: 'State Permit',
  CUSTOM: 'Custom',
};

// Map display categories to API categories for filtering
type DisplayCategory = 'all' | 'epa' | 'osha' | 'state' | 'custom';

interface TemplateSelectorProps {
  projectId: string;
}

/**
 * Template Selector Component (ISSUE-088)
 *
 * Displays a grid of available form templates with:
 * - Category filtering (All, EPA, OSHA, State, Custom)
 * - Search by template name/description
 * - Template cards showing icon, name, description, category badge
 * - Click to navigate to form fill page
 * - Responsive grid layout
 *
 * Field Optimization:
 * - Large touch targets for glove-friendly use
 * - Clear visual hierarchy
 * - Explicit pixel strings for font sizes
 *
 * Data: Now fetches real templates from GraphQL API via TanStack Query
 */
export function TemplateSelector({ projectId }: TemplateSelectorProps) {
  const router = useRouter();
  const [category, setCategory] = useState<DisplayCategory>('all');
  const [search, setSearch] = useState('');

  // Fetch templates from API
  const { data: templates = [], isLoading, error } = useFormTemplates({ isActive: true });

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (category !== 'all') {
      const categoryMap: Record<DisplayCategory, FormCategory[]> = {
        all: [],
        epa: ['EPA_SWPPP', 'EPA_CGP'],
        osha: ['OSHA_SAFETY'],
        state: ['STATE_PERMIT'],
        custom: ['CUSTOM'],
      };
      const allowedCategories = categoryMap[category];
      if (allowedCategories.length > 0) {
        filtered = filtered.filter((t) => allowedCategories.includes(t.category));
      }
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [templates, category, search]);

  const handleTemplateClick = (templateId: string) => {
    // Navigate to form fill page with projectId and templateId
    router.push(`/dashboard/forms/${templateId}/fill?projectId=${projectId}`);
  };

  // Get badge color based on category
  const getCategoryColor = (cat: FormCategory): string => {
    switch (cat) {
      case 'EPA_SWPPP':
      case 'EPA_CGP':
        return 'green';
      case 'OSHA_SAFETY':
        return 'orange';
      case 'STATE_PERMIT':
        return 'violet';
      case 'CUSTOM':
      default:
        return 'blue';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Stack gap="md" align="center" py="xl" data-testid="template-selector-loading">
        <Loader size="lg" />
        <Text size="13px" c="dimmed">
          Loading templates...
        </Text>
      </Stack>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Failed to load templates"
        color="red"
        data-testid="template-selector-error"
      >
        {error instanceof Error ? error.message : 'An error occurred while loading templates.'}
      </Alert>
    );
  }

  return (
    <Stack gap="md" data-testid="template-selector">
      {/* Filters */}
      <Group gap="md" wrap="nowrap">
        <SegmentedControl
          value={category}
          onChange={(value) => setCategory(value as DisplayCategory)}
          data={[
            { label: 'All', value: 'all' },
            { label: 'EPA', value: 'epa' },
            { label: 'OSHA', value: 'osha' },
            { label: 'State', value: 'state' },
            { label: 'Custom', value: 'custom' },
          ]}
          size="sm"
        />
        <TextInput
          placeholder="Search templates..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
          size="sm"
        />
      </Group>

      {/* Template Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {filteredTemplates.map((template) => (
          <Paper
            key={template.id}
            p="md"
            withBorder
            onClick={() => handleTemplateClick(template.id)}
            style={{
              cursor: 'pointer',
              minHeight: '140px',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
            className="hover:shadow-md"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            data-testid={`template-card-${template.id}`}
          >
            <Stack gap="xs">
              <Group gap="xs" wrap="nowrap">
                <IconForms size={24} stroke={1.5} />
                <Text fw={600} size="14px" lineClamp={1} style={{ flex: 1 }}>
                  {template.name}
                </Text>
              </Group>

              <Text size="13px" c="dimmed" lineClamp={2} style={{ minHeight: '38px' }}>
                {template.description || 'No description available'}
              </Text>

              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Badge size="sm" variant="light" color={getCategoryColor(template.category)}>
                  {categoryDisplayMap[template.category] || template.category}
                </Badge>
                <Text size="11px" c="dimmed">
                  v{template.version}
                </Text>
              </Group>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Text size="13px" c="dimmed" ta="center" py="xl">
          No templates found
        </Text>
      )}
    </Stack>
  );
}

