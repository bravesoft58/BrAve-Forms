import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { FileInput, Text } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface FileFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function FileField({ field, register, error, disabled }: FileFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
      helpText="Sprint 4: Will add file upload to S3"
    >
      <FileInput
        id={field.id}
        placeholder="Select file"
        {...register(field.id)}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}

