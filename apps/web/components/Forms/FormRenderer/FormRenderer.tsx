'use client';

import React, { useState } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stack, Text, Button, Paper } from '@mantine/core';
import { FormRendererProps, FormSubmissionData, FormTemplate, FormField } from './types';
import { evaluateConditionalLogic } from './useConditionalLogic';
import { evaluateComputedField } from './useComputedFields';
import { useFormDraft } from '@/lib/hooks/useFormDraft';
import {
  TextField,
  TextareaField,
  NumberField,
  DateField,
  TimeField,
  SelectField,
  RadioField,
  CheckboxField,
  CheckboxesField,
  PhotoField,
  SignatureField,
  GpsField,
  RepeaterField,
  FileField,
  ComputedField,
} from './Fields';

/**
 * FormRenderer Component
 *
 * Renders dynamic forms from JSON schema
 * Uses React Hook Form for state management
 * Supports validation, conditional logic, computed fields
 */
export function FormRenderer({
  template,
  onSubmit,
  initialValues = {},
  readOnly = false,
}: FormRendererProps) {
  // Generate Zod schema from template
  const validationSchema = generateValidationSchema(template);

  // Initialize React Hook Form
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  // Watch all form values for conditional logic and computed fields
  const formValues = watch();

  // Draft status state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save draft functionality
  const { saveDraft, loadDraft, clearDraft } = useFormDraft(
    template.id,
    formValues,
    (draftValues) => {
      // Load draft into form
      reset(draftValues);
      console.log('Draft loaded into form');
    }
  );

  // Save draft with status update wrapper
  const saveDraftWithStatus = React.useCallback(async () => {
    await saveDraft();
    setLastSaved(new Date());
  }, [saveDraft]);

  // Auto-save every 30 seconds with status update
  React.useEffect(() => {
    const interval = setInterval(() => {
      saveDraftWithStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [saveDraftWithStatus]);

  // TODO: Get userName from auth context (Sprint 4)
  const userName = 'Current User';

  // Handle form submission
  const onSubmitForm = async (data: Record<string, any>) => {
    const submission: FormSubmissionData = {
      templateId: template.id,
      values: data,
      submittedAt: new Date().toISOString(),
      submittedBy: 'current-user-id', // TODO: Get from auth context
    };

    // Clear draft on successful submission
    await clearDraft();
    setLastSaved(null);

    onSubmit(submission);
  };

  // Manual save button handler
  const handleManualSave = async () => {
    await saveDraftWithStatus();
  };

  return (
    <Paper p="md" component="form" onSubmit={handleSubmit(onSubmitForm)} maw={800} mx="auto">
      {/* Form Header */}
      <Stack gap="xs" mb="md">
        <Text size="24px" fw={600}>
          {template.title}
        </Text>
        {template.description && (
          <Text size="14px" c="dimmed">
            {template.description}
          </Text>
        )}
        {lastSaved && !readOnly && (
          <Text size="12px" c="dimmed">
            Draft saved at {lastSaved.toLocaleTimeString()}
          </Text>
        )}
      </Stack>

      {/* Form Fields */}
      <Stack gap="md">
        {template.fields.map((field) => {
          // Evaluate conditional logic
          const isVisible = evaluateConditionalLogic(field, formValues);

          if (!isVisible) {
            return null;
          }

          // Compute value for computed fields
          const computedValue =
            field.type === 'computed' ? evaluateComputedField(field, formValues, userName) : undefined;

          const error = errors[field.id] as FieldError | undefined;

          switch (field.type) {
            case 'text':
              return (
                <TextField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'textarea':
              return (
                <TextareaField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'number':
              return (
                <NumberField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'date':
              return (
                <DateField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'time':
              return (
                <TimeField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'select':
              return (
                <SelectField
                  key={field.id}
                  field={field}
                  control={control}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'radio':
              return (
                <RadioField
                  key={field.id}
                  field={field}
                  control={control}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'checkbox':
              return (
                <CheckboxField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'checkboxes':
              return (
                <CheckboxesField
                  key={field.id}
                  field={field}
                  control={control}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'photo':
              return (
                <PhotoField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'signature':
              return (
                <SignatureField
                  key={field.id}
                  field={field}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'gps':
              return (
                <GpsField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'repeater':
              return (
                <RepeaterField
                  key={field.id}
                  field={field}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'file':
              return (
                <FileField
                  key={field.id}
                  field={field}
                  register={register}
                  error={error}
                  disabled={readOnly}
                />
              );
            case 'computed':
              return (
                <ComputedField
                  key={field.id}
                  field={field}
                  error={error}
                  computedValue={computedValue}
                  setValue={setValue}
                />
              );
            default:
              return (
                <div key={field.id}>
                  <Text size="sm" c="dimmed">
                    Unsupported field type: {field.type}
                  </Text>
                </div>
              );
          }
        })}
      </Stack>

      {/* Form Actions */}
      {!readOnly && (
        <Stack gap="md" mt="md">
          <Button type="button" variant="outline" onClick={handleManualSave}>
            Save Draft
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

/**
 * Generate Zod validation schema from FormTemplate
 *
 * Supports:
 * - Required fields
 * - String validation (minLength, maxLength, pattern)
 * - Number validation (min, max)
 * - Email validation
 * - Custom error messages
 */
export function generateValidationSchema(template: FormTemplate) {
  const shape: Record<string, z.ZodTypeAny> = {};

  template.fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = generateStringSchema(field);
        break;

      case 'number':
        fieldSchema = generateNumberSchema(field);
        break;

      case 'date':
        fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
        } else {
          fieldSchema = fieldSchema.optional();
        }
        break;

      case 'time':
        fieldSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)');
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
        } else {
          fieldSchema = fieldSchema.optional();
        }
        break;

      case 'select':
      case 'radio':
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
        } else {
          fieldSchema = fieldSchema.optional();
        }
        break;

      case 'checkbox':
        fieldSchema = z.boolean().optional();
        if (field.required) {
          fieldSchema = z.boolean().refine((val) => val === true, {
            message: `${field.label} must be checked`,
          });
        }
        break;

      case 'checkboxes':
        fieldSchema = z.array(z.string()).optional();
        if (field.required) {
          fieldSchema = z.array(z.string()).min(1, `At least one ${field.label} is required`);
        }
        break;

      case 'photo':
      case 'file':
        if (field.required) {
          fieldSchema = z.string().url('Invalid file URL').min(1, `${field.label} is required`);
        } else {
          fieldSchema = z.string().url('Invalid file URL').optional();
        }
        break;

      case 'signature':
        if (field.required) {
          fieldSchema = z.string().min(1, `${field.label} is required`);
        } else {
          fieldSchema = z.string().optional();
        }
        break;

      case 'gps':
        if (field.required) {
          fieldSchema = z
            .string()
            .regex(/^-?\d+\.\d+,\s*-?\d+\.\d+$/, 'Invalid GPS format (lat, lng)')
            .min(1, `${field.label} is required`);
        } else {
          fieldSchema = z
            .string()
            .regex(/^-?\d+\.\d+,\s*-?\d+\.\d+$/, 'Invalid GPS format (lat, lng)')
            .optional();
        }
        break;

      case 'computed':
        // Computed fields don't need validation (auto-generated)
        fieldSchema = z.any().optional();
        break;

      case 'repeater':
        // Repeater validation handled in Sprint 4
        fieldSchema = z.any().optional();
        break;

      default:
        fieldSchema = z.any().optional();
    }

    shape[field.id] = fieldSchema;
  });

  return z.object(shape);
}

/**
 * Generate string field validation schema
 */
function generateStringSchema(field: FormField): z.ZodString {
  let schema = z.string();

  // Required validation
  if (field.required) {
    schema = schema.min(1, `${field.label} is required`);
  } else {
    schema = schema.optional() as any;
  }

  // Min length validation
  if (field.validation?.minLength) {
    schema = schema.min(
      field.validation.minLength,
      field.validation.customMessage || `Minimum ${field.validation.minLength} characters required`
    );
  }

  // Max length validation
  if (field.validation?.maxLength) {
    schema = schema.max(
      field.validation.maxLength,
      field.validation.customMessage || `Maximum ${field.validation.maxLength} characters allowed`
    );
  }

  // Pattern validation (regex)
  if (field.validation?.pattern) {
    schema = schema.regex(
      new RegExp(field.validation.pattern),
      field.validation.customMessage || 'Invalid format'
    );
  }

  return schema;
}

/**
 * Generate number field validation schema
 */
function generateNumberSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny = z.number({
    invalid_type_error: `${field.label} must be a number`,
  });

  // Min value validation (apply before optional)
  if (field.validation?.min !== undefined) {
    schema = (schema as z.ZodNumber).min(
      field.validation.min,
      field.validation.customMessage || `Minimum value is ${field.validation.min}`
    );
  }

  // Max value validation (apply before optional)
  if (field.validation?.max !== undefined) {
    schema = (schema as z.ZodNumber).max(
      field.validation.max,
      field.validation.customMessage || `Maximum value is ${field.validation.max}`
    );
  }

  // Required validation
  if (field.required) {
    // Number fields can't use .min(1) for required - use refine
    schema = (schema as z.ZodNumber).refine((val) => val !== undefined && val !== null, {
      message: `${field.label} is required`,
    });
  } else {
    schema = schema.optional();
  }

  return schema;
}

