import React, { useState, useEffect } from 'react';
import { FieldError } from 'react-hook-form';
import { NumberInput } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface NumberFieldProps {
  field: FormField;
  error?: FieldError;
  disabled?: boolean;
  value?: number;
  onChange?: (value: number | string) => void;
}

export function NumberField({ field, error, disabled, value: initialValue, onChange }: NumberFieldProps) {
  const [value, setValue] = useState<number | string>(initialValue ?? '');

  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = (newValue: number | string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
    >
      <NumberInput
        id={field.id}
        placeholder={field.placeholder}
        min={field.validation?.min as number | undefined}
        max={field.validation?.max as number | undefined}
        step={(field.validation?.step as number | undefined) ?? 1}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}
