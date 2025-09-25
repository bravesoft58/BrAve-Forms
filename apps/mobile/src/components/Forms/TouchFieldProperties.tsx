import React, { useState } from 'react';
import { Card, Title, TextInput, Button, Stack, Group } from '@mantine/core';

interface FieldDefinition {
  id: string;
  type: string;
  label: string;
  name: string;
}

interface TouchFieldPropertiesProps {
  field: FieldDefinition;
  onUpdate: (updates: Partial<FieldDefinition>) => void;
  onDelete: () => void;
  onClose?: () => void;
}

export function TouchFieldProperties({ field, onUpdate, onDelete, onClose }: TouchFieldPropertiesProps) {
  const [label, setLabel] = useState(field.label);
  const [name, setName] = useState(field.name);

  const handleSave = () => {
    onUpdate({ label, name });
    onClose?.();
  };

  return (
    <Card shadow="sm" p="md">
      <Title order={4} mb="md">Field Properties</Title>
      <Stack gap="md">
        <TextInput
          label="Field Label"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
        />
        <TextInput
          label="Field Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Group>
          <Button onClick={handleSave} flex={1}>Save</Button>
          <Button color="red" variant="light" onClick={onDelete} flex={1}>Delete</Button>
        </Group>
      </Stack>
    </Card>
  );
}