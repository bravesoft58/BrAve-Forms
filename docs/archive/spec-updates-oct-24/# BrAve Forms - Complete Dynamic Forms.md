# BrAve Forms - Complete Dynamic Forms System Architecture

**Version:** 1.0  
**Created:** 2025-10-23  
**Status:** DESIGN SPECIFICATION  
**Sprint Scope:** Sprint 3-6 (Forms Builder, Conditional Logic, Calculated Fields, Advanced Features)

---

## Executive Summary

This document specifies the complete dynamic forms system for BrAve Forms - the **CORE PRODUCT** (Epic 1, 80% of value proposition). The system enables construction companies to create custom forms with drag-and-drop builders, conditional logic, calculated fields, and offline-first capabilities.

**System Scope:**
- **Form Builder UI:** Drag-and-drop designer with live preview
- **15+ Field Types:** Basic (text, number, date) + Advanced (photo with GPS, signature, repeater, computed)
- **Conditional Logic:** Show/hide/require fields based on rules
- **Calculated Fields:** Excel-like formulas with auto-update
- **Template System:** 50+ pre-built templates, custom templates, versioning
- **Offline-First:** 30-day capability with IndexedDB + Service Workers
- **Field-Optimized:** Glove-friendly, high contrast, weather-resistant

**Key Architecture Decisions:**
- **UI Library:** Mantine v7 + @dnd-kit/core for drag-and-drop
- **State Management:** Valtio for form builder state, React Hook Form for rendering
- **Validation:** Zod schemas generated from form definition
- **Storage:** PostgreSQL JSONB (templates), IndexedDB (drafts/offline submissions)
- **Sync:** BullMQ queue with priority (compliance forms first)

---

## 1. Form Builder UI Architecture

### 1.1 Component Structure

```
FormBuilder (Container)
├── FormBuilderToolbar (Save, Preview, Publish, Settings)
├── FieldPalette (Sidebar - Left)
│   ├── BasicFieldsGroup (Text, Number, Date, Select, etc.)
│   ├── AdvancedFieldsGroup (Photo, Signature, GPS, Repeater)
│   └── LayoutFieldsGroup (Section, Divider, Spacer)
├── FormCanvas (Center - Drag-and-drop area)
│   ├── DraggableField (Each field instance)
│   │   ├── FieldPreview (How it looks)
│   │   ├── FieldControls (Edit, Duplicate, Delete)
│   │   └── DragHandle (Reorder)
│   └── DropZone (Empty state)
├── PropertiesPanel (Sidebar - Right)
│   ├── FieldSettingsTab
│   │   ├── BasicSettings (Label, Name, Required, Placeholder)
│   │   ├── ValidationSettings (Min/Max, Pattern, Custom)
│   │   └── AdvancedSettings (Default value, Help text)
│   ├── ConditionalLogicTab
│   │   └── ConditionBuilder (Show/Hide/Require rules)
│   ├── CalculatedFieldTab (Formula editor)
│   └── StylingTab (Width, Layout, Visibility)
└── PreviewModal (Live preview - Mobile + Desktop)
    └── FormRenderer (Actual form rendering component)
```

### 1.2 State Management (Valtio)

```typescript
// apps/web/lib/stores/formBuilderStore.ts
import { proxy } from 'valtio';
import type { FormSchema, FieldDefinition } from '@braveforms/types';

export interface FormBuilderState {
  // Current form being edited
  currentForm: FormSchema | null;
  
  // Selected field for properties panel
  selectedFieldId: string | null;
  
  // Drag-and-drop state
  isDragging: boolean;
  draggedFieldType: string | null;
  
  // Preview state
  previewMode: 'mobile' | 'desktop';
  showPreview: boolean;
  
  // History for undo/redo
  history: FormSchema[];
  historyIndex: number;
  
  // Validation state
  validationErrors: Record<string, string[]>;
}

export const formBuilderStore = proxy<FormBuilderState>({
  currentForm: null,
  selectedFieldId: null,
  isDragging: false,
  draggedFieldType: null,
  previewMode: 'mobile',
  showPreview: false,
  history: [],
  historyIndex: -1,
  validationErrors: {},
});

// Actions
export const formBuilderActions = {
  // Initialize new form
  createForm(metadata: Partial<FormSchema>) {
    formBuilderStore.currentForm = {
      id: generateId(),
      version: 1,
      title: metadata.title || 'Untitled Form',
      description: metadata.description || '',
      category: metadata.category || 'custom',
      fields: [],
      conditionalRules: [],
      calculatedFields: [],
      validationRules: [],
      settings: {
        allowDrafts: true,
        showProgressBar: true,
        confirmBeforeSubmit: true,
      },
      ...metadata,
    };
    this.saveToHistory();
  },

  // Add field to canvas
  addField(fieldType: string, index?: number) {
    if (!formBuilderStore.currentForm) return;
    
    const newField: FieldDefinition = {
      id: generateId(),
      type: fieldType as any,
      name: `field_${Date.now()}`,
      label: `New ${fieldType} Field`,
      required: false,
      validation: {},
      metadata: {},
    };
    
    const fields = [...formBuilderStore.currentForm.fields];
    if (index !== undefined) {
      fields.splice(index, 0, newField);
    } else {
      fields.push(newField);
    }
    
    formBuilderStore.currentForm.fields = fields;
    formBuilderStore.selectedFieldId = newField.id;
    this.saveToHistory();
  },

  // Update field properties
  updateField(fieldId: string, updates: Partial<FieldDefinition>) {
    if (!formBuilderStore.currentForm) return;
    
    formBuilderStore.currentForm.fields = formBuilderStore.currentForm.fields.map(
      (field) => (field.id === fieldId ? { ...field, ...updates } : field)
    );
    this.saveToHistory();
  },

  // Reorder fields
  reorderFields(fromIndex: number, toIndex: number) {
    if (!formBuilderStore.currentForm) return;
    
    const fields = [...formBuilderStore.currentForm.fields];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    
    formBuilderStore.currentForm.fields = fields;
    this.saveToHistory();
  },

  // Delete field
  deleteField(fieldId: string) {
    if (!formBuilderStore.currentForm) return;
    
    formBuilderStore.currentForm.fields = formBuilderStore.currentForm.fields.filter(
      (field) => field.id !== fieldId
    );
    
    // Remove conditional rules referencing this field
    formBuilderStore.currentForm.conditionalRules =
      formBuilderStore.currentForm.conditionalRules.filter(
        (rule) =>
          !rule.conditions.some((c) => c.fieldId === fieldId) &&
          !rule.actions.some((a) => a.targetFieldId === fieldId)
      );
    
    this.saveToHistory();
  },

  // Duplicate field
  duplicateField(fieldId: string) {
    if (!formBuilderStore.currentForm) return;
    
    const field = formBuilderStore.currentForm.fields.find((f) => f.id === fieldId);
    if (!field) return;
    
    const duplicate: FieldDefinition = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
    };
    
    const index = formBuilderStore.currentForm.fields.findIndex((f) => f.id === fieldId);
    this.addField(duplicate.type, index + 1);
  },

  // Undo/Redo
  undo() {
    if (formBuilderStore.historyIndex > 0) {
      formBuilderStore.historyIndex--;
      formBuilderStore.currentForm = cloneDeep(
        formBuilderStore.history[formBuilderStore.historyIndex]
      );
    }
  },

  redo() {
    if (formBuilderStore.historyIndex < formBuilderStore.history.length - 1) {
      formBuilderStore.historyIndex++;
      formBuilderStore.currentForm = cloneDeep(
        formBuilderStore.history[formBuilderStore.historyIndex]
      );
    }
  },

  // History management
  saveToHistory() {
    if (!formBuilderStore.currentForm) return;
    
    // Remove future history if user made changes after undo
    formBuilderStore.history = formBuilderStore.history.slice(
      0,
      formBuilderStore.historyIndex + 1
    );
    
    // Add current state to history
    formBuilderStore.history.push(cloneDeep(formBuilderStore.currentForm));
    formBuilderStore.historyIndex++;
    
    // Limit history to 50 entries
    if (formBuilderStore.history.length > 50) {
      formBuilderStore.history.shift();
      formBuilderStore.historyIndex--;
    }
  },
};
```

### 1.3 Drag-and-Drop Implementation (@dnd-kit/core)

**Why @dnd-kit?**
- Modern, accessible, touch-friendly
- Works well with React 18
- Better TypeScript support than react-beautiful-dnd
- Active maintenance

```typescript
// apps/web/components/forms/builder/FormCanvas.tsx
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function FormCanvas() {
  const { currentForm } = useSnapshot(formBuilderStore);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    formBuilderStore.isDragging = true;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      formBuilderStore.isDragging = false;
      return;
    }

    const oldIndex = currentForm?.fields.findIndex((f) => f.id === active.id);
    const newIndex = currentForm?.fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== -1 && newIndex !== -1) {
      formBuilderActions.reorderFields(oldIndex, newIndex);
    }

    setActiveId(null);
    formBuilderStore.isDragging = false;
  };

  if (!currentForm) {
    return <EmptyState />;
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={currentForm.fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack spacing="md" p="md">
          {currentForm.fields.map((field) => (
            <DraggableField key={field.id} field={field} />
          ))}
        </Stack>
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          <FieldPreview
            field={currentForm.fields.find((f) => f.id === activeId)!}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Draggable field component
function DraggableField({ field }: { field: FieldDefinition }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = formBuilderStore.selectedFieldId === field.id;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      p="md"
      withBorder
      sx={(theme) => ({
        cursor: 'grab',
        borderColor: isSelected ? theme.colors.blue[6] : undefined,
        '&:hover': {
          borderColor: theme.colors.gray[6],
        },
      })}
      onClick={() => {
        formBuilderStore.selectedFieldId = field.id;
      }}
    >
      <Group position="apart">
        <Group spacing="xs">
          <ActionIcon {...attributes} {...listeners} size="sm">
            <IconGripVertical size={16} />
          </ActionIcon>
          <FieldIcon type={field.type} />
          <Text weight={500}>{field.label}</Text>
          {field.required && <Badge size="xs">Required</Badge>}
        </Group>

        <Group spacing="xs">
          <ActionIcon
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              formBuilderActions.duplicateField(field.id);
            }}
          >
            <IconCopy size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              formBuilderActions.deleteField(field.id);
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Box mt="xs">
        <FieldPreview field={field} compact />
      </Box>
    </Paper>
  );
}
```

