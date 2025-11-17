import React from 'react';
import { Text, Stack } from '@mantine/core';

interface FieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  helpText?: string;
  description?: string;
}

/**
 * FieldWrapper Component
 *
 * Consistent wrapper for all field types
 * Handles label, required indicator, help text
 * Note: Error display is handled by individual field components
 */
export function FieldWrapper({
  id,
  label,
  required,
  children,
  helpText,
  description,
}: FieldWrapperProps) {
  return (
    <Stack gap="xs">
      <Text component="label" htmlFor={id} size="14px" fw={500}>
        {label}
        {required && <Text component="span" c="red" ml={4}>*</Text>}
      </Text>
      {description && (
        <Text size="12px" c="dimmed">
          {description}
        </Text>
      )}
      {helpText && (
        <Text size="12px" c="dimmed">
          {helpText}
        </Text>
      )}
      {children}
    </Stack>
  );
}

