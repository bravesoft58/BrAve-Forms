import React from 'react';
import { Card, Title, Text, Button } from '@mantine/core';

interface FormTemplate {
  name?: string;
  description?: string;
  fields?: any[];
}

interface MobileFormPreviewProps {
  form: FormTemplate;
  onClose: () => void;
}

export function MobileFormPreview({ form, onClose }: MobileFormPreviewProps) {
  return (
    <div>
      <Title order={3} mb="md">{form.name}</Title>
      <Text mb="md" c="dimmed">{form.description}</Text>
      <Card shadow="sm" p="md">
        <Text>Form preview with {form.fields?.length || 0} fields</Text>
        <Button mt="md" onClick={onClose}>Close Preview</Button>
      </Card>
    </div>
  );
}