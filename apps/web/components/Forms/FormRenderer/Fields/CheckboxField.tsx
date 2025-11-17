import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { Checkbox } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface CheckboxFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function CheckboxField({ field, register, error, disabled }: CheckboxFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
    >
      <Checkbox
        id={field.id}
        label={field.placeholder || 'Yes'}
        {...register(field.id)}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}

