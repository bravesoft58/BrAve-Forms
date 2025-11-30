# ISSUE-151: Field Library Component (4h)

**Priority:** P0
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 4
**Dependencies:** ISSUE-161 (Form Builder Architecture)
**Sprint:** Sprint 5
**Status:** COMPLETE
**Completed:** 2025-11-30

---

## Completion Notes

Created comprehensive unit tests for the FieldPalette component:

**Test File:** `apps/web/components/Forms/FormBuilder/__tests__/FieldPalette.test.tsx`

**Tests Created (38 tests):**

- Component Rendering: palette title, search input, field categories
- All 5 Field Categories: Basic Fields (5 types), Selection Fields (4 types), Construction-Specific Fields (4 types), EPA Compliance Fields (3 types), Advanced Fields (1 type)
- All 17 Individual Fields: text, textarea, number, email, phone, select, multiSelect, radio, checkbox, photo, signature, gpsLocation, measurement, weather, swpppTrigger, bmpChecklist, calculated
- Field Click Interactions: click handlers with correct field type objects
- Quick Templates: EPA Daily Inspection template, Weekly Site Review template
- EPA Compliance Tip: SWPPP compliance guidance display

**Key Implementation Details:**

- Uses MantineProvider wrapper for component testing
- Tests verify field type mapping and category organization
- Validates EPA compliance features and quick templates

---

## Objective

Create a comprehensive field library component displaying all 15 available field types with drag-to-add functionality for the form builder canvas, optimized for construction forms.

## Tasks

- [ ] Create FieldLibrary component with searchable palette
- [ ] Create FieldTypeCard component for each field type
- [ ] Implement drag source with @dnd-kit/core
- [ ] Create field type categories (Input, Selection, Files, Compliance, Advanced)
- [ ] Add field type icons and descriptions
- [ ] Implement field search/filter functionality
- [ ] Create field preview on hover
- [ ] Add field usage examples tooltip
- [ ] Add unit tests for field library

## Technical Details

**Libraries/Dependencies:**

- @dnd-kit/core (drag-and-drop)
- Mantine components (Card, TextInput, Accordion, Tooltip)
- @tabler/icons-react (field type icons)

**15 Field Types:**

1. **Input Fields:** Text, Number, Email, Phone
2. **Selection Fields:** Dropdown, Radio, Checkbox, Multi-select
3. **File Fields:** Photo Upload, Signature Pad, File Upload
4. **Compliance Fields:** Inspector Name, Date/Time, GPS Location
5. **Advanced:** Calculated Field

**Code Example:**

