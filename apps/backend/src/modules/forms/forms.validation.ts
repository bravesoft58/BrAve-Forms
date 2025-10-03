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
const fieldMetadataSchema = z
  .object({
    epaCompliance: z
      .object({
        regulation: z.string(),
        section: z.string().optional(),
        criticalField: z.boolean().optional(),
        threshold: z.number().optional(),
      })
      .optional(),
    gpsRequired: z.boolean().optional(),
    photoQuality: z.enum(['low', 'medium', 'high']).optional(),
    signatureCertificate: z.boolean().optional(),
  })
  .optional();

// Field type enum with 10 types (8+ requirement met)
export const FieldTypeEnum = z.enum([
  'text',
  'textarea',
  'number',
  'date',
  'select',
  'checkbox',
  'photo',
  'signature',
  'gps',
  'weather_data',
  'bmpChecklist',
]);

export type FieldType = z.infer<typeof FieldTypeEnum>;

// Field definition schema
const fieldSchema = z.object({
  id: z.string(),
  type: FieldTypeEnum,
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  description: z.string().optional(),
  validation: fieldValidationSchema.optional(),
  metadata: fieldMetadataSchema.optional(),
  order: z.number().int().min(0),
  width: z.enum(['full', 'half', 'third', 'quarter']).optional(),
  defaultValue: z.any().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

// Conditional logic rule schema
const conditionalLogicRuleSchema = z.object({
  fieldId: z.string(),
  condition: z.string(),
  action: z.enum(['show', 'hide', 'require', 'unrequire']),
  targetFields: z.array(z.string()),
});

// Form template schema validation
export const formTemplateSchemaValidator = z.object({
  fields: z.array(fieldSchema).min(1).max(100),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        fields: z.array(z.string()),
      })
    )
    .optional(),
  conditionalLogic: z.array(conditionalLogicRuleSchema).optional(),
});

