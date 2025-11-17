import React from 'react';
import { FieldError } from 'react-hook-form';
import { Paper, Text } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface SignatureFieldProps {
  field: FormField;
  error?: FieldError;
  disabled?: boolean;
}

export function SignatureField({ field, error, disabled }: SignatureFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
      helpText="Sprint 4: Signature canvas will be implemented using react-signature-canvas"
    >
      <Paper
        p="xl"
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          textAlign: 'center',
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          minHeight: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size="sm" c="dimmed">
          Signature canvas placeholder
        </Text>
      </Paper>
    </FieldWrapper>
  );
}