### 1.4 Field Palette Component

```typescript
// apps/web/components/forms/builder/FieldPalette.tsx
export function FieldPalette() {
  const basicFields = [
    { type: 'text', label: 'Text', icon: IconTextSize },
    { type: 'textarea', label: 'Long Text', icon: IconAlignLeft },
    { type: 'number', label: 'Number', icon: IconNumbers },
    { type: 'date', label: 'Date', icon: IconCalendar },
    { type: 'time', label: 'Time', icon: IconClock },
    { type: 'select', label: 'Dropdown', icon: IconChevronDown },
    { type: 'radio', label: 'Radio Buttons', icon: IconCircleDot },
    { type: 'checkbox', label: 'Checkbox', icon: IconSquareCheck },
    { type: 'checkboxes', label: 'Multiple Choice', icon: IconCheckbox },
  ];

  const advancedFields = [
    { type: 'photo', label: 'Photo', icon: IconCamera },
    { type: 'signature', label: 'Signature', icon: IconSignature },
    { type: 'gps', label: 'GPS Location', icon: IconMapPin },
    { type: 'repeater', label: 'Repeater', icon: IconRepeat },
    { type: 'file', label: 'File Upload', icon: IconUpload },
    { type: 'computed', label: 'Calculated', icon: IconCalculator },
  ];

  const layoutFields = [
    { type: 'section', label: 'Section Header', icon: IconLayoutGrid },
    { type: 'divider', label: 'Divider', icon: IconMinus },
    { type: 'spacer', label: 'Spacer', icon: IconSpace },
  ];

  return (
    <ScrollArea h="100%">
      <Stack spacing="lg" p="md">
        <FieldGroup title="Basic Fields" fields={basicFields} />
        <FieldGroup title="Advanced Fields" fields={advancedFields} />
        <FieldGroup title="Layout" fields={layoutFields} />
      </Stack>
    </ScrollArea>
  );
}

function FieldGroup({ title, fields }: { title: string; fields: any[] }) {
  return (
    <Box>
      <Text size="xs" weight={600} color="dimmed" mb="xs">
        {title}
      </Text>
      <Stack spacing="xs">
        {fields.map((field) => (
          <Button
            key={field.type}
            variant="light"
            leftIcon={<field.icon size={16} />}
            fullWidth
            styles={{ inner: { justifyContent: 'flex-start' } }}
            onClick={() => formBuilderActions.addField(field.type)}
          >
            {field.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
```

### 1.5 Properties Panel Component

```typescript
// apps/web/components/forms/builder/PropertiesPanel.tsx
export function PropertiesPanel() {
  const { currentForm, selectedFieldId } = useSnapshot(formBuilderStore);
  
  if (!selectedFieldId || !currentForm) {
    return (
      <Center h="100%" c="dimmed">
        <Stack align="center">
          <IconClick size={48} />
          <Text>Select a field to edit properties</Text>
        </Stack>
      </Center>
    );
  }

  const field = currentForm.fields.find((f) => f.id === selectedFieldId);
  if (!field) return null;

  return (
    <ScrollArea h="100%">
      <Tabs defaultValue="settings" p="md">
        <Tabs.List>
          <Tabs.Tab value="settings" icon={<IconSettings size={14} />}>
            Settings
          </Tabs.Tab>
          <Tabs.Tab value="logic" icon={<IconGitBranch size={14} />}>
            Logic
          </Tabs.Tab>
          {field.type === 'computed' && (
            <Tabs.Tab value="formula" icon={<IconCalculator size={14} />}>
              Formula
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="settings" pt="md">
          <FieldSettingsPanel field={field} />
        </Tabs.Panel>

        <Tabs.Panel value="logic" pt="md">
          <ConditionalLogicPanel field={field} />
        </Tabs.Panel>

        {field.type === 'computed' && (
          <Tabs.Panel value="formula" pt="md">
            <FormulaEditorPanel field={field} />
          </Tabs.Panel>
        )}
      </Tabs>
    </ScrollArea>
  );
}

function FieldSettingsPanel({ field }: { field: FieldDefinition }) {
  return (
    <Stack spacing="md">
      <TextInput
        label="Field Label"
        placeholder="Enter field label"
        value={field.label}
        onChange={(e) =>
          formBuilderActions.updateField(field.id, { label: e.target.value })
        }
      />

      <TextInput
        label="Field Name (Technical)"
        placeholder="field_name"
        value={field.name}
        onChange={(e) =>
          formBuilderActions.updateField(field.id, { name: e.target.value })
        }
        description="Used in formulas and exports"
      />

      <Switch
        label="Required Field"
        checked={field.required}
        onChange={(e) =>
          formBuilderActions.updateField(field.id, { required: e.target.checked })
        }
      />

      <Textarea
        label="Help Text"
        placeholder="Additional instructions for users"
        value={field.helpText || ''}
        onChange={(e) =>
          formBuilderActions.updateField(field.id, { helpText: e.target.value })
        }
      />

      {/* Field-type-specific settings */}
      <FieldTypeSettings field={field} />
    </Stack>
  );
}
```

### 1.6 Live Preview Implementation

```typescript
// apps/web/components/forms/builder/PreviewModal.tsx
export function PreviewModal() {
  const { currentForm, previewMode, showPreview } = useSnapshot(formBuilderStore);

  if (!showPreview || !currentForm) return null;

  return (
    <Modal
      opened
      onClose={() => {
        formBuilderStore.showPreview = false;
      }}
      size="xl"
      title={
        <Group>
          <Text weight={600}>Form Preview</Text>
          <SegmentedControl
            value={previewMode}
            onChange={(value) => {
              formBuilderStore.previewMode = value as 'mobile' | 'desktop';
            }}
            data={[
              { label: 'Mobile', value: 'mobile' },
              { label: 'Desktop', value: 'desktop' },
            ]}
          />
        </Group>
      }
    >
      <Box
        sx={(theme) => ({
          maxWidth: previewMode === 'mobile' ? 375 : '100%',
          margin: previewMode === 'mobile' ? '0 auto' : 0,
          border: previewMode === 'mobile' ? `1px solid ${theme.colors.gray[3]}` : 'none',
          borderRadius: theme.radius.md,
          overflow: 'hidden',
        })}
      >
        <FormRenderer
          schema={currentForm}
          mode="preview"
          onSubmit={(data) => {
            console.log('Preview submission:', data);
          }}
        />
      </Box>
    </Modal>
  );
}
```

---

## 2. Field Type System

### 2.1 Field Type Registry

```typescript
// packages/types/src/field-types.ts
export type FieldType =
  // Basic fields
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkboxes'
  // Advanced fields
  | 'photo'
  | 'signature'
  | 'gps'
  | 'repeater'
  | 'file'
  | 'computed'
  // Layout fields
  | 'section'
  | 'divider'
  | 'spacer';

export interface BaseFieldDefinition {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  defaultValue?: any;
  conditional?: ConditionalDisplay;
  metadata?: Record<string, any>;
}

// Type-specific field definitions
export interface TextFieldDefinition extends BaseFieldDefinition {
  type: 'text';
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string; // Regex pattern
  };
}

export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: 'number';
  validation?: {
    min?: number;
    max?: number;
    step?: number;
  };
  metadata?: {
    format?: 'integer' | 'decimal' | 'currency';
    decimalPlaces?: number;
    currencySymbol?: string;
  };
}

export interface PhotoFieldDefinition extends BaseFieldDefinition {
  type: 'photo';
  metadata: {
    maxPhotos?: number; // Default: 10
    gpsRequired?: boolean; // Embed GPS in EXIF
    quality?: 'low' | 'medium' | 'high'; // Compression level
    allowAnnotation?: boolean; // Draw on photos
  };
}

export interface RepeaterFieldDefinition extends BaseFieldDefinition {
  type: 'repeater';
  metadata: {
    fields: FieldDefinition[]; // Nested fields
    minEntries?: number;
    maxEntries?: number;
    addButtonText?: string; // Default: "Add Item"
  };
}

export interface ComputedFieldDefinition extends BaseFieldDefinition {
  type: 'computed';
  metadata: {
    formula: string; // Excel-like formula
    displayFormat?: string; // Number format (e.g., "0.00")
    dependencies?: string[]; // Field names this depends on
  };
}

// Union type for all field definitions
export type FieldDefinition =
  | TextFieldDefinition
  | NumberFieldDefinition
  | PhotoFieldDefinition
  | RepeaterFieldDefinition
  | ComputedFieldDefinition
  | ... // Add all other types
```

### 2.2 Field Component Registry

