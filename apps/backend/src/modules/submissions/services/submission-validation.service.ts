import { Injectable } from '@nestjs/common';
import { FormSubmissionStatus, VALID_STATUS_TRANSITIONS } from '@brave-forms/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldDefinition {
  id: string;
  label: string;
  type: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

@Injectable()
export class SubmissionValidationService {
  validateRequiredFields(data: Record<string, unknown>, template: FormTemplate): ValidationResult {
    const errors: string[] = [];
    const fields = template.fields as FieldDefinition[];

    fields.forEach((field) => {
      if (field.required && !data[field.id]) {
        errors.push(`Required field '${field.label}' is missing`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  validateStatusTransition(
    currentStatus: FormSubmissionStatus,
    newStatus: FormSubmissionStatus
  ): boolean {
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    return validTransitions?.includes(newStatus) || false;
  }

  validateFieldTypes(data: Record<string, unknown>, template: FormTemplate): ValidationResult {
    const errors: string[] = [];
    const fields = template.fields as FieldDefinition[];

    fields.forEach((field) => {
      const value = data[field.id];
      if (value === undefined) return;

      switch (field.type) {
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Field '${field.label}' must be a number`);
          }
          if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
            errors.push(`Field '${field.label}' must be at least ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
            errors.push(`Field '${field.label}' must be at most ${field.validation.max}`);
          }
          break;

        case 'date':
          if (typeof value !== 'string' || !Date.parse(value)) {
            errors.push(`Field '${field.label}' must be a valid date`);
          }
          break;

        case 'text':
        case 'textarea':
          if (typeof value !== 'string') {
            errors.push(`Field '${field.label}' must be a string`);
          }
          break;

        case 'boolean':
        case 'checkbox':
          if (typeof value !== 'boolean') {
            errors.push(`Field '${field.label}' must be a boolean`);
          }
          break;

        case 'select':
        case 'radio':
          if (typeof value !== 'string') {
            errors.push(`Field '${field.label}' must be a string`);
          }
          break;

        case 'photo':
          if (typeof value !== 'string') {
            errors.push(`Field '${field.label}' must be a photo URL`);
          }
          break;

        default:
          break;
      }

      if (field.validation?.pattern && typeof value === 'string') {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors.push(`Field '${field.label}' does not match required pattern`);
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  validateRejectionNotes(rejectionNotes?: string): ValidationResult {
    const errors: string[] = [];

    if (!rejectionNotes || rejectionNotes.trim().length < 10) {
      errors.push('Rejection notes must be at least 10 characters');
    }

    return { isValid: errors.length === 0, errors };
  }
}
