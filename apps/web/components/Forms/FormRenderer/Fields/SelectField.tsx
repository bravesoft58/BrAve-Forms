import React from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { Select } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface SelectFieldProps {
  field: FormField;
  control: Control<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function SelectField({ field, control, error, disabled }: SelectFieldProps) {
  const selectData = field.options?.map((option) => ({
    value: option.value,
    label: option.label,
  })) || [];

  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
    >
      <Controller
        name={field.id}
        control={control}
        render={({ field: formField }) => (
          <Select
            id={field.id}
            placeholder="Select an option"
            data={selectData}
            {...formField}
            disabled={disabled}
            error={error?.message}
          />
        )}
      />
    </FieldWrapper>
  );
}