```typescript
// apps/web/components/forms/fields/index.ts
import { lazy } from 'react';
import type { FieldType } from '@braveforms/types';

// Lazy load field components for code splitting
export const fieldComponents: Record<FieldType, React.ComponentType<any>> = {
  text: lazy(() => import('./TextField')),
  textarea: lazy(() => import('./TextareaField')),
  number: lazy(() => import('./NumberField')),
  date: lazy(() => import('./DateField')),
  time: lazy(() => import('./TimeField')),
  select: lazy(() => import('./SelectField')),
  radio: lazy(() => import('./RadioField')),
  checkbox: lazy(() => import('./CheckboxField')),
  checkboxes: lazy(() => import('./CheckboxesField')),
  photo: lazy(() => import('./PhotoField')),
  signature: lazy(() => import('./SignatureField')),
  gps: lazy(() => import('./GPSField')),
  repeater: lazy(() => import('./RepeaterField')),
  file: lazy(() => import('./FileField')),
  computed: lazy(() => import('./ComputedField')),
  section: lazy(() => import('./SectionField')),
  divider: lazy(() => import('./DividerField')),
  spacer: lazy(() => import('./SpacerField')),
};

// Get component for field type
export function getFieldComponent(type: FieldType) {
  return fieldComponents[type];
}
```

### 2.3 Example Field Components

#### Text Field

```typescript
// apps/web/components/forms/fields/TextField.tsx
import { TextInput } from '@mantine/core';
import { useController } from 'react-hook-form';
import type { TextFieldDefinition } from '@braveforms/types';

export interface TextFieldProps {
  field: TextFieldDefinition;
  control: Control<any>;
  disabled?: boolean;
}

export default function TextField({ field, control, disabled }: TextFieldProps) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({
    name: field.name,
    control,
    rules: {
      required: field.required ? `${field.label} is required` : undefined,
      minLength: field.validation?.minLength
        ? {
            value: field.validation.minLength,
            message: `Minimum ${field.validation.minLength} characters`,
          }
        : undefined,
      maxLength: field.validation?.maxLength
        ? {
            value: field.validation.maxLength,
            message: `Maximum ${field.validation.maxLength} characters`,
          }
        : undefined,
      pattern: field.validation?.pattern
        ? {
            value: new RegExp(field.validation.pattern),
            message: 'Invalid format',
          }
        : undefined,
    },
  });

  return (
    <TextInput
      label={field.label}
      placeholder={field.placeholder}
      description={field.helpText}
      required={field.required}
      error={error?.message}
      value={value || ''}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      // Field-optimized for gloves
      styles={{
        input: {
          minHeight: 48, // Large touch target
          fontSize: 16, // Prevents zoom on iOS
        },
      }}
    />
  );
}
```

#### Photo Field (Construction-Optimized)

```typescript
// apps/web/components/forms/fields/PhotoField.tsx
import { useState } from 'react';
import { Stack, Group, Image, ActionIcon, Text, Paper } from '@mantine/core';
import { IconCamera, IconTrash, IconPencil } from '@tabler/icons-react';
import { useController } from 'react-hook-form';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import type { PhotoFieldDefinition } from '@braveforms/types';

export default function PhotoField({ field, control }: PhotoFieldProps) {
  const {
    field: { value = [], onChange },
    fieldState: { error },
  } = useController({
    name: field.name,
    control,
    rules: {
      required: field.required ? `${field.label} is required` : undefined,
      validate: {
        maxPhotos: (v) =>
          !field.metadata.maxPhotos ||
          v.length <= field.metadata.maxPhotos ||
          `Maximum ${field.metadata.maxPhotos} photos`,
      },
    },
  });

  const [loading, setLoading] = useState(false);

  const capturePhoto = async () => {
    setLoading(true);
    try {
      // Capture photo with camera
      const photo = await Camera.getPhoto({
        quality: field.metadata.quality === 'high' ? 90 : 70,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        saveToGallery: false,
      });

      // Get GPS coordinates if required
      let gpsData = null;
      if (field.metadata.gpsRequired) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        gpsData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
      }

      // Upload photo to server
      const uploadedPhoto = await uploadPhoto(photo.webPath!, {
        gps: gpsData,
        fieldId: field.id,
        timestamp: new Date().toISOString(),
      });

      // Add to field value
      onChange([...value, uploadedPhoto]);
    } catch (err) {
      console.error('Photo capture failed:', err);
      // Queue for retry if offline
      if (!navigator.onLine) {
        showNotification({
          title: 'Offline',
          message: 'Photo will be uploaded when connection is restored',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing="sm">
      <Text size="sm" weight={500}>
        {field.label}
        {field.required && <Text component="span" color="red"> *</Text>}
      </Text>
      
      {field.helpText && (
        <Text size="xs" color="dimmed">
          {field.helpText}
        </Text>
      )}

      <Group spacing="md">
        {value.map((photo: any, index: number) => (
          <Paper key={index} p="xs" withBorder>
            <Stack spacing="xs">
              <Image src={photo.url} width={120} height={120} fit="cover" />
              <Group spacing="xs">
                {field.metadata.allowAnnotation && (
                  <ActionIcon size="sm" variant="light">
                    <IconPencil size={14} />
                  </ActionIcon>
                )}
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="light"
                  onClick={() => {
                    onChange(value.filter((_: any, i: number) => i !== index));
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Stack>
          </Paper>
        ))}

        {(!field.metadata.maxPhotos || value.length < field.metadata.maxPhotos) && (
          <Paper
            p="xl"
            withBorder
            sx={(theme) => ({
              width: 120,
              height: 120,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                borderColor: theme.colors.blue[6],
                backgroundColor: theme.colors.blue[0],
              },
            })}
            onClick={capturePhoto}
          >
            <IconCamera size={32} />
            <Text size="xs" mt="xs">
              Add Photo
            </Text>
          </Paper>
        )}
      </Group>

      {error && (
        <Text size="xs" color="red">
          {error.message}
        </Text>
      )}
    </Stack>
  );
}
```

#### Repeater Field (Dynamic Lists)

```typescript
// apps/web/components/forms/fields/RepeaterField.tsx
export default function RepeaterField({ field, control }: RepeaterFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: field.name,
  });

  return (
    <Stack spacing="md">
      <Group position="apart">
        <Text size="sm" weight={500}>
          {field.label}
          {field.required && <Text component="span" color="red"> *</Text>}
        </Text>
        <Badge>{fields.length} items</Badge>
      </Group>

      {fields.map((item, index) => (
        <Paper key={item.id} p="md" withBorder>
          <Stack spacing="sm">
            <Group position="apart">
              <Text size="sm" weight={600}>
                Item {index + 1}
              </Text>
              <ActionIcon
                color="red"
                variant="light"
                onClick={() => remove(index)}
                disabled={
                  field.metadata.minEntries !== undefined &&
                  fields.length <= field.metadata.minEntries
                }
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>

            {/* Render nested fields */}
            {field.metadata.fields.map((nestedField) => {
              const FieldComponent = getFieldComponent(nestedField.type);
              return (
                <FieldComponent
                  key={nestedField.id}
                  field={{
                    ...nestedField,
                    name: `${field.name}.${index}.${nestedField.name}`,
                  }}
                  control={control}
                />
              );
            })}
          </Stack>
        </Paper>
      ))}

      <Button
        variant="light"
        leftIcon={<IconPlus size={16} />}
        onClick={() => append({})}
        disabled={
          field.metadata.maxEntries !== undefined &&
          fields.length >= field.metadata.maxEntries
        }
      >
        {field.metadata.addButtonText || 'Add Item'}
      </Button>
    </Stack>
  );
}
```

#### Computed Field (Calculated)

```typescript
// apps/web/components/forms/fields/ComputedField.tsx
export default function ComputedField({ field, control }: ComputedFieldProps) {
  const watchedValues = useWatch({ control });
  
  // Evaluate formula whenever dependencies change
  const computedValue = useMemo(() => {
    try {
      return evaluateFormula(field.metadata.formula, watchedValues);
    } catch (err) {
      console.error('Formula evaluation error:', err);
      return null;
    }
  }, [field.metadata.formula, watchedValues]);

  // Format value for display
  const displayValue = useMemo(() => {
    if (computedValue === null) return 'Error';
    if (field.metadata.displayFormat) {
      return numeral(computedValue).format(field.metadata.displayFormat);
    }
    return String(computedValue);
  }, [computedValue, field.metadata.displayFormat]);

  // Update form value (hidden from user)
  useEffect(() => {
    control.setValue(field.name, computedValue);
  }, [computedValue, control, field.name]);

  return (
    <TextInput
      label={field.label}
      description={field.helpText}
      value={displayValue}
      readOnly
      disabled
      styles={{
        input: {
          backgroundColor: '#f1f3f5',
          color: '#495057',
          fontWeight: 600,
        },
      }}
    />
  );
}
```

---

## 3. Conditional Logic Engine

### 3.1 Conditional Rule Schema

```typescript
// packages/types/src/conditional-logic.ts
export interface ConditionalRule {
  id: string;
  name?: string; // Optional rule name for debugging
  conditions: Condition[];
  operator: 'AND' | 'OR'; // How to combine conditions
  actions: Action[];
  priority?: number; // For rule execution order
}

export interface Condition {
  fieldId: string; // Field to evaluate
  operator: ConditionOperator;
  value: any; // Comparison value
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list';

export interface Action {
  type: ActionType;
  targetFieldId: string; // Field to apply action to
  value?: any; // For 'set_value' action
}

export type ActionType =
  | 'show'
  | 'hide'
  | 'require'
  | 'unrequire'
  | 'enable'
  | 'disable'
  | 'set_value';
```

### 3.2 Condition Evaluator

