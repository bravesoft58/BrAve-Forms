import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { TextInput } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface TextFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
  /** HTML input type - defaults to 'text', supports 'tel' and 'email' */
  inputType?: 'text' | 'tel' | 'email';
}

export function TextField({
  field,
  register,
  error,
  disabled,
  inputType = 'text',
}: TextFieldProps) {
  return (
    <FieldWrapper id={field.id} label={field.label} required={field.required}>
      <TextInput
        id={field.id}
        type={inputType}
        placeholder={field.placeholder}
        {...register(field.id)}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}
