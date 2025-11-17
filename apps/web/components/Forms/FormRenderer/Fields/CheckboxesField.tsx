import React from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { Checkbox, Stack, Text } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface CheckboxesFieldProps {
  field: FormField;
  control: Control<any>;
  error?: FieldError;
  disabled?: boolean;
}

export function CheckboxesField({ field, control, error, disabled }: CheckboxesFieldProps) {
  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
    >
      <Controller
        name={field.id}
        control={control}
        defaultValue={[]}
        render={({ field: formField }) => (
          <>
            <Stack gap="xs">
              {field.options?.map((option) => (
                <Checkbox
                  key={option.value}
                  checked={(formField.value || []).includes(option.value)}
                  label={option.label}
                  onChange={(e) => {
                    const currentValue = formField.value || [];
                    if (e.currentTarget.checked) {
                      formField.onChange([...currentValue, option.value]);
                    } else {
                      formField.onChange(currentValue.filter((v: string) => v !== option.value));
                    }
                  }}
                  disabled={disabled}
                />
              ))}
            </Stack>
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

