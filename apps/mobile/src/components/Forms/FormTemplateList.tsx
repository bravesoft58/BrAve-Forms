import React from 'react';
import { Card, Title, Text, Button, Stack, Group, Badge } from '@mantine/core';
import { IconForms, IconPlus } from '@tabler/icons-react';

interface FormTemplate {
  id?: string;
  name?: string;
  description?: string;
  category?: string;
}

interface FormTemplateListProps {
  onEdit: (template: FormTemplate) => void;
  onCreateNew: () => void;
}

export function FormTemplateList({ onEdit, onCreateNew }: FormTemplateListProps) {
  const templates = [
    {
      id: '1',
      name: 'SWPPP Inspection Form',
      description: 'EPA stormwater inspection checklist',
      category: 'EPA_SWPPP'
    },
    {
      id: '2', 
      name: 'Daily Safety Checklist',
      description: 'OSHA construction safety verification',
      category: 'OSHA_SAFETY'
    }
  ];

  return (
    <Stack gap="md">
      {templates.map((template) => (
        <Card key={template.id} shadow="sm" p="md">
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <IconForms size={24} color="#0ea5e9" />
              <div>
                <Title order={4}>{template.name}</Title>
                <Text size="sm" c="dimmed">{template.description}</Text>
              </div>
            </Group>
            <Badge variant="light" color="blue">
              {template.category?.replace('_', ' ')}
            </Badge>
          </Group>
          
          <Group>
            <Button
              variant="light"
              onClick={() => onEdit(template)}
              flex={1}
            >
              Edit Form
            </Button>
          </Group>
        </Card>
      ))}
      
      <Card shadow="sm" p="xl" ta="center" style={{ border: '2px dashed #dee2e6' }}>
        <IconPlus size={48} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
        <Title order={4} mb="xs">Create New Form</Title>
        <Text c="dimmed" mb="lg">
          Start building a custom inspection form
        </Text>
        <Button leftSection={<IconPlus size={20} />} onClick={onCreateNew}>
          New Form Template
        </Button>
      </Card>
    </Stack>
  );
}