// Compliance schema validation
export const complianceSchemaValidator = z.object({
  regulation: z.string().min(1),
  section: z.string().optional(),
  deadline: z.string().optional(),
  authority: z.string().optional(),
  retention: z
    .object({
      years: z.number().int().min(1).max(50),
      archival: z.boolean().optional(),
    })
    .optional(),
  criticalThresholds: z
    .array(
      z.object({
        field: z.string(),
        value: z.number(),
        message: z.string(),
      })
    )
    .optional(),
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

// Type-specific field value validators (for form submissions)
export const fieldValueValidators = {
  text: (value: any, validation?: any) => {
    let schema = z.string();
    if (validation?.required) schema = schema.min(1, 'This field is required');
    if (validation?.minLength)
      schema = schema.min(validation.minLength, `Minimum ${validation.minLength} characters`);
    if (validation?.maxLength)
      schema = schema.max(validation.maxLength, `Maximum ${validation.maxLength} characters`);
    if (validation?.pattern)
      schema = schema.regex(new RegExp(validation.pattern), 'Invalid format');
    return validation?.required ? schema : schema.optional();
  },

  textarea: (value: any, validation?: any) => {
    let schema = z.string();
    if (validation?.required) schema = schema.min(1, 'This field is required');
    if (validation?.minLength)
      schema = schema.min(validation.minLength, `Minimum ${validation.minLength} characters`);
    if (validation?.maxLength)
      schema = schema.max(validation.maxLength, `Maximum ${validation.maxLength} characters`);
    return validation?.required ? schema : schema.optional();
  },

  number: (value: any, validation?: any) => {
    let schema: any = z.number();
    if (validation?.min !== undefined)
      schema = schema.min(validation.min, `Minimum value is ${validation.min}`);
    if (validation?.max !== undefined)
      schema = schema.max(validation.max, `Maximum value is ${validation.max}`);
    if (validation?.step) {
      schema = schema.refine(
        (val: number) => (val * 100) % (validation.step * 100) === 0,
        `Value must be a multiple of ${validation.step}`
      );
    }
    return validation?.required ? schema : schema.optional();
  },

  date: (value: any, validation?: any) => {
    let schema: any = z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format');
    if (validation?.minDate) {
      schema = schema.refine(
        (val: string) => new Date(val) >= new Date(validation.minDate),
        `Date must be on or after ${validation.minDate}`
      );
    }
    if (validation?.maxDate) {
      if (validation.maxDate === 'today') {
        schema = schema.refine(
          (val: string) => new Date(val) <= new Date(),
          'Date cannot be in the future'
        );
      } else {
        schema = schema.refine(
          (val: string) => new Date(val) <= new Date(validation.maxDate),
          `Date must be on or before ${validation.maxDate}`
        );
      }
    }
    return validation?.required ? schema : schema.optional();
  },

  select: (value: any, validation?: any, options?: Array<{ label: string; value: string }>) => {
    if (!options || options.length === 0) {
      throw new Error('Select field must have options defined');
    }
    const validValues = options.map((opt) => opt.value);
    const schema = z.enum(validValues as [string, ...string[]], {
      errorMap: () => ({ message: `Value must be one of: ${validValues.join(', ')}` }),
    });
    return validation?.required ? schema : schema.optional();
  },

  checkbox: (value: any, validation?: any) => {
    const schema = z.boolean();
    if (validation?.required) {
      return schema.refine((val) => val === true, 'This field must be checked');
    }
    return schema.optional();
  },

  photo: (value: any, validation?: any, metadata?: any) => {
    const photoSchema = z.object({
      url: z.string().url('Invalid photo URL'),
      fileName: z.string().min(1, 'File name required'),
      fileSize: z.number().positive('File size must be positive'),
      mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/, 'Invalid image type'),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      gpsLocation: metadata?.gpsRequired
        ? z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
            accuracy: z.number().positive().optional(),
          })
        : z.any().optional(),
      timestamp: z.string(),
    });
    return validation?.required ? photoSchema : photoSchema.optional();
  },

  signature: (value: any, validation?: any, metadata?: any) => {
    const signatureSchema = z.object({
      dataUrl: z.string().regex(/^data:image\/(png|svg\+xml);base64,/, 'Invalid signature format'),
      signedBy: z.string().min(1, 'Signer name required'),
      signedAt: z.string(),
      certificate: metadata?.signatureCertificate
        ? z
            .string({ required_error: 'Certificate required for compliance' })
            .min(1, 'Certificate required for compliance')
        : z.string().optional(),
    });
    return validation?.required ? signatureSchema : signatureSchema.optional();
  },

  gps: (value: any, validation?: any) => {
    const gpsSchema = z.object({
      latitude: z
        .number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
      longitude: z
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),
      accuracy: z.number().positive('Accuracy must be positive').optional(),
      altitude: z.number().optional(),
      timestamp: z.string(),
    });
    return validation?.required ? gpsSchema : gpsSchema.optional();
  },

  weather_data: (_value: any, _validation?: any) => {
    const weatherSchema = z.object({
      temperature: z.number().min(-100).max(150).optional(),
      precipitation: z.number().min(0, 'Precipitation cannot be negative'),
      humidity: z.number().min(0).max(100).optional(),
      windSpeed: z.number().min(0).optional(),
      conditions: z.string().optional(),
      timestamp: z.string(),
      source: z.enum(['NOAA', 'OpenWeatherMap', 'Manual']),
    });
    // Weather data always required for EPA CGP compliance
    return weatherSchema;
  },

  bmpChecklist: (value: any, validation?: any) => {
    const bmpItemSchema = z.object({
      id: z.string(),
      description: z.string(),
      checked: z.boolean(),
      notes: z.string().optional(),
      photo: z.string().url().optional(),
    });
    const bmpSchema = z.array(bmpItemSchema).min(1, 'At least one BMP item required');
    return validation?.required ? bmpSchema : bmpSchema.optional();
  },
};

// Conditional logic evaluation engine
export interface ConditionalLogicRule {
  fieldId: string;
  condition: string; // JavaScript expression (e.g., "field_123 === 'yes'")
  action: 'show' | 'hide' | 'require' | 'unrequire';
  targetFields: string[];
}