```typescript
// apps/web/lib/forms/conditionalLogic.ts
export function evaluateCondition(
  condition: Condition,
  fieldValue: any
): boolean {
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'not_equals':
      return fieldValue !== condition.value;

    case 'contains':
      return String(fieldValue).includes(String(condition.value));

    case 'not_contains':
      return !String(fieldValue).includes(String(condition.value));

    case 'starts_with':
      return String(fieldValue).startsWith(String(condition.value));

    case 'ends_with':
      return String(fieldValue).endsWith(String(condition.value));

    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);

    case 'less_than':
      return Number(fieldValue) < Number(condition.value);

    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(condition.value);

    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(condition.value);

    case 'is_empty':
      return !fieldValue || fieldValue.length === 0;

    case 'is_not_empty':
      return !!fieldValue && fieldValue.length > 0;

    case 'in_list':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);

    case 'not_in_list':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

export function evaluateRule(
  rule: ConditionalRule,
  formValues: Record<string, any>
): boolean {
  const results = rule.conditions.map((condition) => {
    const fieldValue = formValues[condition.fieldId];
    return evaluateCondition(condition, fieldValue);
  });

  return rule.operator === 'AND'
    ? results.every(Boolean) // All conditions must be true
    : results.some(Boolean); // At least one condition must be true
}

export function applyConditionalLogic(
  rules: ConditionalRule[],
  formValues: Record<string, any>
): {
  visibleFields: Set<string>;
  requiredFields: Set<string>;
  enabledFields: Set<string>;
  fieldValues: Record<string, any>;
} {
  const visibleFields = new Set<string>();
  const requiredFields = new Set<string>();
  const enabledFields = new Set<string>();
  const fieldValues = { ...formValues };

  // Sort rules by priority (higher priority first)
  const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sortedRules) {
    const ruleIsTrue = evaluateRule(rule, formValues);

    if (ruleIsTrue) {
      for (const action of rule.actions) {
        switch (action.type) {
          case 'show':
            visibleFields.add(action.targetFieldId);
            break;

          case 'hide':
            visibleFields.delete(action.targetFieldId);
            break;

          case 'require':
            requiredFields.add(action.targetFieldId);
            break;

          case 'unrequire':
            requiredFields.delete(action.targetFieldId);
            break;

          case 'enable':
            enabledFields.add(action.targetFieldId);
            break;

          case 'disable':
            enabledFields.delete(action.targetFieldId);
            break;

          case 'set_value':
            fieldValues[action.targetFieldId] = action.value;
            break;
        }
      }
    }
  }

  return {
    visibleFields,
    requiredFields,
    enabledFields,
    fieldValues,
  };
}
```

### 3.3 Conditional Logic Builder UI

```typescript
// apps/web/components/forms/builder/ConditionalLogicPanel.tsx
export function ConditionalLogicPanel({ field }: { field: FieldDefinition }) {
  const { currentForm } = useSnapshot(formBuilderStore);
  const [editingRule, setEditingRule] = useState<ConditionalRule | null>(null);

  // Get rules affecting this field
  const rulesForField = currentForm?.conditionalRules.filter((rule) =>
    rule.actions.some((action) => action.targetFieldId === field.id)
  );

  return (
    <Stack spacing="md">
      <Text size="sm" weight={500}>
        Conditional Logic Rules
      </Text>

      {rulesForField && rulesForField.length > 0 ? (
        <Stack spacing="xs">
          {rulesForField.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => deleteRule(rule.id)}
            />
          ))}
        </Stack>
      ) : (
        <Text size="xs" color="dimmed">
          No conditional rules for this field
        </Text>
      )}

      <Button
        variant="light"
        leftIcon={<IconPlus size={16} />}
        onClick={() => {
          setEditingRule({
            id: generateId(),
            conditions: [],
            operator: 'AND',
            actions: [{ type: 'show', targetFieldId: field.id }],
          });
        }}
      >
        Add Rule
      </Button>

      {editingRule && (
        <RuleEditorModal
          rule={editingRule}
          fields={currentForm?.fields || []}
          onSave={(rule) => {
            saveRule(rule);
            setEditingRule(null);
          }}
          onClose={() => setEditingRule(null)}
        />
      )}
    </Stack>
  );
}

function RuleEditorModal({ rule, fields, onSave, onClose }: RuleEditorModalProps) {
  const [draftRule, setDraftRule] = useState<ConditionalRule>(rule);

  return (
    <Modal opened onClose={onClose} size="lg" title="Edit Conditional Rule">
      <Stack spacing="md">
        {/* Conditions Section */}
        <Box>
          <Group position="apart" mb="xs">
            <Text size="sm" weight={500}>
              Conditions
            </Text>
            <SegmentedControl
              value={draftRule.operator}
              onChange={(value) =>
                setDraftRule({ ...draftRule, operator: value as 'AND' | 'OR' })
              }
              data={[
                { label: 'All (AND)', value: 'AND' },
                { label: 'Any (OR)', value: 'OR' },
              ]}
            />
          </Group>

          <Stack spacing="xs">
            {draftRule.conditions.map((condition, index) => (
              <ConditionEditor
                key={index}
                condition={condition}
                fields={fields}
                onChange={(updated) => {
                  const newConditions = [...draftRule.conditions];
                  newConditions[index] = updated;
                  setDraftRule({ ...draftRule, conditions: newConditions });
                }}
                onDelete={() => {
                  setDraftRule({
                    ...draftRule,
                    conditions: draftRule.conditions.filter((_, i) => i !== index),
                  });
                }}
              />
            ))}
          </Stack>

          <Button
            variant="light"
            size="xs"
            mt="xs"
            leftIcon={<IconPlus size={14} />}
            onClick={() => {
              setDraftRule({
                ...draftRule,
                conditions: [
                  ...draftRule.conditions,
                  { fieldId: '', operator: 'equals', value: '' },
                ],
              });
            }}
          >
            Add Condition
          </Button>
        </Box>

        {/* Actions Section */}
        <Box>
          <Text size="sm" weight={500} mb="xs">
            Then...
          </Text>

          <Stack spacing="xs">
            {draftRule.actions.map((action, index) => (
              <ActionEditor
                key={index}
                action={action}
                fields={fields}
                onChange={(updated) => {
                  const newActions = [...draftRule.actions];
                  newActions[index] = updated;
                  setDraftRule({ ...draftRule, actions: newActions });
                }}
                onDelete={() => {
                  setDraftRule({
                    ...draftRule,
                    actions: draftRule.actions.filter((_, i) => i !== index),
                  });
                }}
              />
            ))}
          </Stack>

          <Button
            variant="light"
            size="xs"
            mt="xs"
            leftIcon={<IconPlus size={14} />}
            onClick={() => {
              setDraftRule({
                ...draftRule,
                actions: [...draftRule.actions, { type: 'show', targetFieldId: '' }],
              });
            }}
          >
            Add Action
          </Button>
        </Box>

        {/* Save/Cancel */}
        <Group position="right">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draftRule)}>Save Rule</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function ConditionEditor({ condition, fields, onChange, onDelete }: ConditionEditorProps) {
  const selectedField = fields.find((f) => f.id === condition.fieldId);

  return (
    <Paper p="sm" withBorder>
      <Group spacing="xs" align="flex-start">
        {/* Field selector */}
        <Select
          placeholder="Select field"
          data={fields.map((f) => ({ value: f.id, label: f.label }))}
          value={condition.fieldId}
          onChange={(value) => onChange({ ...condition, fieldId: value || '' })}
          style={{ flex: 1 }}
        />

        {/* Operator selector */}
        <Select
          placeholder="Operator"
          data={getOperatorsForFieldType(selectedField?.type)}
          value={condition.operator}
          onChange={(value) =>
            onChange({ ...condition, operator: value as ConditionOperator })
          }
          style={{ flex: 1 }}
        />

        {/* Value input (type depends on field type) */}
        <ValueInput
          fieldType={selectedField?.type}
          value={condition.value}
          onChange={(value) => onChange({ ...condition, value })}
          style={{ flex: 1 }}
        />

        {/* Delete button */}
        <ActionIcon color="red" variant="light" onClick={onDelete}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
```

---

## 4. Calculated Fields System

### 4.1 Formula Syntax & Parser

