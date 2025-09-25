import React from 'react';
import { Card, Title, Text, Button, Stack } from '@mantine/core';
import { IconTextSize, IconNumber, IconCalendar, IconToggleLeft } from '@tabler/icons-react';

interface TouchFieldPaletteProps {
  onAddField: (fieldType: string) => void;
  onTabChange?: (tab: string) => void;
  compact?: boolean;
}

export function TouchFieldPalette({ onAddField, onTabChange, compact }: TouchFieldPaletteProps) {
  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: IconTextSize },
    { type: 'number', label: 'Number', icon: IconNumber },
    { type: 'date', label: 'Date', icon: IconCalendar },
    { type: 'checkbox', label: 'Checkbox', icon: IconToggleLeft },
  ];

  return (
    <Card shadow="sm" p="md">
      <Title order={4} mb="md">Add Fields</Title>
      <Stack gap="xs">
        {fieldTypes.map((field) => (
          <Button
            key={field.type}
            leftSection={<field.icon size={20} />}
            variant="light"
            fullWidth
            size="md"
            onClick={() => {
              onAddField(field.type);
              onTabChange?.('builder');
            }}
          >
            {field.label}
          </Button>
        ))}
      </Stack>
    </Card>
  );
}