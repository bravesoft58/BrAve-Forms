'use client';

import React from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import { FormBuilder } from '@/components/Forms/FormBuilder';
import type { FormTemplate } from '@brave-forms/types';

export default function FormBuilderPage() {
  const handleSave = async (template: Partial<FormTemplate>) => {
    // TODO: Implement GraphQL mutation to save form template
    console.log('Saving form template:', template);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just log the template
    console.log('Form template saved successfully:', template);
  };

  const handleCancel = () => {
    // Navigate back or close
    window.history.back();
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md" mb="xl">
        <Title order={1}>Form Builder</Title>
        <Text size="lg" c="dimmed">
          Create EPA compliance forms with our drag-and-drop interface. 
          Build forms for SWPPP inspections, safety reports, and regulatory compliance.
        </Text>
      </Stack>
      
      <FormBuilder
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Container>
  );
}