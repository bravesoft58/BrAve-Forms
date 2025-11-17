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
} from '@mantine/core';
import { IconSearch, IconForms } from '@tabler/icons-react';
import {
  getMockFormTemplatesByCategory,
  searchMockFormTemplates,
  type FormTemplateCategory,
} from '@/lib/mock-data/form-templates';

interface TemplateSelectorProps {
  projectId: string;
}

/**
 * Template Selector Component (ISSUE-088)
 *
 * Displays a grid of available form templates with:
 * - Category filtering (All, Daily Logs, Inspections, Safety, Compliance)
 * - Search by template name/description
 * - Template cards showing icon, name, description, category badge
 * - Click to navigate to form fill page
 * - Responsive grid layout
 *
 * Field Optimization:
 * - Large touch targets for glove-friendly use
 * - Clear visual hierarchy
 * - Explicit pixel strings for font sizes
 */
export function TemplateSelector({ projectId }: TemplateSelectorProps) {
  const router = useRouter();
  const [category, setCategory] = useState<FormTemplateCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let templates = getMockFormTemplatesByCategory(category);
    templates = searchMockFormTemplates(templates, search);
    return templates;
  }, [category, search]);

  const handleTemplateClick = (templateId: string) => {
    // Navigate to form fill page with projectId and templateId
    router.push(`/dashboard/forms/${templateId}/fill?projectId=${projectId}`);
  };

  return (
    <Stack gap="md" data-testid="template-selector">
      {/* Filters */}
      <Group gap="md" wrap="nowrap">
        <SegmentedControl
          value={category}
          onChange={(value) => setCategory(value as FormTemplateCategory | 'all')}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Daily Logs', value: 'daily-logs' },
            { label: 'Inspections', value: 'inspections' },
            { label: 'Safety', value: 'safety' },
            { label: 'Compliance', value: 'compliance' },
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
                  {template.title}
                </Text>
              </Group>

              <Text size="13px" c="dimmed" lineClamp={2} style={{ minHeight: '38px' }}>
                {template.description}
              </Text>

              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Badge size="sm" variant="light" color="blue">
                  {template.category.replace('-', ' ')}
                </Badge>
                {template.estimatedTime && (
                  <Text size="11px" c="dimmed">
                    {template.estimatedTime}
                  </Text>
                )}
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