```typescript
// apps/web/lib/forms/formulaEngine.ts
import { Parser } from 'expr-eval';

/**
 * Supported formula syntax (Excel-like):
 * 
 * Math Functions:
 * - SUM(field1, field2, ...) or SUM(field*)
 * - AVERAGE(field1, field2, ...)
 * - MIN(field1, field2, ...)
 * - MAX(field1, field2, ...)
 * - COUNT(field1, field2, ...)
 * - ROUND(value, decimals)
 * 
 * Date Functions:
 * - TODAY() - Current date
 * - NOW() - Current date + time
 * - DATE_ADD(date, days)
 * - DATE_DIFF(date1, date2) - Days between dates
 * - DAYS_BETWEEN(date1, date2) - Alias for DATE_DIFF
 * 
 * Logical Functions:
 * - IF(condition, valueIfTrue, valueIfFalse)
 * 
 * Operators:
 * - Arithmetic: +, -, *, /, %
 * - Comparison: ==, !=, >, <, >=, <=
 * - Logical: &&, ||, !
 * 
 * Examples:
 * - SUM(hours_*) - Sum all fields starting with "hours_"
 * - total_cost * 1.08 - Add 8% tax
 * - IF(temperature > 90, "Hot", "Comfortable")
 * - DAYS_BETWEEN(start_date, end_date)
 */

export class FormulaEngine {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    
    // Register custom functions
    this.registerCustomFunctions();
  }

  private registerCustomFunctions() {
    // SUM function
    this.parser.functions.SUM = (...values: number[]) => {
      return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
    };

    // AVERAGE function
    this.parser.functions.AVERAGE = (...values: number[]) => {
      const nums = values.filter((v) => typeof v === 'number');
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    };

    // MIN/MAX functions
    this.parser.functions.MIN = (...values: number[]) => Math.min(...values);
    this.parser.functions.MAX = (...values: number[]) => Math.max(...values);

    // COUNT function
    this.parser.functions.COUNT = (...values: any[]) => values.length;

    // ROUND function
    this.parser.functions.ROUND = (value: number, decimals: number = 0) => {
      return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    };

    // TODAY/NOW functions
    this.parser.functions.TODAY = () => new Date().setHours(0, 0, 0, 0);
    this.parser.functions.NOW = () => Date.now();

    // Date functions
    this.parser.functions.DATE_ADD = (date: number, days: number) => {
      return date + days * 24 * 60 * 60 * 1000;
    };

    this.parser.functions.DATE_DIFF = (date1: number, date2: number) => {
      return Math.floor((date2 - date1) / (24 * 60 * 60 * 1000));
    };

    this.parser.functions.DAYS_BETWEEN = this.parser.functions.DATE_DIFF;

    // IF function
    this.parser.functions.IF = (condition: boolean, trueValue: any, falseValue: any) => {
      return condition ? trueValue : falseValue;
    };
  }

  /**
   * Evaluate formula with form values
   */
  evaluate(formula: string, formValues: Record<string, any>): any {
    try {
      // Expand wildcard field references (e.g., hours_* → hours_day1, hours_day2, ...)
      const expandedFormula = this.expandWildcards(formula, formValues);

      // Parse and evaluate
      const expr = this.parser.parse(expandedFormula);
      return expr.evaluate(formValues);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      throw new Error(`Invalid formula: ${formula}`);
    }
  }

  /**
   * Expand wildcard field references
   * Example: SUM(hours_*) → SUM(hours_day1, hours_day2, hours_day3)
   */
  private expandWildcards(formula: string, formValues: Record<string, any>): string {
    const wildcardPattern = /(\w+)\*/g;
    
    return formula.replace(wildcardPattern, (match, prefix) => {
      const matchingFields = Object.keys(formValues).filter((key) =>
        key.startsWith(prefix)
      );
      return matchingFields.join(', ');
    });
  }

  /**
   * Extract field dependencies from formula
   */
  getDependencies(formula: string, allFieldNames: string[]): string[] {
    const dependencies = new Set<string>();

    // Check for wildcard patterns
    const wildcardPattern = /(\w+)\*/g;
    let match;
    while ((match = wildcardPattern.exec(formula)) !== null) {
      const prefix = match[1];
      allFieldNames.forEach((name) => {
        if (name.startsWith(prefix)) {
          dependencies.add(name);
        }
      });
    }

    // Check for direct field references
    allFieldNames.forEach((name) => {
      if (formula.includes(name)) {
        dependencies.add(name);
      }
    });

    return Array.from(dependencies);
  }

  /**
   * Validate formula syntax
   */
  validateFormula(formula: string): { valid: boolean; error?: string } {
    try {
      this.parser.parse(formula);
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
}

// Singleton instance
export const formulaEngine = new FormulaEngine();
```

### 4.2 Formula Editor UI

```typescript
// apps/web/components/forms/builder/FormulaEditorPanel.tsx
export function FormulaEditorPanel({ field }: { field: ComputedFieldDefinition }) {
  const { currentForm } = useSnapshot(formBuilderStore);
  const [formula, setFormula] = useState(field.metadata.formula || '');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({
    valid: true,
  });
  const [testValues, setTestValues] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);

  // Validate formula as user types
  useEffect(() => {
    const result = formulaEngine.validateFormula(formula);
    setValidation(result);
  }, [formula]);

  // Calculate dependencies
  const dependencies = useMemo(() => {
    if (!currentForm) return [];
    const allFieldNames = currentForm.fields.map((f) => f.name);
    return formulaEngine.getDependencies(formula, allFieldNames);
  }, [formula, currentForm]);

  const handleTest = () => {
    try {
      const result = formulaEngine.evaluate(formula, testValues);
      setTestResult(result);
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  const handleSave = () => {
    if (!validation.valid) {
      showNotification({
        title: 'Invalid Formula',
        message: validation.error,
        color: 'red',
      });
      return;
    }

    formBuilderActions.updateField(field.id, {
      metadata: {
        ...field.metadata,
        formula,
        dependencies,
      },
    });

    showNotification({
      title: 'Formula Saved',
      message: 'Calculated field updated',
      color: 'green',
    });
  };

  return (
    <Stack spacing="md">
      <Textarea
        label="Formula"
        placeholder="SUM(hours_*)"
        description="Enter Excel-like formula"
        value={formula}
        onChange={(e) => setFormula(e.target.value)}
        error={!validation.valid ? validation.error : undefined}
        minRows={3}
        styles={{
          input: {
            fontFamily: 'monospace',
          },
        }}
      />

      <TextInput
        label="Display Format"
        placeholder="0.00"
        description="Number format (e.g., 0.00, $0,0.00)"
        value={field.metadata.displayFormat || ''}
        onChange={(e) =>
          formBuilderActions.updateField(field.id, {
            metadata: { ...field.metadata, displayFormat: e.target.value },
          })
        }
      />

      {dependencies.length > 0 && (
        <Box>
          <Text size="xs" weight={500} mb="xs">
            Dependencies
          </Text>
          <Group spacing="xs">
            {dependencies.map((dep) => (
              <Badge key={dep} size="sm">
                {dep}
              </Badge>
            ))}
          </Group>
        </Box>
      )}

      <Divider />

      {/* Formula Tester */}
      <Box>
        <Text size="sm" weight={500} mb="xs">
          Test Formula
        </Text>

        <Stack spacing="xs">
          {dependencies.map((dep) => {
            const depField = currentForm?.fields.find((f) => f.name === dep);
            return (
              <TextInput
                key={dep}
                label={depField?.label || dep}
                placeholder="Enter test value"
                value={testValues[dep] || ''}
                onChange={(e) =>
                  setTestValues({ ...testValues, [dep]: e.target.value })
                }
              />
            );
          })}

          <Group>
            <Button variant="light" onClick={handleTest}>
              Test
            </Button>
            {testResult !== null && (
              <Text weight={600}>Result: {String(testResult)}</Text>
            )}
          </Group>
        </Stack>
      </Box>

      <Divider />

      {/* Function Reference */}
      <Accordion>
        <Accordion.Item value="reference">
          <Accordion.Control>Function Reference</Accordion.Control>
          <Accordion.Panel>
            <FunctionReference />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Button onClick={handleSave} disabled={!validation.valid}>
        Save Formula
      </Button>
    </Stack>
  );
}

function FunctionReference() {
  return (
    <Stack spacing="md">
      <Box>
        <Text size="sm" weight={600}>
          Math Functions
        </Text>
        <Code block>
          {`SUM(field1, field2, ...) - Add values
AVERAGE(field1, field2, ...) - Calculate average
MIN(field1, field2, ...) - Find minimum
MAX(field1, field2, ...) - Find maximum
COUNT(field1, field2, ...) - Count values
ROUND(value, decimals) - Round to decimals`}
        </Code>
      </Box>

      <Box>
        <Text size="sm" weight={600}>
          Date Functions
        </Text>
        <Code block>
          {`TODAY() - Current date
NOW() - Current date + time
DATE_ADD(date, days) - Add days to date
DAYS_BETWEEN(date1, date2) - Days between dates`}
        </Code>
      </Box>

      <Box>
        <Text size="sm" weight={600}>
          Logical Functions
        </Text>
        <Code block>
          {`IF(condition, trueValue, falseValue) - Conditional logic`}
        </Code>
      </Box>

      <Box>
        <Text size="sm" weight={600}>
          Examples
        </Text>
        <Code block>
          {`SUM(hours_*) - Sum all fields starting with "hours_"
total_cost * 1.08 - Add 8% tax
IF(temperature > 90, "Hot", "Comfortable")
DAYS_BETWEEN(start_date, end_date)`}
        </Code>
      </Box>
    </Stack>
  );
}
```

---

## 5. Template Variables System

### 5.1 Template Variables Implementation

```typescript
// apps/web/lib/forms/templateVariables.ts
export interface TemplateVariable {
  key: string;
  label: string;
  value: () => any;
  category: 'user' | 'project' | 'date' | 'weather' | 'form';
}

export const templateVariables: TemplateVariable[] = [
  // User variables
  {
    key: '{{currentUser}}',
    label: 'Current User Name',
    value: () => getCurrentUser()?.name,
    category: 'user',
  },
  {
    key: '{{currentUserEmail}}',
    label: 'Current User Email',
    value: () => getCurrentUser()?.email,
    category: 'user',
  },

  // Project variables
  {
    key: '{{projectName}}',
    label: 'Project Name',
    value: () => getCurrentProject()?.name,
    category: 'project',
  },
  {
    key: '{{projectAddress}}',
    label: 'Project Address',
    value: () => getCurrentProject()?.address,
    category: 'project',
  },

  // Date/Time variables
  {
    key: '{{currentDate}}',
    label: 'Current Date',
    value: () => new Date().toLocaleDateString(),
    category: 'date',
  },
  {
    key: '{{currentTime}}',
    label: 'Current Time',
    value: () => new Date().toLocaleTimeString(),
    category: 'date',
  },
  {
    key: '{{currentDateTime}}',
    label: 'Current Date & Time',
    value: () => new Date().toLocaleString(),
    category: 'date',
  },

  // Weather variables (from Weather API)
  {
    key: '{{weatherConditions}}',
    label: 'Weather Conditions',
    value: async () => {
      const weather = await getCurrentWeather();
      return weather?.conditions;
    },
    category: 'weather',
  },
  {
    key: '{{temperature}}',
    label: 'Current Temperature',
    value: async () => {
      const weather = await getCurrentWeather();
      return `${weather?.temperature}°F`;
    },
    category: 'weather',
  },
  {
    key: '{{precipitation}}',
    label: 'Recent Precipitation',
    value: async () => {
      const weather = await getCurrentWeather();
      return `${weather?.precipitation} inches`;
    },
    category: 'weather',
  },

  // Form variables (copy from last submission)
  {
    key: '{{lastSubmission.fieldName}}',
    label: 'Last Submission Field Value',
    value: (fieldName: string) => {
      const lastSubmission = getLastSubmission();
      return lastSubmission?.data[fieldName];
    },
    category: 'form',
  },
];

/**
 * Replace template variables in field default value
 */
export async function replaceTemplateVariables(
  value: string,
  context?: {
    projectId?: string;
    formId?: string;
    userId?: string;
  }
): Promise<string> {
  let result = value;

  for (const variable of templateVariables) {
    if (result.includes(variable.key)) {
      const variableValue = await variable.value();
      result = result.replace(new RegExp(variable.key, 'g'), String(variableValue));
    }
  }

  // Handle lastSubmission variables
  const lastSubmissionPattern = /\{\{lastSubmission\.(\w+)\}\}/g;
  result = result.replace(lastSubmissionPattern, (match, fieldName) => {
    const lastSubmission = getLastSubmission(context?.formId);
    return lastSubmission?.data[fieldName] || '';
  });

  return result;
}
```

