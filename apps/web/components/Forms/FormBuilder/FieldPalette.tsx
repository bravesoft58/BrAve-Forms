'use client';

import React from 'react';
import {
  Paper,
  Title,
  Stack,
  Button,
  Text,
  Group,
  Divider,
  Tooltip,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  IconTextCaption,
  IconHash,
  IconCalendar,
  IconClock,
  IconChevronDown,
  IconList,
  IconCircleCheck,
  IconSquareCheck,
  IconNotes,
  IconCamera,
  IconSignature,
  IconMapPin,
  IconCloudRain,
  IconUser,
  IconShieldCheck,
  IconRuler,
  IconClipboardList,
  IconTable,
  IconCalculator,
  IconFileUpload,
  IconAlertTriangle,
  IconRefresh,
} from '@tabler/icons-react';

interface FieldPaletteProps {
  onAddField: (fieldType: string) => void;
}

// Field type definitions with metadata for construction forms
const fieldCategories = [
  {
    name: 'Basic Fields',
    fields: [
      {
        type: 'text',
        label: 'Text Input',
        icon: IconTextCaption,
        description: 'Single line text input for names, addresses, etc.',
        color: 'blue',
      },
      {
        type: 'textarea',
        label: 'Text Area',
        icon: IconNotes,
        description: 'Multi-line text for notes and descriptions',
        color: 'blue',
      },
      {
        type: 'number',
        label: 'Number',
        icon: IconHash,
        description: 'Numeric input with validation',
        color: 'green',
      },
      {
        type: 'date',
        label: 'Date',
        icon: IconCalendar,
        description: 'Date picker with construction-friendly interface',
        color: 'purple',
      },
      {
        type: 'time',
        label: 'Time',
        icon: IconClock,
        description: 'Time selection for precise logging',
        color: 'purple',
      },
    ],
  },
  {
    name: 'Selection Fields',
    fields: [
      {
        type: 'select',
        label: 'Dropdown',
        icon: IconChevronDown,
        description: 'Single selection from dropdown list',
        color: 'indigo',
      },
      {
        type: 'multiSelect',
        label: 'Multi-Select',
        icon: IconList,
        description: 'Multiple selections from dropdown',
        color: 'indigo',
      },
      {
        type: 'radio',
        label: 'Radio Buttons',
        icon: IconCircleCheck,
        description: 'Single choice from visible options',
        color: 'teal',
      },
      {
        type: 'checkbox',
        label: 'Checkboxes',
        icon: IconSquareCheck,
        description: 'Multiple selections with checkboxes',
        color: 'teal',
      },
    ],
  },
  {
    name: 'Construction-Specific',
    fields: [
      {
        type: 'photo',
        label: 'Photo Capture',
        icon: IconCamera,
        description: 'Camera integration with GPS EXIF data',
        color: 'orange',
        badge: 'GPS',
      },
      {
        type: 'signature',
        label: 'Digital Signature',
        icon: IconSignature,
        description: 'Legally binding signatures with certificates',
        color: 'red',
        badge: 'Legal',
      },
      {
        type: 'gpsLocation',
        label: 'GPS Location',
        icon: IconMapPin,
        description: 'Capture current location coordinates',
        color: 'cyan',
        badge: 'GPS',
      },
      {
        type: 'measurement',
        label: 'Measurement',
        icon: IconRuler,
        description: 'Distance, area, volume with unit conversion',
        color: 'lime',
      },
      {
        type: 'inspector',
        label: 'Inspector Select',
        icon: IconUser,
        description: 'Select certified inspector with credentials',
        color: 'grape',
      },
    ],
  },
  {
    name: 'EPA Compliance',
    fields: [
      {
        type: 'weather',
        label: 'Weather Data',
        icon: IconCloudRain,
        description: 'Auto-populated weather from NOAA/OpenWeather',
        color: 'blue',
        badge: 'EPA',
      },
      {
        type: 'swpppTrigger',
        label: 'SWPPP Trigger',
        icon: IconAlertTriangle,
        description: '0.25" rain threshold monitoring (EPA CGP)',
        color: 'yellow',
        badge: 'Critical',
      },
      {
        type: 'bmpChecklist',
        label: 'BMP Checklist',
        icon: IconClipboardList,
        description: 'Best Management Practices checklist',
        color: 'green',
        badge: 'EPA',
      },
      {
        type: 'violationCode',
        label: 'Violation Code',
        icon: IconShieldCheck,
        description: 'EPA/OSHA violation code selection',
        color: 'red',
        badge: 'Compliance',
      },
      {
        type: 'correctiveAction',
        label: 'Corrective Action',
        icon: IconRefresh,
        description: 'Track remediation steps and deadlines',
        color: 'orange',
        badge: 'Action',
      },
    ],
  },
  {
    name: 'Advanced',
    fields: [
      {
        type: 'repeater',
        label: 'Repeater',
        icon: IconList,
        description: 'Dynamic list of repeated field groups',
        color: 'dark',
      },
      {
        type: 'table',
        label: 'Table',
        icon: IconTable,
        description: 'Tabular data entry with rows and columns',
        color: 'dark',
      },
      {
        type: 'calculation',
        label: 'Calculated Field',
        icon: IconCalculator,
        description: 'Auto-calculate based on other field values',
        color: 'violet',
      },
      {
        type: 'fileUpload',
        label: 'File Upload',
        icon: IconFileUpload,
        description: 'Upload documents, reports, and attachments',
        color: 'indigo',
      },
    ],
  },
];

