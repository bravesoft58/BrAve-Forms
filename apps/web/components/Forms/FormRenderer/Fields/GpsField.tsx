import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { TextInput, Text } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface GpsFieldProps {
  field: FormField;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function GpsField({ field, register, error, disabled }: GpsFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
      helpText="Sprint 4: Will auto-capture GPS using Capacitor Geolocation"
    >
      <TextInput
        id={field.id}
        placeholder="Lat, Lng (auto-captured)"
        {...register(field.id)}
        disabled={true}
        error={error?.message}
      />
    </FieldWrapper>
  );
}

