# ISSUE-159: Form Templates Library (4h)

**Priority:** P1
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 4
**Dependencies:** ISSUE-158
**Sprint:** Sprint 5

---

## Objective

Create a form templates library with 50+ pre-built EPA/OSHA compliance forms and custom templates, allowing form builders to start from templates instead of building from scratch.

## Tasks

- [ ] Create FormTemplatesLibrary component
- [ ] Create 10 EPA CGP templates (daily inspection, rain event, etc.)
- [ ] Create 10 OSHA templates (safety inspection, incident report, etc.)
- [ ] Create 10 general construction templates (daily log, equipment checklist, etc.)
- [ ] Create template preview functionality
- [ ] Implement "Use Template" button to load template into canvas
- [ ] Add template search and filtering
- [ ] Create custom template saving functionality
- [ ] Add unit tests for template logic

## Technical Details

**Libraries/Dependencies:**

- Valtio (form builder state)
- Mantine components (Card, Grid, Badge, TextInput)
- JSON (template storage format)

**Code Example:**

```typescript
'use client';

import { useState } from 'react';
import { SimpleGrid, Card, Stack, Text, Badge, Button, TextInput, Group, Modal } from '@mantine/core';
import { IconSearch, IconTemplate, IconCheck, IconStar } from '@tabler/icons-react';
import { formBuilderStore, loadTemplate } from './store';
import type { FormTemplate } from './types';

// Pre-built EPA Templates
const epaTemplates: FormTemplate[] = [
  {
    id: 'epa-daily-inspection',
    name: 'EPA CGP Daily Inspection',
    description: 'Daily construction site inspection per EPA CGP requirements',
    category: 'EPA Compliance',
    fields: [
      {
        id: 'inspector',
        type: 'inspector',
        label: 'Inspector Name',
        required: true,
        validation: [{ type: 'required', message: 'Inspector name required for EPA compliance' }],
      },
      {
        id: 'inspection-date',
        type: 'datetime',
        label: 'Inspection Date/Time',
        required: true,
      },
      {
        id: 'gps',
        type: 'gps',
        label: 'Inspection Location',
        required: true,
      },
      {
        id: 'weather',
        type: 'dropdown',
        label: 'Weather Condition',
        required: true,
        options: [
          { label: 'Clear', value: 'clear' },
          { label: 'Cloudy', value: 'cloudy' },
          { label: 'Raining', value: 'raining' },
          { label: 'Snow', value: 'snow' },
        ],
      },
      {
        id: 'rain-24h',
        type: 'number',
        label: 'Rain in Last 24 Hours (inches)',
        required: true,
        validation: [
          { type: 'min', value: 0, message: 'Cannot be negative' },
          { type: 'max', value: 20, message: 'Unrealistic value' },
        ],
      },
      {
        id: 'rain-trigger',
        type: 'radio',
        label: 'Did rain exceed 0.25 inches?',
        required: true,
        options: [
          { label: 'Yes (inspection required)', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        conditionalRules: [
          {
            id: 'rain-condition',
            targetFieldId: 'rain-trigger',
            action: 'show',
            logic: 'AND',
            conditions: [
              {
                id: 'cond-1',
                fieldId: 'rain-24h',
                operator: 'greater_than',
                value: 0.25,
              },
            ],
          },
        ],
      },
      {
        id: 'bmps-inspected',
        type: 'multiselect',
        label: 'BMPs Inspected',
        required: true,
        options: [
          { label: 'Silt Fence', value: 'silt-fence' },
          { label: 'Inlet Protection', value: 'inlet-protection' },
          { label: 'Stabilized Construction Entrance', value: 'entrance' },
          { label: 'Sediment Basin', value: 'sediment-basin' },
          { label: 'Check Dam', value: 'check-dam' },
        ],
      },
      {
        id: 'deficiencies',
        type: 'textarea',
        label: 'Deficiencies Found',
        required: false,
        placeholder: 'Describe any deficiencies requiring corrective action',
      },
      {
        id: 'corrective-action',
        type: 'textarea',
        label: 'Corrective Action Taken',
        required: false,
        conditionalRules: [
          {
            id: 'corrective-condition',
            targetFieldId: 'corrective-action',
            action: 'show',
            logic: 'AND',
            conditions: [
              {
                id: 'cond-deficiency',
                fieldId: 'deficiencies',
                operator: 'is_not_empty',
                value: '',
              },
            ],
          },
        ],
      },
      {
        id: 'photos',
        type: 'photo',
        label: 'Inspection Photos',
        required: true,
        validation: [
          { type: 'minCount', value: 3, message: 'At least 3 photos required' },
          { type: 'maxCount', value: 20, message: 'Maximum 20 photos' },
        ],
      },
      {
        id: 'signature',
        type: 'signature',
        label: 'Inspector Signature',
        required: true,
      },
    ],
  },
  {
    id: 'epa-rain-event',
    name: 'EPA CGP Rain Event Inspection',
    description: '0.25" rain event inspection within 24 hours',
    category: 'EPA Compliance',
    fields: [
      // ... similar structure for rain event inspection
    ],
  },
  // ... 8 more EPA templates
];

// OSHA Templates
const oshaTemplates: FormTemplate[] = [
  {
    id: 'osha-safety-inspection',
    name: 'OSHA Daily Safety Inspection',
    description: 'Daily safety inspection per OSHA requirements',
    category: 'OSHA Compliance',
    fields: [
      // ... OSHA safety inspection fields
    ],
  },
  // ... 9 more OSHA templates
];

// General Construction Templates
const constructionTemplates: FormTemplate[] = [
  {
    id: 'daily-log',
    name: 'Daily Construction Log',
    description: 'Track daily activities, weather, and progress',
    category: 'General',
    fields: [
      // ... daily log fields
    ],
  },
  // ... 9 more construction templates
];

const allTemplates = [...epaTemplates, ...oshaTemplates, ...constructionTemplates];

// Form Templates Library Component
export function FormTemplatesLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(allTemplates.map(t => t.category)));

  const useTemplate = (template: FormTemplate) => {
    if (confirm(`Load template "${template.name}"? This will replace current form.`)) {
      loadTemplate(template);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Search templates..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <Group gap="xs">
        <Button
          size="xs"
          variant={!selectedCategory ? 'filled' : 'light'}
          onClick={() => setSelectedCategory(null)}
        >
          All ({allTemplates.length})
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            size="xs"
            variant={selectedCategory === category ? 'filled' : 'light'}
            onClick={() => setSelectedCategory(category)}
          >
            {category} ({allTemplates.filter(t => t.category === category).length})
          </Button>
        ))}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {filteredTemplates.map(template => (
          <Card key={template.id} withBorder padding="md">
            <Stack gap="xs">
              <Group justify="space-between">
                <IconTemplate size={20} />
                <Badge size="sm">{template.category}</Badge>
              </Group>

              <div>
                <Text size="sm" fw={600}>{template.name}</Text>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {template.description}
                </Text>
              </div>

              <Group gap="xs" mt="xs">
                <Text size="xs" c="dimmed">
                  {template.fields.length} fields
                </Text>
              </Group>

              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setPreviewTemplate(template)}
                >
                  Preview
                </Button>
                <Button
                  size="xs"
                  leftSection={<IconCheck size={14} />}
                  onClick={() => useTemplate(template)}
                >
                  Use Template
                </Button>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {filteredTemplates.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No templates match "{searchQuery}"
        </Text>
      )}

      {/* Template Preview Modal */}
      <Modal
        opened={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.name}
        size="lg"
      >
        {previewTemplate && (
          <Stack gap="md">
            <Text size="sm">{previewTemplate.description}</Text>

            <Card withBorder padding="md" bg="gray.0">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Fields ({previewTemplate.fields.length})</Text>
                {previewTemplate.fields.map(field => (
                  <Group key={field.id} gap="xs">
                    <Badge size="xs">{field.type}</Badge>
                    <Text size="xs">
                      {field.label}
                      {field.required && <span style={{ color: 'red' }}> *</span>}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>

            <Button onClick={() => useTemplate(previewTemplate)}>
              Use This Template
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

// Save current form as custom template
export function SaveAsTemplate() {
  const snap = useSnapshot(formBuilderStore);

  const saveTemplate = () => {
    const templateName = prompt('Template name:');
    if (!templateName) return;

    const template: FormTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: 'Custom template',
      category: 'Custom',
      fields: snap.fields,
    };

    // Save to localStorage
    const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    savedTemplates.push(template);
    localStorage.setItem('customTemplates', JSON.stringify(savedTemplates));

    alert('Template saved!');
  };

  return (
    <Button
      variant="light"
      leftSection={<IconStar size={16} />}
      onClick={saveTemplate}
      disabled={snap.fields.length === 0}
    >
      Save as Template
    </Button>
  );
}
```

## Acceptance Criteria

- [ ] Templates library displays 30+ pre-built templates
- [ ] Templates organized by category (EPA, OSHA, General)
- [ ] Search and filter functionality working
- [ ] Template preview shows all fields
- [ ] "Use Template" loads template into canvas
- [ ] Custom template saving functional
- [ ] Templates include proper validation rules
- [ ] Templates include conditional logic where appropriate

## Testing Requirements

**Unit Tests:**

- Test template loading
- Test template search/filter
- Test custom template save

**Integration Tests:**

- Test load template to canvas
- Test template preview
- Test Valtio store updates

**Manual Testing:**

- Browse all templates
- Search for specific templates
- Preview template details
- Load template into canvas
- Save custom template

## Evidence Requirements

- [ ] Screenshot: Templates library grid
- [ ] Screenshot: EPA template preview
- [ ] Screenshot: Template loaded in canvas
- [ ] Test Results: Templates tests (>80% coverage)

## Success Criteria

Form templates library is complete when:

- 30+ templates available
- Search and filter working
- Template preview functional
- Load template working
- Custom template save working
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