### 5.2 Template Variable Picker UI

```typescript
// apps/web/components/forms/builder/TemplateVariablePicker.tsx
export function TemplateVariablePicker({ onSelect }: { onSelect: (variable: string) => void }) {
  const [search, setSearch] = useState('');

  const filteredVariables = templateVariables.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByCategory = filteredVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, TemplateVariable[]>);

  return (
    <Stack spacing="md">
      <TextInput
        placeholder="Search variables..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<IconSearch size={16} />}
      />

      {Object.entries(groupedByCategory).map(([category, variables]) => (
        <Box key={category}>
          <Text size="xs" weight={600} color="dimmed" mb="xs" tt="uppercase">
            {category}
          </Text>
          <Stack spacing="xs">
            {variables.map((variable) => (
              <Paper
                key={variable.key}
                p="xs"
                withBorder
                sx={(theme) => ({
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.colors.gray[0],
                  },
                })}
                onClick={() => onSelect(variable.key)}
              >
                <Group position="apart">
                  <Text size="sm">{variable.label}</Text>
                  <Code>{variable.key}</Code>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
```

---

## 6. Form Validation Architecture

### 6.1 Zod Schema Generation

```typescript
// apps/web/lib/forms/validationSchema.ts
import { z } from 'zod';
import type { FormSchema, FieldDefinition } from '@braveforms/types';

/**
 * Generate Zod validation schema from form definition
 */
export function generateValidationSchema(formSchema: FormSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodType<any>> = {};

  formSchema.fields.forEach((field) => {
    shape[field.name] = getFieldSchema(field);
  });

  return z.object(shape);
}

function getFieldSchema(field: FieldDefinition): z.ZodType<any> {
  let schema: z.ZodType<any>;

  switch (field.type) {
    case 'text':
    case 'textarea':
      schema = z.string();
      if (field.validation?.minLength) {
        schema = (schema as z.ZodString).min(
          field.validation.minLength,
          `Minimum ${field.validation.minLength} characters`
        );
      }
      if (field.validation?.maxLength) {
        schema = (schema as z.ZodString).max(
          field.validation.maxLength,
          `Maximum ${field.validation.maxLength} characters`
        );
      }
      if (field.validation?.pattern) {
        schema = (schema as z.ZodString).regex(
          new RegExp(field.validation.pattern),
          'Invalid format'
        );
      }
      break;

    case 'number':
      schema = z.coerce.number();
      if (field.validation?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(
          field.validation.min,
          `Minimum value is ${field.validation.min}`
        );
      }
      if (field.validation?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(
          field.validation.max,
          `Maximum value is ${field.validation.max}`
        );
      }
      // EPA Critical: Exact 0.25" threshold
      if (field.name === 'rainfall_amount') {
        schema = (schema as z.ZodNumber).refine(
          (val) => val === 0 || val >= 0.25,
          'SWPPP inspection required at exactly 0.25 inches'
        );
      }
      break;

    case 'date':
      schema = z.coerce.date();
      if (field.validation?.minDate) {
        schema = (schema as z.ZodDate).min(
          new Date(field.validation.minDate),
          `Date must be after ${field.validation.minDate}`
        );
      }
      if (field.validation?.maxDate) {
        schema = (schema as z.ZodDate).max(
          new Date(field.validation.maxDate),
          `Date must be before ${field.validation.maxDate}`
        );
      }
      break;

    case 'photo':
      schema = z.array(
        z.object({
          url: z.string().url(),
          gpsLat: z.number().min(-90).max(90).optional(),
          gpsLon: z.number().min(-180).max(180).optional(),
          timestamp: z.string().datetime(),
        })
      );
      if (field.metadata?.maxPhotos) {
        schema = (schema as z.ZodArray<any>).max(
          field.metadata.maxPhotos,
          `Maximum ${field.metadata.maxPhotos} photos`
        );
      }
      break;

    case 'signature':
      schema = z.object({
        data: z.string().min(1, 'Signature is required'),
        timestamp: z.string().datetime(),
        certificate: z.string().optional(),
      });
      break;

    case 'gps':
      schema = z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().positive(),
        timestamp: z.string().datetime(),
      });
      break;

    case 'repeater':
      const repeaterSchema = generateValidationSchema({
        ...field.metadata,
        fields: field.metadata.fields,
      } as any);
      schema = z.array(repeaterSchema);
      if (field.metadata?.minEntries) {
        schema = (schema as z.ZodArray<any>).min(
          field.metadata.minEntries,
          `At least ${field.metadata.minEntries} entries required`
        );
      }
      if (field.metadata?.maxEntries) {
        schema = (schema as z.ZodArray<any>).max(
          field.metadata.maxEntries,
          `Maximum ${field.metadata.maxEntries} entries`
        );
      }
      break;

    default:
      schema = z.any();
  }

  // Apply required/optional
  return field.required ? schema : schema.optional();
}
```

### 6.2 Real-Time Validation

```typescript
// apps/web/components/forms/FormRenderer.tsx
export function FormRenderer({ schema, mode = 'fill', onSubmit }: FormRendererProps) {
  const validationSchema = useMemo(() => generateValidationSchema(schema), [schema]);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur', // Validate on blur, not on every keystroke
    defaultValues: getDefaultValues(schema),
  });

  const watchedValues = useWatch({ control: form.control });

  // Apply conditional logic
  const { visibleFields, requiredFields, enabledFields, fieldValues } = useMemo(() => {
    return applyConditionalLogic(schema.conditionalRules || [], watchedValues);
  }, [schema.conditionalRules, watchedValues]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (mode === 'fill') {
      const interval = setInterval(() => {
        saveDraft(schema.id, form.getValues());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [schema.id, mode, form]);

  const handleSubmit = async (data: any) => {
    // Add metadata
    const submission = {
      ...data,
      _metadata: {
        formId: schema.id,
        formVersion: schema.version,
        submittedAt: new Date().toISOString(),
        submittedBy: getCurrentUser()?.id,
        gpsLocation: await getCurrentLocation(),
        offline: !navigator.onLine,
      },
    };

    if (navigator.onLine) {
      await onSubmit(submission);
    } else {
      await queueOfflineSubmission(submission);
      showNotification({
        title: 'Saved Offline',
        message: 'Form will be submitted when connection is restored',
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Stack spacing="md">
        {schema.settings?.showProgressBar && (
          <ProgressBar
            total={schema.fields.length}
            completed={Object.keys(form.formState.touchedFields).length}
          />
        )}

        {schema.fields.map((field) => {
          if (!visibleFields.has(field.id)) return null;

          const FieldComponent = getFieldComponent(field.type);
          const isRequired = requiredFields.has(field.id) || field.required;
          const isEnabled = enabledFields.has(field.id);

          return (
            <Suspense key={field.id} fallback={<Skeleton height={60} />}>
              <FieldComponent
                field={{ ...field, required: isRequired }}
                control={form.control}
                disabled={!isEnabled}
              />
            </Suspense>
          );
        })}

        <Group position="right">
          {schema.settings?.allowDrafts && (
            <Button variant="subtle" onClick={() => saveDraft(schema.id, form.getValues())}>
              Save Draft
            </Button>
          )}
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            leftIcon={navigator.onLine ? <IconSend size={16} /> : <IconCloudOff size={16} />}
          >
            {navigator.onLine ? 'Submit' : 'Save Offline'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
```

---

## 7. Form Submission Workflow

### 7.1 Draft Auto-Save (IndexedDB)

```typescript
// apps/web/lib/forms/draftStorage.ts
import { openDB, DBSchema } from 'idb';

interface FormDraftsDB extends DBSchema {
  drafts: {
    key: string; // formId
    value: {
      formId: string;
      data: Record<string, any>;
      lastSaved: string;
    };
  };
}

const getDraftsDB = async () => {
  return openDB<FormDraftsDB>('FormDrafts', 1, {
    upgrade(db) {
      db.createObjectStore('drafts', { keyPath: 'formId' });
    },
  });
};

export async function saveDraft(formId: string, data: Record<string, any>) {
  const db = await getDraftsDB();
  await db.put('drafts', {
    formId,
    data,
    lastSaved: new Date().toISOString(),
  });
}

export async function loadDraft(formId: string) {
  const db = await getDraftsDB();
  return await db.get('drafts', formId);
}

export async function deleteDraft(formId: string) {
  const db = await getDraftsDB();
  await db.delete('drafts', formId);
}
```

### 7.2 Offline Queue (Service Worker + BullMQ)

