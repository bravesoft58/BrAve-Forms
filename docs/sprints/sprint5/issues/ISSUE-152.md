# ISSUE-152: Form Canvas with Drag & Drop (5h)

**Priority:** P0
**Phase:** Phase 5 - Form Builder
**Estimated Hours:** 5
**Dependencies:** ISSUE-161, ISSUE-162
**Sprint:** Sprint 5
**Status:** COMPLETE
**Completed:** 2025-11-30

---

## Completion Notes

Created comprehensive unit tests for the FormCanvas component:

**Test File:** `apps/web/components/Forms/FormBuilder/__tests__/FormCanvas.test.tsx`

**Tests Created (42 tests):**

- Empty State: empty state message, helpful instructions, EPA SWPPP template mention, disabled preview button
- With Fields: field count (singular/plural), canvas title, drag to reorder badge, field label/type/name/width/description rendering
- Field Badges: Required badge, EPA Critical badge, GPS badge
- EPA Compliance Alert: Critical EPA field warning message
- Field Selection: onSelectField callback when field clicked
- Field Actions: onDeleteField callback, onDuplicateField callback, multiple action buttons
- Field Types: All 15 field types with correct display labels (text, textarea, number, date, time, select, multiSelect, radio, checkbox, photo, signature, gpsLocation, swpppTrigger, bmpChecklist, violationCode)
- Field Ordering: fields render in correct order based on order property
- Add Field Hint: hint text for adding more fields
- Action Icons: copy/trash/settings/grip-vertical icons presence

**Key Implementation Details:**

