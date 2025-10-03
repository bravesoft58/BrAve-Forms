import { z } from 'zod';

// Field validation schema
const fieldValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  step: z.number().optional(),
  maxDate: z.string().optional(),
  minDate: z.string().optional(),
});

// Field metadata schema
const fieldMetadataSchema = z.object({
  epaCompliance: z.object({
    regulation: z.string(),
    section: z.string().optional(),
    criticalField: z.boolean().optional(),
    threshold: z.number().optional(),
  }).optional(),
  gpsRequired: z.boolean().optional(),
  photoQuality: z.enum(['low', 'medium', 'high']).optional(),
  signatureCertificate: z.boolean().optional(),
}).optional();

// Field definition schema
const fieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'number',
    'date',
    'photo',
    'signature',
    'checkbox',
    'select',
    'bmpChecklist',
    'textarea',
  ]),
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  description: z.string().optional(),
  validation: fieldValidationSchema.optional(),
  metadata: fieldMetadataSchema.optional(),
  order: z.number().int().min(0),
  width: z.enum(['full', 'half', 'third', 'quarter']).optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});

// Form template schema validation
export const formTemplateSchemaValidator = z.object({
  fields: z.array(fieldSchema).min(1).max(100),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    fields: z.array(z.string()),
  })).optional(),
  conditionalLogic: z.array(z.object({
    fieldId: z.string(),
    condition: z.string(),
    action: z.enum(['show', 'hide', 'require', 'unrequire']),
    targetFields: z.array(z.string()),
  })).optional(),
});

// Compliance schema validation
export const complianceSchemaValidator = z.object({
  regulation: z.string().min(1),
  section: z.string().optional(),
  deadline: z.string().optional(),
  authority: z.string().optional(),
  retention: z.object({
    years: z.number().int().min(1).max(50),
    archival: z.boolean().optional(),
  }).optional(),
  criticalThresholds: z.array(z.object({
    field: z.string(),
    value: z.number(),
    message: z.string(),
  })).optional(),
});

// Full create template input validation
export const createFormTemplateValidator = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.enum(['EPA_SWPPP', 'EPA_CGP', 'OSHA_SAFETY', 'STATE_PERMIT', 'CUSTOM']),
  schema: formTemplateSchemaValidator,
  compliance: complianceSchemaValidator.optional(),
});

// Update template input validation
export const updateFormTemplateValidator = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  schema: formTemplateSchemaValidator.optional(),
  compliance: complianceSchemaValidator.optional(),
  isActive: z.boolean().optional(),
});

// Export types
export type FormTemplateSchema = z.infer<typeof formTemplateSchemaValidator>;
export type ComplianceSchema = z.infer<typeof complianceSchemaValidator>;
export type CreateFormTemplateInput = z.infer<typeof createFormTemplateValidator>;
export type UpdateFormTemplateInput = z.infer<typeof updateFormTemplateValidator>;