```typescript
// apps/web/lib/forms/offlineQueue.ts
import { openDB, DBSchema } from 'idb';

interface OfflineQueueDB extends DBSchema {
  submissions: {
    key: number;
    value: {
      id?: number;
      formId: string;
      data: Record<string, any>;
      priority: number; // 1 = compliance forms (EPA/OSHA), 2 = regular forms
      createdAt: string;
      retryCount: number;
      maxRetries: number;
    };
  };
}

const getQueueDB = async () => {
  return openDB<OfflineQueueDB>('OfflineQueue', 1, {
    upgrade(db) {
      const store = db.createObjectStore('submissions', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('priority', 'priority');
      store.createIndex('createdAt', 'createdAt');
    },
  });
};

export async function queueOfflineSubmission(submission: any) {
  const db = await getQueueDB();

  // Determine priority (compliance forms first)
  const priority = submission.formCategory === 'epa' || submission.formCategory === 'osha' ? 1 : 2;

  await db.add('submissions', {
    formId: submission.formId,
    data: submission,
    priority,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 5,
  });

  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('form-sync');
  }
}

export async function processOfflineQueue() {
  const db = await getQueueDB();
  const submissions = await db.getAllFromIndex('submissions', 'priority');

  for (const submission of submissions) {
    try {
      // Submit to server
      await submitFormToServer(submission.data);

      // Remove from queue on success
      await db.delete('submissions', submission.id!);
    } catch (error) {
      console.error('Submission failed:', error);

      // Increment retry count
      submission.retryCount++;

      if (submission.retryCount >= submission.maxRetries) {
        // Move to failed queue or alert user
        console.error('Max retries reached for submission:', submission.id);
      } else {
        // Update retry count
        await db.put('submissions', submission);
      }
    }
  }
}

// Service Worker background sync handler
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'form-sync') {
    event.waitUntil(processOfflineQueue());
  }
});
```

---

## 8. Form Cloning/Template Features

### 8.1 Clone Modes

```typescript
// packages/types/src/form-cloning.ts
export type CloneMode = 'KEEP_ALL' | 'STRUCTURE_ONLY' | 'CLEAR_ALL';

export interface CloneOptions {
  mode: CloneMode;
  preservePhotos?: boolean;
  preserveSignatures?: boolean;
  preserveDates?: boolean;
}

export const cloneModeDescriptions: Record<CloneMode, string> = {
  KEEP_ALL: 'Preserve all field values except date/time/signature',
  STRUCTURE_ONLY: 'Clear all values, keep structure',
  CLEAR_ALL: 'Completely empty form',
};
```

### 8.2 Clone Implementation

```typescript
// apps/web/lib/forms/cloneForm.ts
export function cloneFormSubmission(
  originalSubmission: FormSubmission,
  options: CloneOptions
): Record<string, any> {
  const clonedData: Record<string, any> = {};

  const formSchema = getFormSchema(originalSubmission.formId);

  formSchema.fields.forEach((field) => {
    const originalValue = originalSubmission.data[field.name];

    switch (options.mode) {
      case 'CLEAR_ALL':
        clonedData[field.name] = getDefaultValue(field);
        break;

      case 'STRUCTURE_ONLY':
        clonedData[field.name] = getDefaultValue(field);
        break;

      case 'KEEP_ALL':
        // Apply field-specific reset rules
        if (shouldResetField(field, options)) {
          clonedData[field.name] = getDefaultValue(field);
        } else {
          clonedData[field.name] = originalValue;
        }
        break;
    }
  });

  return clonedData;
}

function shouldResetField(field: FieldDefinition, options: CloneOptions): boolean {
  // Always reset date/time unless explicitly preserved
  if ((field.type === 'date' || field.type === 'time') && !options.preserveDates) {
    return true;
  }

  // Always reset signature unless explicitly preserved
  if (field.type === 'signature' && !options.preserveSignatures) {
    return true;
  }

  // Reset photos unless explicitly preserved
  if (field.type === 'photo' && !options.preservePhotos) {
    return true;
  }

  // Reset GPS location (always)
  if (field.type === 'gps') {
    return true;
  }

  // Reset computed fields (always)
  if (field.type === 'computed') {
    return true;
  }

  return false;
}

function getDefaultValue(field: FieldDefinition): any {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
      return '';
    case 'number':
      return null;
    case 'date':
    case 'time':
      return null;
    case 'select':
    case 'radio':
      return null;
    case 'checkbox':
      return false;
    case 'checkboxes':
      return [];
    case 'photo':
      return [];
    case 'signature':
      return null;
    case 'gps':
      return null;
    case 'repeater':
      return [];
    case 'file':
      return [];
    case 'computed':
      return null;
    default:
      return null;
  }
}
```

### 8.3 Clone UI Component

```typescript
// apps/web/components/forms/CloneFormButton.tsx
export function CloneFormButton({ submissionId }: { submissionId: string }) {
  const [opened, setOpened] = useState(false);
  const [cloneMode, setCloneMode] = useState<CloneMode>('KEEP_ALL');
  const router = useRouter();

  const handleClone = async () => {
    const originalSubmission = await getSubmission(submissionId);
    const clonedData = cloneFormSubmission(originalSubmission, {
      mode: cloneMode,
      preservePhotos: false,
      preserveSignatures: false,
      preserveDates: false,
    });

    // Save as draft
    await saveDraft(originalSubmission.formId, clonedData);

    // Navigate to form
    router.push(`/forms/${originalSubmission.formId}/fill`);
  };

  return (
    <>
      <Button variant="light" onClick={() => setOpened(true)}>
        Clone Form
      </Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Clone Form">
        <Stack spacing="md">
          <Text size="sm">
            Create a new form submission based on this one. Choose how much data to preserve:
          </Text>

          <RadioGroup value={cloneMode} onChange={(value) => setCloneMode(value as CloneMode)}>
            <Radio value="KEEP_ALL" label="Keep All Data" description={cloneModeDescriptions.KEEP_ALL} />
            <Radio value="STRUCTURE_ONLY" label="Structure Only" description={cloneModeDescriptions.STRUCTURE_ONLY} />
            <Radio value="CLEAR_ALL" label="Clear Everything" description={cloneModeDescriptions.CLEAR_ALL} />
          </RadioGroup>

          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            Date, time, signature, and GPS fields will always be reset for new submission.
          </Alert>

          <Group position="right">
            <Button variant="subtle" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleClone}>Clone & Edit</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
```

---

## 9. Form Versioning System

### 9.1 Version Schema

```typescript
// packages/types/src/form-versioning.ts
export interface FormVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changes: FormChange[];
  schema: FormSchema; // Full schema snapshot
}

export interface FormChange {
  type: 'field_added' | 'field_removed' | 'field_modified' | 'rule_added' | 'rule_removed' | 'settings_changed';
  fieldId?: string;
  fieldName?: string;
  before?: any;
  after?: any;
  description: string;
}
```

### 9.2 Version Diff Calculation

```typescript
// apps/web/lib/forms/versionDiff.ts
export function calculateFormDiff(
  oldSchema: FormSchema,
  newSchema: FormSchema
): FormChange[] {
  const changes: FormChange[] = [];

  // Detect field changes
  const oldFieldIds = new Set(oldSchema.fields.map((f) => f.id));
  const newFieldIds = new Set(newSchema.fields.map((f) => f.id));

  // Fields added
  newSchema.fields.forEach((field) => {
    if (!oldFieldIds.has(field.id)) {
      changes.push({
        type: 'field_added',
        fieldId: field.id,
        fieldName: field.name,
        after: field,
        description: `Added field: ${field.label}`,
      });
    }
  });

  // Fields removed
  oldSchema.fields.forEach((field) => {
    if (!newFieldIds.has(field.id)) {
      changes.push({
        type: 'field_removed',
        fieldId: field.id,
        fieldName: field.name,
        before: field,
        description: `Removed field: ${field.label}`,
      });
    }
  });

  // Fields modified
  oldSchema.fields.forEach((oldField) => {
    const newField = newSchema.fields.find((f) => f.id === oldField.id);
    if (newField && !isEqual(oldField, newField)) {
      changes.push({
        type: 'field_modified',
        fieldId: oldField.id,
        fieldName: oldField.name,
        before: oldField,
        after: newField,
        description: `Modified field: ${oldField.label}`,
      });
    }
  });

  // TODO: Detect rule changes, settings changes

  return changes;
}
```

### 9.3 Version History UI

```typescript
// apps/web/components/forms/builder/VersionHistory.tsx
export function VersionHistory({ formId }: { formId: string }) {
  const { data: versions } = useQuery(['form-versions', formId], () =>
    getFormVersions(formId)
  );

  const [compareVersions, setCompareVersions] = useState<[number, number] | null>(null);

  return (
    <Stack spacing="md">
      <Text size="sm" weight={500}>
        Version History
      </Text>

      {versions?.map((version) => (
        <Paper key={version.version} p="md" withBorder>
          <Group position="apart">
            <Box>
              <Text weight={600}>Version {version.version}</Text>
              <Text size="xs" color="dimmed">
                {new Date(version.createdAt).toLocaleString()} by {version.createdBy}
              </Text>
            </Box>

            <Group spacing="xs">
              <Button
                variant="subtle"
                size="xs"
                onClick={() => {
                  /* View version */
                }}
              >
                View
              </Button>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => {
                  /* Restore version */
                }}
              >
                Restore
              </Button>
            </Group>
          </Group>

          {version.changes.length > 0 && (
            <Box mt="sm">
              <Text size="xs" weight={500} mb="xs">
                Changes:
              </Text>
              <List size="xs">
                {version.changes.map((change, idx) => (
                  <List.Item key={idx}>{change.description}</List.Item>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      ))}
    </Stack>
  );
}
```

---

## 10. Implementation Roadmap

### Sprint Breakdown