interface DraggableFieldButtonProps {
  fieldType: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  description: string;
  badge?: string;
  onAddField: (fieldType: string) => void;
}

function DraggableFieldButton({
  fieldType,
  label,
  icon: Icon,
  color,
  description,
  badge,
  onAddField,
}: DraggableFieldButtonProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${fieldType}`,
    data: {
      fieldType,
      source: 'palette',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <Tooltip label={description} position="right" withArrow>
      <Button
        ref={setNodeRef}
        style={{
          ...style,
          height: '48px', // Construction glove-friendly touch target
          fontSize: '14px',
        }}
        variant="light"
        color={color}
        justify="space-between"
        leftSection={<Icon size={18} />}
        rightSection={
          badge ? (
            <Badge size="xs" color={color} variant="dot">
              {badge}
            </Badge>
          ) : null
        }
        onClick={() => onAddField(fieldType)}
        {...listeners}
        {...attributes}
        fullWidth
      >
        <Text size="sm" style={{ textAlign: 'left', flex: 1 }}>
          {label}
        </Text>
      </Button>
    </Tooltip>
  );
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <Paper withBorder h="100%" style={{ minHeight: '600px' }}>
      <ScrollArea style={{ height: '100%' }}>
        <Stack gap="md" p="md">
          <Group>
            <Title order={4}>Field Library</Title>
            <Text size="xs" c="dimmed">
              Drag or click to add
            </Text>
          </Group>

          {fieldCategories.map((category) => (
            <div key={category.name}>
              <Text size="sm" fw={600} c="dimmed" mb="xs">
                {category.name}
              </Text>

              <Stack gap="xs" mb="md">
                {category.fields.map((field) => (
                  <DraggableFieldButton
                    key={field.type}
                    fieldType={field.type}
                    label={field.label}
                    icon={field.icon}
                    color={field.color}
                    description={field.description}
                    badge={field.badge}
                    onAddField={onAddField}
                  />
                ))}
              </Stack>

              {category !== fieldCategories[fieldCategories.length - 1] && <Divider my="sm" />}
            </div>
          ))}

          {/* Quick EPA Template */}
          <Divider />
          <div>
            <Text size="sm" fw={600} c="dimmed" mb="xs">
              Quick Templates
            </Text>
            <Button
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              leftSection={<IconShieldCheck size={18} />}
              onClick={() => {
                // Add EPA SWPPP preset fields
                ['text', 'date', 'number', 'photo', 'bmpChecklist', 'signature'].forEach(
                  (type, index) => {
                    setTimeout(() => onAddField(type), index * 100);
                  }
                );
              }}
              fullWidth
              size="md"
            >
              EPA SWPPP Template
            </Button>
          </div>

          {/* Tips */}
          <Paper p="sm" bg="gray.0" radius="sm">
            <Text size="xs" c="dimmed">
              <strong>Tip:</strong> EPA forms require GPS-enabled photos and exact 0.25 inch
              rainfall thresholds. Use compliance fields to ensure regulatory accuracy.
            </Text>
          </Paper>
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
