'use client';

import React from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  ActionIcon,
  Button,
  Badge,
  Box,
  Card,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconGripVertical,
  IconTrash,
  IconCopy,
  IconSettings,
  IconEye,
  IconAlertTriangle,
  IconShieldCheck,
  IconMapPin,
  IconCamera,
  IconSignature,
  IconForms,
} from '@tabler/icons-react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FieldDefinition } from '@brave-forms/types';

interface FormCanvasProps {
  fields: FieldDefinition[];
  selectedField: string | null;
  onSelectField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
}

interface SortableFieldProps {
  field: FieldDefinition;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableField({ field, isSelected, onSelect, onDelete, onDuplicate }: SortableFieldProps) {
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

  // Get field type information
  const getFieldTypeInfo = (type: string) => {
    const typeMap: Record<string, { icon: any; color: string; label: string }> = {
      text: { icon: IconForms, color: 'blue', label: 'Text' },
      textarea: { icon: IconForms, color: 'blue', label: 'Text Area' },
      number: { icon: IconForms, color: 'green', label: 'Number' },
      date: { icon: IconForms, color: 'purple', label: 'Date' },
      time: { icon: IconForms, color: 'purple', label: 'Time' },
      select: { icon: IconForms, color: 'indigo', label: 'Dropdown' },
      multiSelect: { icon: IconForms, color: 'indigo', label: 'Multi-Select' },
      radio: { icon: IconForms, color: 'teal', label: 'Radio' },
      checkbox: { icon: IconForms, color: 'teal', label: 'Checkbox' },
      photo: { icon: IconCamera, color: 'orange', label: 'Photo' },
      signature: { icon: IconSignature, color: 'red', label: 'Signature' },
      gpsLocation: { icon: IconMapPin, color: 'cyan', label: 'GPS Location' },
      weather: { icon: IconForms, color: 'blue', label: 'Weather' },
      swpppTrigger: { icon: IconAlertTriangle, color: 'yellow', label: 'SWPPP Trigger' },
      bmpChecklist: { icon: IconShieldCheck, color: 'green', label: 'BMP Checklist' },
      violationCode: { icon: IconShieldCheck, color: 'red', label: 'Violation Code' },
      correctiveAction: { icon: IconForms, color: 'orange', label: 'Corrective Action' },
      inspector: { icon: IconForms, color: 'grape', label: 'Inspector' },
      measurement: { icon: IconForms, color: 'lime', label: 'Measurement' },
      repeater: { icon: IconForms, color: 'dark', label: 'Repeater' },
      table: { icon: IconForms, color: 'dark', label: 'Table' },
      calculation: { icon: IconForms, color: 'violet', label: 'Calculation' },
      fileUpload: { icon: IconForms, color: 'indigo', label: 'File Upload' },
    };
    
    return typeMap[type] || { icon: IconForms, color: 'gray', label: type };
  };

  const typeInfo = getFieldTypeInfo(field.type);
  const Icon = typeInfo.icon;

  // Check if field has EPA compliance requirements
  const isEpaCompliant = field.metadata?.epaCompliance?.criticalField;
  const hasGpsRequirement = field.metadata?.gpsRequired;
  const isRequired = field.validation?.required;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      p="md"
      withBorder
      shadow={isSelected ? 'md' : 'sm'}
      bg={isSelected ? 'blue.0' : 'white'}
      onClick={onSelect}
      className={`cursor-pointer transition-all hover:shadow-md ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <Group justify="space-between" wrap="nowrap">
        {/* Drag Handle */}
        <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <ActionIcon
            {...listeners}
            variant="subtle"
            size="lg"
            color="gray"
            style={{ cursor: 'grab' }}
          >
            <IconGripVertical size={16} />
          </ActionIcon>

          {/* Field Info */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" mb="xs">
              <Icon size={18} color={`var(--mantine-color-${typeInfo.color}-6)`} />
              <Text size="sm" fw={500} style={{ color: `var(--mantine-color-${typeInfo.color}-7)` }}>
                {typeInfo.label}
              </Text>
              
              {/* Badges */}
              {isRequired && (
                <Badge size="xs" color="red" variant="light">
                  Required
                </Badge>
              )}
              {isEpaCompliant && (
                <Badge size="xs" color="blue" variant="light">
                  EPA Critical
                </Badge>
              )}
              {hasGpsRequirement && (
                <Badge size="xs" color="cyan" variant="light">
                  GPS
                </Badge>
              )}
            </Group>
            
            <Text size="sm" fw={600} truncate>
              {field.label}
            </Text>
            
            {field.description && (
              <Text size="xs" c="dimmed" truncate>
                {field.description}
              </Text>
            )}
            
            <Group gap="xs" mt="xs">
              <Text size="xs" c="dimmed">
                Name: {field.name}
              </Text>
              <Text size="xs" c="dimmed">
                Width: {field.width}
              </Text>
            </Group>
          </Box>
        </Group>

        {/* Actions */}
        <Group gap="xs">
          <Tooltip label="Duplicate field">
            <ActionIcon
              variant="subtle"
              size="sm"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <IconCopy size={14} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Delete field">
            <ActionIcon
              variant="subtle"
              size="sm"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Field settings">
            <ActionIcon
              variant="filled"
              size="sm"
              color={isSelected ? 'blue' : 'gray'}
            >
              <IconSettings size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      
      {/* EPA Compliance Warning */}
      {isEpaCompliant && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color="yellow"
          size="xs"
          mt="xs"
        >
          <Text size="xs">
            Critical EPA field - modifications may affect compliance
          </Text>
        </Alert>
      )}
    </Card>
  );
}

export function FormCanvas({ fields, selectedField, onSelectField, onDeleteField, onDuplicateField }: FormCanvasProps) {
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  
  if (fields.length === 0) {
    return (
      <Paper withBorder p="xl" style={{ textAlign: 'center', minHeight: '400px' }}>
        <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
          <IconForms size={64} style={{ opacity: 0.3 }} />
          <Text size="lg" fw={500} c="dimmed">
            No fields added yet
          </Text>
          <Text size="sm" c="dimmed" maw={300}>
            Start building your form by selecting field types from the palette on the left.
            For EPA compliance, use the SWPPP template.
          </Text>
          <Button variant="light" leftSection={<IconEye size={16} />} disabled>
            Preview will appear here
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder style={{ minHeight: '400px' }}>
      <Box p="md">
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={500}>
            Form Builder Canvas
          </Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </Text>
            <Badge size="xs" variant="light">
              Drag to reorder
            </Badge>
          </Group>
        </Group>

        <SortableContext
          items={sortedFields.map(field => field.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack gap="sm">
            {sortedFields.map((field) => (
              <SortableField
                key={field.id}
                field={field}
                isSelected={selectedField === field.id}
                onSelect={() => onSelectField(field.id)}
                onDelete={() => onDeleteField(field.id)}
                onDuplicate={() => onDuplicateField(field.id)}
              />
            ))}
          </Stack>
        </SortableContext>

        {/* Add Field Hint */}
        <Box mt="md" p="md" style={{ 
          border: '2px dashed var(--mantine-color-gray-3)', 
          borderRadius: 'var(--mantine-radius-md)',
          textAlign: 'center'
        }}>
          <Text size="sm" c="dimmed">
            Add more fields from the palette or drag to reorder
          </Text>
        </Box>
      </Box>
    </Paper>
  );
}