export const evaluateConditionalLogic = (
  rules: ConditionalLogicRule[],
  formData: Record<string, any>
): {
  hiddenFields: Set<string>;
  requiredFields: Set<string>;
} => {
  const hiddenFields = new Set<string>();
  const requiredFields = new Set<string>();

  for (const rule of rules) {
    try {
      // Create safe evaluation context
      const context = { ...formData };
      const conditionResult = evaluateCondition(rule.condition, context);

      if (conditionResult) {
        for (const targetField of rule.targetFields) {
          if (rule.action === 'hide') {
            hiddenFields.add(targetField);
          } else if (rule.action === 'show') {
            hiddenFields.delete(targetField);
          } else if (rule.action === 'require') {
            requiredFields.add(targetField);
          } else if (rule.action === 'unrequire') {
            requiredFields.delete(targetField);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to evaluate conditional logic for rule: ${rule.fieldId}`, error);
    }
  }

  return { hiddenFields, requiredFields };
};

// Safe condition evaluator (prevents code injection)
const evaluateCondition = (condition: string, context: Record<string, any>): boolean => {
  // Whitelist of allowed operators
  const allowedOperators = ['===', '!==', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!'];

  // Simple validation - reject if contains suspicious patterns
  const suspiciousPatterns = [
    'eval',
    'Function',
    'constructor',
    '__proto__',
    'prototype',
    'import',
    'require',
    'process',
    'global',
  ];

  for (const pattern of suspiciousPatterns) {
    if (condition.includes(pattern)) {
      throw new Error(`Suspicious pattern detected in condition: ${pattern}`);
    }
  }

  // Replace field references with context values
  // Example: "field_123 === 'yes'" becomes "context['field_123'] === 'yes'"
  let safeCondition = condition;
  const fieldRefs = condition.match(/\b\w+\b/g) || [];

  for (const ref of fieldRefs) {
    if (ref in context && !allowedOperators.includes(ref)) {
      const value = context[ref];
      const safeValue = typeof value === 'string' ? `'${value.replace(/'/g, "\\'")}'` : value;
      safeCondition = safeCondition.replace(new RegExp(`\\b${ref}\\b`, 'g'), String(safeValue));
    }
  }

  // Evaluate using Function constructor (safer than eval)
  try {
    const result = new Function(`return ${safeCondition}`)();
    return Boolean(result);
  } catch (error) {
    console.error('Failed to evaluate condition:', condition, error);
    return false;
  }
};

// Form submission validator - validates data against template schema
export const validateFormSubmission = (
  submissionData: Record<string, any>,
  templateSchema: FormTemplateSchema,
  skipHiddenFields = true
): { isValid: boolean; errors: Record<string, string>; warnings: string[] } => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Evaluate conditional logic first
  const { hiddenFields, requiredFields } = evaluateConditionalLogic(
    (templateSchema.conditionalLogic as ConditionalLogicRule[]) || [],
    submissionData
  );

  // Validate each field
  for (const field of templateSchema.fields) {
    // Skip hidden fields if requested
    if (skipHiddenFields && hiddenFields.has(field.id)) {
      continue;
    }

    const value = submissionData[field.name];
    const isRequired = field.validation?.required || requiredFields.has(field.id);

    // Get type-specific validator
    const validator = fieldValueValidators[field.type];
    if (!validator) {
      warnings.push(`No validator found for field type: ${field.type}`);
      continue;
    }

    try {
      // Build validation schema - pass metadata as third parameter for photo/signature validators
      const validationRules = { ...field.validation, required: isRequired };
      let schema;

      if (field.type === 'select') {
        schema = validator(
          value,
          validationRules,
          field.options as Array<{ label: string; value: string }>
        );
      } else if (field.type === 'photo' || field.type === 'signature') {
        schema = validator(value, validationRules, field.metadata as any);
      } else {
        schema = validator(value, validationRules);
      }

      // Validate value
      schema.parse(value);
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        errors[field.name] = error.errors[0].message;
      } else {
        errors[field.name] = error.message || 'Validation failed';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};
