import React, { useEffect } from 'react';
import { FieldError, UseFormSetValue } from 'react-hook-form';
import { TextInput } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface ComputedFieldProps {
  field: FormField;
  error?: FieldError;
  computedValue?: any;
  setValue?: UseFormSetValue<any>;
}

export function ComputedField({ field, error: _error, computedValue, setValue }: ComputedFieldProps) {
  // Update form value when computed value changes
  useEffect(() => {
    if (setValue && computedValue !== undefined) {
      setValue(field.id, computedValue, { shouldValidate: false });
    }
  }, [computedValue, field.id, setValue]);

  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={false}
      helpText={`Formula: ${field.computedValue || 'N/A'}`}
    >
      <TextInput
        id={field.id}
        value={computedValue !== undefined ? String(computedValue) : ''}
        disabled={true}
        readOnly
        styles={{
          input: {
            backgroundColor: '#f3f4f6',
            fontFamily: 'monospace',
          },
        }}
      />
    </FieldWrapper>
  );
}

