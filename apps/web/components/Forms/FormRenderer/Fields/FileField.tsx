import React, { useState } from 'react';
import { FieldError } from 'react-hook-form';
import { FileInput } from '@mantine/core';
import { FieldWrapper } from './FieldWrapper';
import { FormField } from '../types';

interface FileFieldProps {
  field: FormField;
  error?: FieldError;
  disabled?: boolean;
  onChange?: (file: File | null) => void;
}

export function FileField({ field, error, disabled, onChange }: FileFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleChange = (file: File | null) => {
    setSelectedFile(file);
    onChange?.(file);
  };

  return (
    <FieldWrapper
      id={field.id}
      label={field.label}
      required={field.required}
      helpText="Sprint 4: Will add file upload to S3"
    >
      <FileInput
        id={field.id}
        placeholder="Select file"
        value={selectedFile}
        onChange={handleChange}
        disabled={disabled}
        error={error?.message}
      />
    </FieldWrapper>
  );
}

