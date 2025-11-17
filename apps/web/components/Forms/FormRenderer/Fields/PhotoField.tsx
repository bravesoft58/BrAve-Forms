import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { FileInput, Text } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface PhotoFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function PhotoField({ field, register, error, disabled }: PhotoFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
      helpText="Sprint 4: Will use Capacitor Camera with GPS EXIF"
    >
      <FileInput
        id={field.id}
        accept="image/*"
        placeholder="Select photo"
        {...register(field.id)}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}

