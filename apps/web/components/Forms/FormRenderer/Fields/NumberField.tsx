import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { NumberInput } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface NumberFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function NumberField({ field, register, error, disabled }: NumberFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
    >
      <NumberInput
        id={field.id}
        placeholder={field.placeholder}
        min={field.validation?.min}
        max={field.validation?.max}
        step={field.validation?.step || 1}
        {...register(field.id, { valueAsNumber: true })}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}

