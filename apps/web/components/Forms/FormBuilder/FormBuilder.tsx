'use client';

import React, { useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Title,
  Button,
  Group,
  ActionIcon,
  Text,
  Badge,
  Stack,
  ScrollArea,
  Divider,
  Tabs,
  Modal,
  TextInput,
  Textarea,
  Select,
  Notification,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconGripVertical,
  IconTrash,
  IconCopy,
  IconEye,
  IconDeviceFloppy,
  IconPlus,
  IconSettings,
  IconForms,
  IconPalette,
  IconCode,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import type { FieldDefinition, FormTemplate } from '@brave-forms/types';
import { FieldTypes } from '@brave-forms/types';

import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { FieldProperties } from './FieldProperties';
import { FormPreview } from './FormPreview';

interface FormBuilderProps {
  template?: FormTemplate;
  onSave: (template: Partial<FormTemplate>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function FormBuilder({ template, onSave, onCancel, loading = false }: FormBuilderProps) {
  const [formSchema, setFormSchema] = useState<Partial<FormTemplate>>(
    template || {
      name: 'New Form',
      description: '',
      category: 'CUSTOM',
      fields: [],
      logic: [],
      calculations: [],
    }
  );
  
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('builder');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form validation
  const form = useForm({
    initialValues: {
      name: formSchema.name || '',
      description: formSchema.description || '',
      category: formSchema.category || 'CUSTOM',
    },
    validate: {
      name: (value) => (!value ? 'Form name is required' : null),
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add a new field to the form
  const handleAddField = useCallback((fieldType: string) => {
    const newField: FieldDefinition = {
      id: generateId(),
      type: fieldType as any,
      label: `New ${fieldType} Field`,
      name: `field_${Date.now()}`,
      description: '',
      placeholder: '',
      defaultValue: undefined,
      validation: { required: false },
      order: formSchema.fields?.length || 0,
      width: 'full',
    };

    // Set default options for select/radio fields
    if (['select', 'multiSelect', 'radio'].includes(fieldType)) {
      newField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
    }

    // Set default validation for EPA compliance fields
    if (fieldType === 'number') {
      newField.validation = {
        required: false,
        min: 0,
        step: 0.01,
      };
    }

    setFormSchema((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));

    // Auto-select the new field
    setSelectedField(newField.id);
    
    notifications.show({
      title: 'Field Added',
      message: `${fieldType} field added successfully`,
      color: 'green',
      icon: <IconCheck size={16} />,
      autoClose: 2000,
    });
  }, [formSchema.fields]);

  // Update a field in the form
  const handleUpdateField = useCallback((fieldId: string, updates: Partial<FieldDefinition>) => {
    setFormSchema((prev) => ({
      ...prev,
      fields: (prev.fields || []).map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  }, []);

  // Delete a field from the form
  const handleDeleteField = useCallback((fieldId: string) => {
    setFormSchema((prev) => ({
      ...prev,
      fields: (prev.fields || []).filter((field) => field.id !== fieldId),
    }));
    
    if (selectedField === fieldId) {
      setSelectedField(null);
    }

    notifications.show({
      title: 'Field Removed',
      message: 'Field deleted successfully',
      color: 'orange',
      icon: <IconTrash size={16} />,
      autoClose: 2000,
    });
  }, [selectedField]);

  // Duplicate a field
  const handleDuplicateField = useCallback((fieldId: string) => {
    const field = formSchema.fields?.find((f) => f.id === fieldId);
    if (!field) return;

    const duplicatedField: FieldDefinition = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
      order: (formSchema.fields?.length || 0),
    };

    setFormSchema((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), duplicatedField],
    }));

    setSelectedField(duplicatedField.id);
    
    notifications.show({
      title: 'Field Duplicated',
      message: 'Field copied successfully',
      color: 'blue',
      icon: <IconCopy size={16} />,
      autoClose: 2000,
    });
  }, [formSchema.fields]);

  // Handle drag end for reordering fields
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const fields = formSchema.fields || [];
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      const reorderedFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
        ...field,
        order: index,
      }));

      setFormSchema((prev) => ({
        ...prev,
        fields: reorderedFields,
      }));
    }
  }, [formSchema.fields]);

  // Save the form template
  const handleSave = useCallback(async () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fix the form errors before saving',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return;
    }

    if (!formSchema.fields?.length) {
      notifications.show({
        title: 'No Fields',
        message: 'Please add at least one field before saving',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        ...formSchema,
        name: form.values.name,
        description: form.values.description,
        category: form.values.category,
        // Sort fields by order
        fields: (formSchema.fields || []).sort((a, b) => a.order - b.order),
      };

      await onSave(templateData);
      
      notifications.show({
        title: 'Form Saved',
        message: 'Form template saved successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: 'Save Error',
        message: 'Failed to save form template',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setSaving(false);
    }
  }, [form, formSchema, onSave]);

  // Get the currently selected field
  const currentField = selectedField 
    ? formSchema.fields?.find((field) => field.id === selectedField)
    : null;

  // Generate unique ID
  function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  return (
    <Container size="xl" py="md">
      <LoadingOverlay visible={loading} />
      
      {/* Header */}
      <Paper p="md" mb="md" withBorder>
        <Grid align="center">
          <Grid.Col span={8}>
            <Group>
              <IconForms size={24} />
              <div>
                <Title order={3}>Form Builder</Title>
                <Text size="sm" c="dimmed">
                  Create EPA compliance forms with drag-and-drop simplicity
                </Text>
              </div>
            </Group>
          </Grid.Col>
          <Grid.Col span={4}>
            <Group justify="flex-end">
              <Button
                variant="light"
                leftSection={<IconEye size={16} />}
                onClick={() => setShowPreview(true)}
                disabled={!formSchema.fields?.length}
              >
                Preview
              </Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSave}
                loading={saving}
              >
                Save Template
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Form Settings */}
      <Paper p="md" mb="md" withBorder>
        <Title order={4} mb="md">Form Settings</Title>
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Form Name"
              placeholder="Enter form name"
              required
              {...form.getInputProps('name')}
              onChange={(event) => {
                form.getInputProps('name').onChange(event);
                setFormSchema((prev) => ({ ...prev, name: event.currentTarget.value }));
              }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Category"
              data={[
                { value: 'EPA_SWPPP', label: 'EPA SWPPP' },
                { value: 'EPA_CGP', label: 'EPA CGP' },
                { value: 'OSHA_SAFETY', label: 'OSHA Safety' },
                { value: 'STATE_PERMIT', label: 'State Permit' },
                { value: 'CUSTOM', label: 'Custom' },
              ]}
              {...form.getInputProps('category')}
              onChange={(value) => {
                form.getInputProps('category').onChange(value);
                setFormSchema((prev) => ({ ...prev, category: value as any }));
              }}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Description"
              placeholder="Brief description of this form"
              rows={2}
              {...form.getInputProps('description')}
              onChange={(event) => {
                form.getInputProps('description').onChange(event);
                setFormSchema((prev) => ({ ...prev, description: event.currentTarget.value }));
              }}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Main Builder Interface */}
      <Grid gutter="md">
        {/* Field Palette */}
        <Grid.Col span={3}>
          <FieldPalette onAddField={handleAddField} />
        </Grid.Col>

        {/* Form Canvas */}
        <Grid.Col span={6}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <FormCanvas
              fields={formSchema.fields || []}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              onDeleteField={handleDeleteField}
              onDuplicateField={handleDuplicateField}
            />
          </DndContext>
        </Grid.Col>

        {/* Field Properties */}
        <Grid.Col span={3}>
          {currentField ? (
            <FieldProperties
              field={currentField}
              onUpdate={(updates) => handleUpdateField(currentField.id, updates)}
              onDelete={() => handleDeleteField(currentField.id)}
            />
          ) : (
            <Paper p="md" withBorder>
              <Stack align="center" py="xl">
                <IconSettings size={48} style={{ opacity: 0.5 }} />
                <Text c="dimmed" ta="center">
                  Select a field to configure its properties
                </Text>
              </Stack>
            </Paper>
          )}
        </Grid.Col>
      </Grid>

      {/* Preview Modal */}
      <Modal
        opened={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Form Preview: ${formSchema.name}`}
        size="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <FormPreview schema={formSchema} />
      </Modal>

      {/* Status Bar */}
      <Paper p="xs" mt="md" withBorder>
        <Group justify="space-between">
          <Group>
            <Text size="sm" c="dimmed">
              Fields: {formSchema.fields?.length || 0}
            </Text>
            {formSchema.category === 'EPA_SWPPP' && (
              <Badge color="blue" size="sm">
                EPA CGP Compliant
              </Badge>
            )}
          </Group>
          <Group>
            {onCancel && (
              <Button variant="subtle" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
    </Container>
  );
}