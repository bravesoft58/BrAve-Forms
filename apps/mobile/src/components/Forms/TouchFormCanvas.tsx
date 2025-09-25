import React from 'react';
import { Card, Title, Text, Stack, Group, ActionIcon, Badge } from '@mantine/core';
import { IconEdit, IconTrash, IconGripVertical } from '@tabler/icons-react';

interface FieldDefinition {
  id: string;
  type: string;
  label: string;
  name: string;
}

interface TouchFormCanvasProps {
  fields: FieldDefinition[];
  selectedFieldId?: string | null;
  onSelectField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<FieldDefinition>) => void;
}

export function TouchFormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onUpdateField,
}: TouchFormCanvasProps) {
  if (fields.length === 0) {
    return (
      <Card shadow="sm" p="xl" ta="center">
        <Text c="dimmed" size="lg" mb="xs">
          No fields yet
        </Text>
        <Text c="dimmed" size="sm">
          Add fields from the palette to start building your form
        </Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="md">
      <Title order={4} mb="md">Form Fields</Title>
      <Stack gap="md">
        {fields.map((field) => (
          <Card
            key={field.id}
            shadow="xs"
            p="md"
            style={{
              cursor: 'pointer',
              border: selectedFieldId === field.id ? '3px solid #0ea5e9' : '1px solid #e9ecef',
            }}
            onClick={() => onSelectField(field.id)}
          >
            <Group justify="space-between">
              <Group gap="md">
                <ActionIcon variant="subtle" color="gray">
                  <IconGripVertical size={16} />
                </ActionIcon>
                <div>
                  <Group gap="xs" mb="xs">
                    <Text fw={600}>{field.label}</Text>
                    <Badge size="sm" variant="light">
                      {field.type}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{field.name}</Text>
                </div>
              </Group>
              
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectField(field.id);
                  }}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteField(field.id);
                  }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    </Card>
  );
}