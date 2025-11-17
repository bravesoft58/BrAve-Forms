import React from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { Radio, Text } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface RadioFieldProps {
  field: FormField;
  control: Control<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function RadioField({ field, control, error, disabled }: RadioFieldProps) {
  const radioData = field.options?.map((option) => ({
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
          <>
            <Radio.Group {...formField}>
              {radioData.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={disabled}
                  mt="xs"
                />
              ))}
            </Radio.Group>
            {error && (
              <Text size="xs" c="red" mt={4}>
                {error.message}
              </Text>
            )}
          </>
        )}
      />
    </FieldWrapper>
  );
}