```typescript
'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, Stack, TextInput, Accordion, Group, Text, Tooltip, Badge } from '@mantine/core';
import {
  IconTextSize,
  IconNumbers,
  IconAt,
  IconPhone,
  IconChevronDown,
  IconCircle,
  IconSquareCheck,
  IconPhoto,
  IconSignature,
  IconFile,
  IconUser,
  IconCalendar,
  IconMapPin,
  IconCalculator,
  IconSearch,
} from '@tabler/icons-react';

export interface FieldType {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'input' | 'selection' | 'files' | 'compliance' | 'advanced';
  description: string;
  example: string;
  validation?: string[];
}

const fieldTypes: FieldType[] = [
  // Input Fields
  {
    id: 'text',
    name: 'Text Input',
    icon: <IconTextSize size={20} />,
    category: 'input',
    description: 'Single-line text input for short answers',
    example: 'Site address, equipment ID, notes',
    validation: ['required', 'minLength', 'maxLength', 'pattern'],
  },
  {
    id: 'number',
    name: 'Number Input',
    icon: <IconNumbers size={20} />,
    category: 'input',
    description: 'Numeric input with min/max constraints',
    example: 'Temperature, quantity, measurements',
    validation: ['required', 'min', 'max', 'integer'],
  },
  {
    id: 'email',
    name: 'Email Input',
    icon: <IconAt size={20} />,
    category: 'input',
    description: 'Email address with validation',
    example: 'Contact email, notification address',
    validation: ['required', 'email'],
  },
  {
    id: 'phone',
    name: 'Phone Input',
    icon: <IconPhone size={20} />,
    category: 'input',
    description: 'Phone number with formatting',
    example: 'Contact phone, emergency number',
    validation: ['required', 'phone'],
  },

  // Selection Fields
  {
    id: 'dropdown',
    name: 'Dropdown',
    icon: <IconChevronDown size={20} />,
    category: 'selection',
    description: 'Single selection from dropdown',
    example: 'Weather condition, inspection type',
    validation: ['required'],
  },
  {
    id: 'radio',
    name: 'Radio Buttons',
    icon: <IconCircle size={20} />,
    category: 'selection',
    description: 'Single selection from visible options',
    example: 'Pass/Fail, Yes/No/NA',
    validation: ['required'],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    icon: <IconSquareCheck size={20} />,
    category: 'selection',
    description: 'Boolean yes/no selection',
    example: 'Acknowledgment, compliance confirmation',
    validation: ['required'],
  },
  {
    id: 'multiselect',
    name: 'Multi-Select',
    icon: <IconSquareCheck size={20} />,
    category: 'selection',
    description: 'Multiple selections from list',
    example: 'BMPs installed, deficiencies found',
    validation: ['required', 'minSelections', 'maxSelections'],
  },

  // File Fields
  {
    id: 'photo',
    name: 'Photo Upload',
    icon: <IconPhoto size={20} />,
    category: 'files',
    description: 'Camera photo with GPS EXIF',
    example: 'Site photos, deficiency evidence',
    validation: ['required', 'maxSize', 'maxCount'],
  },
  {
    id: 'signature',
    name: 'Signature Pad',
    icon: <IconSignature size={20} />,
    category: 'files',
    description: 'Digital signature capture',
    example: 'Inspector signature, approval',
    validation: ['required'],
  },
  {
    id: 'file',
    name: 'File Upload',
    icon: <IconFile size={20} />,
    category: 'files',
    description: 'Document or file attachment',
    example: 'SWPPP, lab reports, certifications',
    validation: ['required', 'fileType', 'maxSize'],
  },

  // Compliance Fields
  {
    id: 'inspector',
    name: 'Inspector Name',
    icon: <IconUser size={20} />,
    category: 'compliance',
    description: 'Auto-filled from Clerk user',
    example: 'Inspector name for EPA compliance',
    validation: ['required'],
  },
  {
    id: 'datetime',
    name: 'Date/Time',
    icon: <IconCalendar size={20} />,
    category: 'compliance',
    description: 'Date and time picker',
    example: 'Inspection date, incident time',
    validation: ['required', 'minDate', 'maxDate'],
  },
  {
    id: 'gps',
    name: 'GPS Location',
    icon: <IconMapPin size={20} />,
    category: 'compliance',
    description: 'Auto-captured GPS coordinates',
    example: 'Inspection location, deficiency location',
    validation: ['required', 'accuracy'],
  },

  // Advanced Fields
  {
    id: 'calculated',
    name: 'Calculated Field',
    icon: <IconCalculator size={20} />,
    category: 'advanced',
    description: 'Computed value from other fields',
    example: 'Total quantity, area calculation',
    validation: [],
  },
];

// Draggable Field Type Card
function FieldTypeCard({ fieldType }: { fieldType: FieldType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field-${fieldType.id}`,
    data: { fieldType },
  });

  return (
    <Card
      ref={setNodeRef}
      withBorder
      padding="sm"
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <Group gap="xs" wrap="nowrap">
        {fieldType.icon}
        <div style={{ flex: 1 }}>
          <Group gap="xs">
            <Text size="sm" fw={500}>{fieldType.name}</Text>
            {fieldType.validation?.includes('required') && (
              <Badge size="xs" color="red">Required</Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {fieldType.description}
          </Text>
        </div>
      </Group>

      <Tooltip
        label={
          <div>
            <Text size="xs" fw={500} mb={4}>Example Uses:</Text>
            <Text size="xs">{fieldType.example}</Text>
            {fieldType.validation && fieldType.validation.length > 0 && (
              <>
                <Text size="xs" fw={500} mt={8} mb={4}>Available Validation:</Text>
                <Text size="xs">{fieldType.validation.join(', ')}</Text>
              </>
            )}
          </div>
        }
        position="right"
        withArrow
      >
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      </Tooltip>
    </Card>
  );
}

// Field Library Component
export function FieldLibrary() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter fields by search query
  const filteredFields = fieldTypes.filter(field =>
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.example.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedFields = filteredFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, FieldType[]>);

  const categoryLabels = {
    input: 'Input Fields',
    selection: 'Selection Fields',
    files: 'File Upload Fields',
    compliance: 'Compliance Fields',
    advanced: 'Advanced Fields',
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <div>
          <Text size="lg" fw={600} mb="xs">Field Library</Text>
          <Text size="xs" c="dimmed">Drag fields to the canvas to build your form</Text>
        </div>

        <TextInput
          placeholder="Search fields..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Accordion variant="separated" defaultValue="input">
          {Object.entries(groupedFields).map(([category, fields]) => (
            <Accordion.Item key={category} value={category}>
              <Accordion.Control>
                <Group gap="xs">
                  <Text size="sm" fw={500}>{categoryLabels[category]}</Text>
                  <Badge size="sm" variant="light">{fields.length}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  {fields.map(field => (
                    <FieldTypeCard key={field.id} fieldType={field} />
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>

        {filteredFields.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No fields match "{searchQuery}"
          </Text>
        )}
      </Stack>
    </Card>
  );
}

export { fieldTypes };
```

## Acceptance Criteria

- [ ] Field library displays all 15 field types
- [ ] Fields organized into 5 categories (Input, Selection, Files, Compliance, Advanced)
- [ ] Search functionality filters fields by name/description/example
- [ ] Each field card shows icon, name, description
- [ ] Hover tooltip shows example uses and validation options
- [ ] Drag-to-add functionality working with @dnd-kit
- [ ] Field cards show "Required" badge if validation available
- [ ] Smooth drag visual feedback

## Testing Requirements

**Unit Tests:**

- Test field library renders all 15 types
- Test search filter functionality
- Test category grouping
- Test drag source setup

**Integration Tests:**

- Test drag-and-drop to canvas (in ISSUE-158)
- Test field type metadata

**Manual Testing:**

- Search for various field types
- Verify all categories expand/collapse
- Test drag gesture on all field types
- Verify tooltips display correctly

## Evidence Requirements

- [ ] Screenshot: Field library with all categories
- [ ] Screenshot: Search results
- [ ] Screenshot: Field hover tooltip
- [ ] Screenshot: Drag gesture visual feedback
- [ ] Test Results: Field library tests (>80% coverage)

## Success Criteria

Field library is complete when:

- All 15 field types displayed
- Search and category filtering working
- Drag-to-add functional
- Tooltips informative
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