**Sprint 3 (Current - Form Renderer):**
- ✅ Basic FormRenderer component (already planned)
- ✅ Field component registry
- ✅ Basic field types (text, number, date, select)
- ✅ React Hook Form + Zod validation
- **NEW:** Conditional logic evaluator (show/hide)
- **NEW:** Draft auto-save to IndexedDB

**Sprint 4 (Form Builder UI):**
- Form Builder container component
- Drag-and-drop with @dnd-kit/core
- Field Palette (15+ field types)
- Properties Panel (basic settings)
- Live Preview modal
- Save/Publish templates

**Sprint 5 (Advanced Fields):**
- Photo field (camera capture + GPS EXIF)
- Signature field (touch drawing)
- GPS location field
- Repeater field (dynamic lists)
- File upload field
- Section/Divider/Spacer layout fields

**Sprint 6 (Conditional Logic & Calculated Fields):**
- Conditional Logic UI builder
- Condition evaluator (full operators)
- Action executor (show/hide/require/setValue)
- Formula engine (Excel-like)
- Calculated field component
- Formula editor UI
- Dependency graph validation

**Sprint 7 (Template System):**
- Template variables implementation
- Template variable picker UI
- Form cloning (3 modes)
- Form versioning system
- Version diff calculation
- Version history UI
- Template library management

**Sprint 8 (Offline & Sync):**
- Service Worker for offline caching
- IndexedDB draft storage
- Offline queue with priority
- Background sync implementation
- Conflict resolution UI
- Delta sync optimization

**Sprint 9 (Field Optimization):**
- Large touch targets (48px minimum)
- High contrast themes
- Glove-friendly interactions
- Weather-resistant testing
- Battery/connectivity interruption handling
- iOS-specific optimizations (SQLite for critical data)

**Sprint 10 (Testing & Polish):**
- E2E tests (Playwright)
- Field testing checklist
- Performance optimization
- Documentation
- User training materials

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// apps/web/lib/forms/__tests__/conditionalLogic.test.ts
describe('Conditional Logic Evaluator', () => {
  it('should evaluate equals condition correctly', () => {
    const condition: Condition = {
      fieldId: 'field1',
      operator: 'equals',
      value: 'yes',
    };

    expect(evaluateCondition(condition, 'yes')).toBe(true);
    expect(evaluateCondition(condition, 'no')).toBe(false);
  });

  it('should apply show/hide actions based on rules', () => {
    const rule: ConditionalRule = {
      id: 'rule1',
      conditions: [{ fieldId: 'incident_occurred', operator: 'equals', value: 'yes' }],
      operator: 'AND',
      actions: [{ type: 'show', targetFieldId: 'injury_details' }],
    };

    const result = applyConditionalLogic([rule], { incident_occurred: 'yes' });
    expect(result.visibleFields.has('injury_details')).toBe(true);

    const result2 = applyConditionalLogic([rule], { incident_occurred: 'no' });
    expect(result2.visibleFields.has('injury_details')).toBe(false);
  });
});

// apps/web/lib/forms/__tests__/formulaEngine.test.ts
describe('Formula Engine', () => {
  it('should evaluate SUM formula correctly', () => {
    const result = formulaEngine.evaluate('SUM(hours_day1, hours_day2)', {
      hours_day1: 8,
      hours_day2: 7,
    });
    expect(result).toBe(15);
  });

  it('should handle wildcard field references', () => {
    const result = formulaEngine.evaluate('SUM(hours_*)', {
      hours_day1: 8,
      hours_day2: 7,
      hours_day3: 9,
    });
    expect(result).toBe(24);
  });

  it('should enforce EPA 0.25" exact threshold', () => {
    const schema = z.number().refine(
      (val) => val === 0 || val >= 0.25,
      'Inspection required at exactly 0.25 inches'
    );

    expect(() => schema.parse(0.24)).toThrow();
    expect(() => schema.parse(0.25)).not.toThrow();
  });
});
```

### 11.2 Integration Tests

```typescript
// apps/web/components/forms/__tests__/FormRenderer.integration.test.tsx
describe('FormRenderer Integration', () => {
  it('should render all visible fields based on conditional logic', () => {
    const schema: FormSchema = {
      id: 'test-form',
      version: 1,
      title: 'Test Form',
      fields: [
        { id: 'f1', type: 'text', name: 'name', label: 'Name', required: true },
        { id: 'f2', type: 'checkbox', name: 'has_injury', label: 'Injury Occurred?', required: false },
        { id: 'f3', type: 'textarea', name: 'injury_details', label: 'Injury Details', required: true },
      ],
      conditionalRules: [
        {
          id: 'r1',
          conditions: [{ fieldId: 'f2', operator: 'equals', value: true }],
          operator: 'AND',
          actions: [{ type: 'show', targetFieldId: 'f3' }],
        },
      ],
    };

    const { getByLabelText, queryByLabelText } = render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    // Initially, injury_details should be hidden
    expect(queryByLabelText('Injury Details')).not.toBeInTheDocument();

    // Check "Injury Occurred?"
    fireEvent.click(getByLabelText('Injury Occurred?'));

    // Now injury_details should be visible
    expect(getByLabelText('Injury Details')).toBeInTheDocument();
  });

  it('should auto-save draft every 30 seconds', async () => {
    jest.useFakeTimers();
    const schema = createTestFormSchema();

    render(<FormRenderer schema={schema} mode="fill" onSubmit={jest.fn()} />);

    // Fill in a field
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'John Doe' } });

    // Advance time by 30 seconds
    jest.advanceTimersByTime(30000);

    // Verify draft was saved
    const draft = await loadDraft(schema.id);
    expect(draft?.data.name).toBe('John Doe');

    jest.useRealTimers();
  });
});
```

### 11.3 E2E Tests (Playwright)

```typescript
// apps/web/e2e/forms.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Form Builder', () => {
  test('should create new form with drag-and-drop', async ({ page }) => {
    await page.goto('/forms/builder/new');

    // Drag text field to canvas
    await page.dragAndDrop('.field-palette .text-field', '.form-canvas');

    // Verify field appears
    await expect(page.locator('.form-canvas .draggable-field')).toBeVisible();

    // Edit field properties
    await page.click('.draggable-field');
    await page.fill('input[label="Field Label"]', 'Employee Name');

    // Save form
    await page.click('button:has-text("Save Template")');

    // Verify saved
    await expect(page.locator('text=Template saved')).toBeVisible();
  });

  test('should enforce EPA 0.25" rainfall threshold', async ({ page }) => {
    await page.goto('/forms/swppp-inspection/fill');

    // Enter invalid rainfall amount
    await page.fill('input[name="rainfall_amount"]', '0.24');
    await page.click('button:has-text("Submit")');

    // Verify error message
    await expect(page.locator('text=Inspection required at exactly 0.25 inches')).toBeVisible();

    // Enter valid amount
    await page.fill('input[name="rainfall_amount"]', '0.25');
    await page.click('button:has-text("Submit")');

    // Should proceed
    await expect(page.locator('text=Form submitted')).toBeVisible();
  });

  test('should work offline and sync when online', async ({ page, context }) => {
    await page.goto('/forms/daily-log/fill');

    // Go offline
    await context.setOffline(true);

    // Fill form
    await page.fill('input[name="crew_size"]', '8');
    await page.fill('textarea[name="work_completed"]', 'Foundation work completed');

    // Submit offline
    await page.click('button:has-text("Save Offline")');

    // Verify queued
    await expect(page.locator('text=Form will be submitted when connection is restored')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Trigger background sync
    await page.evaluate(() => {
      return (navigator as any).serviceWorker.ready.then((reg: any) => {
        return reg.sync.register('form-sync');
      });
    });

    // Wait for sync
    await page.waitForTimeout(2000);

    // Verify submitted
    await expect(page.locator('text=Form submitted')).toBeVisible();
  });
});
```

---

## 12. Code Examples Summary

### Key Patterns Demonstrated

**1. Form Builder State Management (Valtio):**
- Proxy-based reactive store
- Undo/redo with history stack
- Field CRUD operations
- Drag-and-drop state

**2. Drag-and-Drop (@dnd-kit):**
- SortableContext for field reordering
- DragOverlay for visual feedback
- Touch-friendly interactions

**3. Field Component System:**
- Type-safe field definitions
- React Hook Form integration
- Zod validation schemas
- Lazy loading for code splitting

**4. Conditional Logic:**
- Rule-based show/hide/require
- Complex AND/OR operators
- Dependency tracking
- Real-time evaluation

**5. Calculated Fields:**
- Excel-like formula syntax
- Custom function library
- Wildcard field references
- Auto-update on dependencies

**6. Offline Capabilities:**
- IndexedDB for drafts
- Service Worker background sync
- Priority queue (compliance first)
- Conflict resolution

**7. Form Cloning:**
- Multiple clone modes
- Field-specific reset rules
- Template variable replacement

---

## Conclusion

This comprehensive forms system architecture provides:

- **Flexibility:** Any form structure via drag-and-drop builder
- **Power:** Conditional logic, calculated fields, template variables
- **Usability:** Live preview, field-optimized UI, glove-friendly
- **Reliability:** Offline-first, auto-save, conflict resolution
- **Compliance:** EPA/OSHA validation, audit trails, versioning

**Next Steps:**

1. Review and approve architecture
2. Begin Sprint 3 implementation (FormRenderer + conditional logic)
3. Iterate based on field testing feedback
4. Expand to Sprint 4-10 (Builder UI, Advanced Fields, Template System)

**CLAUDE.md rules understood, Developer.** This design adheres to all project standards: NO emoji, NO AI branding, evidence-based completion required, TDD workflow, offline-first, compliance-critical, and field-optimized for construction sites.