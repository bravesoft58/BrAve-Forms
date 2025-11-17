import React from 'react';
import { FieldError } from 'react-hook-form';
import { Paper, Text } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface RepeaterFieldProps {
  field: FormField;
  error?: FieldError;
  disabled?: boolean;
}

export function RepeaterField({ field, error, disabled }: RepeaterFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
      helpText="Sprint 4: Repeater field (add/remove rows) will use useFieldArray from React Hook Form"
    >
      <Paper
        p="md"
        style={{
          border: '1px dashed #d1d5db',
          borderRadius: '6px',
          textAlign: 'center',
          backgroundColor: disabled ? '#f3f4f6' : 'white',
        }}
      >
        <Text size="sm" c="dimmed">
          Repeater field placeholder
        </Text>
      </Paper>
    </FieldWrapper>
  );
}