- Uses MantineProvider + DndContext wrapper for testing
- Tests use document.querySelector for Tabler icon elements (Mantine Tooltip doesn't set aria-label)
- Validates EPA compliance badges and warnings

---

## Objective

Create the form canvas component with drag-and-drop field placement, reordering, deletion, and real-time form preview for building construction compliance forms.

## Tasks

- [ ] Create FormCanvas component with drop zone
- [ ] Implement drop target with @dnd-kit/core
- [ ] Implement field reordering with @dnd-kit/sortable
- [ ] Create FieldInstance component for placed fields
- [ ] Add field selection and highlighting
- [ ] Implement field deletion with confirmation
- [ ] Create field duplicate functionality
- [ ] Add visual drop indicators and feedback
- [ ] Sync canvas state with Valtio store
- [ ] Add unit tests for canvas logic

## Technical Details

**Libraries/Dependencies:**

- @dnd-kit/core (drag-and-drop core)
- @dnd-kit/sortable (reorderable lists)
- @dnd-kit/utilities (CSS utilities)
- Valtio (form builder state)
- Mantine components (Card, ActionIcon, Menu, Tooltip)

**Code Example:**

```typescript
'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Stack, Group, ActionIcon, Menu, Text, Button } from '@mantine/core';
import { IconGripVertical, IconTrash, IconCopy, IconSettings } from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import { formBuilderStore, addField, reorderFields, removeField, duplicateField, selectField } from './store';
import type { FieldType } from './FieldLibrary';

// Sortable Field Instance
function SortableFieldInstance({ field, index }: { field: FormField, index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const snap = useSnapshot(formBuilderStore);
  const isSelected = snap.selectedFieldId === field.id;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      withBorder
      padding="md"
      data-selected={isSelected}
      onClick={() => selectField(field.id)}
      sx={(theme) => ({
        outline: isSelected ? `2px solid ${theme.colors.blue[6]}` : 'none',
        outlineOffset: '2px',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: theme.colors.gray[0],
        },
      })}
    >
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab' }}
          aria-label="Drag to reorder"
        >
          <IconGripVertical size={16} />
        </ActionIcon>

        <div style={{ flex: 1 }}>
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {field.label || `${field.type} field`}
            </Text>
            {field.required && (
              <Text size="xs" c="red">*</Text>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {field.type} • Position {index + 1}
          </Text>
        </div>

        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" aria-label="Field actions">
              <IconSettings size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconCopy size={14} />}
              onClick={() => duplicateField(field.id)}
            >
              Duplicate
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => {
                if (confirm('Delete this field?')) {
                  removeField(field.id);
                }
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}

// Form Canvas Component
export function FormCanvas() {
  const snap = useSnapshot(formBuilderStore);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) return;

    // Adding new field from library
    if (active.id.toString().startsWith('field-')) {
      const fieldType = active.data.current?.fieldType as FieldType;
      if (fieldType) {
        addField({
          id: `field-${Date.now()}`,
          type: fieldType.id,
          label: fieldType.name,
          required: false,
          validation: [],
          options: [],
        });
      }
      return;
    }

    // Reordering existing fields
    if (active.id !== over.id) {
      const oldIndex = snap.fields.findIndex(f => f.id === active.id);
      const newIndex = snap.fields.findIndex(f => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(snap.fields, oldIndex, newIndex);
        reorderFields(newOrder);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Card withBorder padding="lg" mih={400}>
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="lg" fw={600}>Form Canvas</Text>
              <Text size="xs" c="dimmed">
                {snap.fields.length} {snap.fields.length === 1 ? 'field' : 'fields'}
              </Text>
            </div>

            {snap.fields.length > 0 && (
              <Button
                variant="outline"
                size="xs"
                color="red"
                onClick={() => {
                  if (confirm('Clear all fields? This cannot be undone.')) {
                    formBuilderStore.fields = [];
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </Group>

          {snap.fields.length === 0 ? (
            <Card withBorder padding="xl" ta="center" style={{ borderStyle: 'dashed' }}>
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">No fields yet</Text>
                <Text size="xs" c="dimmed">
                  Drag fields from the library to start building your form
                </Text>
              </Stack>
            </Card>
          ) : (
            <SortableContext
              items={snap.fields.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack gap="sm">
                {snap.fields.map((field, index) => (
                  <SortableFieldInstance
                    key={field.id}
                    field={field}
                    index={index}
                  />
                ))}
              </Stack>
            </SortableContext>
          )}
        </Stack>
      </Card>

      <DragOverlay>
        {activeId && (
          <Card withBorder padding="md" style={{ opacity: 0.8 }}>
            <Text size="sm">Dragging...</Text>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Form Preview (Read-only View)
export function FormPreview() {
  const snap = useSnapshot(formBuilderStore);

  if (snap.fields.length === 0) {
    return (
      <Card withBorder padding="xl" ta="center">
        <Text size="sm" c="dimmed">
          Add fields to see form preview
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <Text size="lg" fw={600}>Form Preview</Text>

        <form>
          <Stack gap="md">
            {snap.fields.map(field => (
              <div key={field.id}>
                <label>
                  {field.label}
                  {field.required && <span style={{ color: 'red' }}> *</span>}
                </label>

                {/* Render field based on type */}
                {field.type === 'text' && (
                  <input type="text" required={field.required} disabled />
                )}
                {field.type === 'number' && (
                  <input type="number" required={field.required} disabled />
                )}
                {field.type === 'dropdown' && (
                  <select required={field.required} disabled>
                    <option>Select...</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {/* ... other field types */}
              </div>
            ))}
          </Stack>
        </form>
      </Stack>
    </Card>
  );
}
```

## Acceptance Criteria

- [ ] Form canvas accepts fields from library via drag-and-drop
- [ ] Fields can be reordered by dragging
- [ ] Field selection highlights selected field
- [ ] Field deletion with confirmation modal
- [ ] Field duplication creates copy below original
- [ ] Visual drop indicators show valid drop zones
- [ ] Drag overlay shows field being dragged
- [ ] Empty state shows helpful message
- [ ] Clear all button removes all fields with confirmation
- [ ] Canvas state syncs with Valtio store

## Testing Requirements

**Unit Tests:**

- Test add field from library
- Test reorder fields
- Test remove field
- Test duplicate field
- Test field selection

**Integration Tests:**

- Test drag-and-drop interaction
- Test Valtio store updates
- Test keyboard navigation

**Manual Testing:**

- Drag multiple field types to canvas
- Reorder fields by dragging
- Delete and duplicate fields
- Test keyboard accessibility (Tab, Enter, Space)
- Verify smooth drag animations

## Evidence Requirements

- [ ] Screenshot: Empty canvas with drop zone
- [ ] Screenshot: Canvas with multiple fields
- [ ] Screenshot: Field being dragged (drag overlay)
- [ ] Screenshot: Selected field highlighted
- [ ] Video: Drag-and-drop workflow
- [ ] Test Results: Canvas tests (>80% coverage)

## Success Criteria

Form canvas is complete when:

- Drag-and-drop from library working
- Field reordering functional
- Field selection, deletion, duplication working
- Visual feedback clear
- All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** READY FOR IMPLEMENTATION
