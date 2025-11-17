import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { Textarea } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface TextareaFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function TextareaField({ field, register, error, disabled }: TextareaFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
    >
      <Textarea
        id={field.id}
        placeholder={field.placeholder}
        minRows={3}
        {...register(field.id)}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}

