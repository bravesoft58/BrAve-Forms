// Shared TypeScript types for BrAve Forms platform
// EPA compliance and construction industry types

import { z } from 'zod';

// EPA Compliance Constants
export const EPA_RAIN_THRESHOLD_INCHES = 0.25;
export const EPA_INSPECTION_DEADLINE_HOURS = 24;

// Weather Event Schema
export const WeatherEventSchema = z.object({
  projectId: z.string().uuid(),
  precipitationInches: z.number().min(0),
  eventDate: z.date(),
  source: z.enum(['NOAA', 'OPENWEATHER', 'MANUAL']),
  inspectionDeadline: z.date(),
  requiresInspection: z.boolean()
});

export type WeatherEvent = z.infer<typeof WeatherEventSchema>;

// Inspection Form Schema (EPA SWPPP)
export const SwpppInspectionSchema = z.object({
  projectId: z.string().uuid(),
  inspectorId: z.string(),
  inspectionDate: z.date(),
  weatherTriggered: z.boolean(),
  precipitationInches: z.number().optional(),
  
  // BMP Status
  bmps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['SILT_FENCE', 'CHECK_DAM', 'INLET_PROTECTION', 'SEDIMENT_BASIN', 'OTHER']),
    installed: z.boolean(),
    functional: z.boolean(),
    maintenanceRequired: z.boolean(),
    notes: z.string().optional()
  })),
  
  // Discharge Points
  dischargePoints: z.array(z.object({
    id: z.string(),
    location: z.string(),
    hasDischarge: z.boolean(),
    turbidity: z.enum(['CLEAR', 'SLIGHTLY_TURBID', 'TURBID', 'VERY_TURBID']).optional(),
    controlMeasures: z.string().optional()
  })),
  
  // Violations
  violations: z.array(z.object({
    type: z.string(),
    location: z.string(),
    severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
    description: z.string(),
    correctiveAction: z.string(),
    photoIds: z.array(z.string())
  })),
  
  // Overall Status
  overallCompliant: z.boolean(),
  additionalNotes: z.string().optional(),
  signature: z.string(),
  signedAt: z.date()
});

export type SwpppInspection = z.infer<typeof SwpppInspectionSchema>;

// Photo Metadata Schema
export const PhotoMetadataSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  takenAt: z.date(),
  caption: z.string().optional(),
  s3Key: z.string().optional(),
  localPath: z.string().optional()
});

export type PhotoMetadata = z.infer<typeof PhotoMetadataSchema>;

// Organization Schema (Clerk Integration)
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  clerkOrgId: z.string(),
  name: z.string(),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  maxProjects: z.number(),
  maxUsers: z.number(),
  features: z.array(z.string())
});

export type Organization = z.infer<typeof OrganizationSchema>;

// User Role Schema
export const UserRoleSchema = z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'INSPECTOR']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Project Schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1).max(255),
  address: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  permitNumber: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  disturbedAcres: z.number().min(0),
  status: z.enum(['PLANNING', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CLOSED']),
  swpppConfig: z.record(z.any()).optional(),
  bmps: z.array(z.record(z.any()))
});

export type Project = z.infer<typeof ProjectSchema>;

// Offline Sync Schema
export const OfflineSyncSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  entity: z.enum(['INSPECTION', 'PHOTO', 'PROJECT', 'BMP']),
  data: z.record(z.any()),
  createdAt: z.date(),
  deviceId: z.string(),
  userId: z.string(),
  synced: z.boolean().default(false),
  syncedAt: z.date().optional(),
  conflictResolution: z.enum(['CLIENT_WINS', 'SERVER_WINS', 'MERGE']).optional()
});

export type OfflineSync = z.infer<typeof OfflineSyncSchema>;

// Inspector Access Token (QR Code)
export const InspectorAccessTokenSchema = z.object({
  projectId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  permissions: z.array(z.enum(['VIEW_INSPECTIONS', 'VIEW_PHOTOS', 'VIEW_BMPS', 'VIEW_VIOLATIONS'])),
  createdBy: z.string(),
  createdAt: z.date()
});

export type InspectorAccessToken = z.infer<typeof InspectorAccessTokenSchema>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Compliance Validation Types
export interface ComplianceValidation {
  isCompliant: boolean;
  violations: string[];
  warnings: string[];
  recommendations: string[];
}

// Form Builder Types
export const FieldTypes = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  TIME: 'time',
  SELECT: 'select',
  MULTI_SELECT: 'multiSelect',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  TEXTAREA: 'textarea',
  PHOTO: 'photo',
  SIGNATURE: 'signature',
  GPS_LOCATION: 'gpsLocation',
  WEATHER: 'weather',
  INSPECTOR: 'inspector',
  BMP_CHECKLIST: 'bmpChecklist',
  MEASUREMENT: 'measurement',
  SWPPP_TRIGGER: 'swpppTrigger',
  VIOLATION_CODE: 'violationCode',
  CORRECTIVE_ACTION: 'correctiveAction',
  REPEATER: 'repeater',
  TABLE: 'table',
  CALCULATION: 'calculation',
  FILE_UPLOAD: 'fileUpload',
} as const;

export type FieldType = typeof FieldTypes[keyof typeof FieldTypes];

// Field Validation Schema
export const FieldValidationSchema = z.object({
  required: z.boolean().default(false),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  step: z.number().optional(),
  customValidation: z.string().optional(), // JavaScript function string
});

export type FieldValidation = z.infer<typeof FieldValidationSchema>;

// Conditional Logic Schema
export const ConditionalRuleSchema = z.object({
  id: z.string().uuid(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
    value: z.any(),
  })),
  operator: z.enum(['AND', 'OR']).default('AND'),
  actions: z.array(z.object({
    type: z.enum(['show', 'hide', 'enable', 'disable', 'require', 'set_value', 'trigger_calculation']),
    target: z.string(),
    value: z.any().optional(),
  })),
});

export type ConditionalRule = z.infer<typeof ConditionalRuleSchema>;

// Field Definition Schema
export const FieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'text', 'number', 'date', 'time', 'select', 'multiSelect', 'radio', 'checkbox',
    'textarea', 'photo', 'signature', 'gpsLocation', 'weather', 'inspector',
    'bmpChecklist', 'measurement', 'swpppTrigger', 'violationCode',
    'correctiveAction', 'repeater', 'table', 'calculation', 'fileUpload'
  ]),
  label: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.any(),
  })).optional(),
  validation: FieldValidationSchema.optional(),
  conditional: ConditionalRuleSchema.optional(),
  metadata: z.object({
    gpsRequired: z.boolean().optional(),
    photoQuality: z.enum(['high', 'medium', 'low']).optional(),
    signatureCertificate: z.boolean().optional(),
    weatherSource: z.enum(['noaa', 'openweather']).optional(),
    units: z.string().optional(), // For measurement fields
    calculation: z.string().optional(), // JavaScript expression
    epaCompliance: z.object({
      regulation: z.string(),
      section: z.string(),
      criticalField: z.boolean().default(false),
    }).optional(),
  }).optional(),
  order: z.number().default(0),
  width: z.enum(['full', 'half', 'third', 'quarter']).default('full'),
});

export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;

// Form Template Schema
export const FormTemplateSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['EPA_SWPPP', 'EPA_CGP', 'OSHA_SAFETY', 'STATE_PERMIT', 'CUSTOM']),
  version: z.number().min(1).default(1),
  isActive: z.boolean().default(true),
  fields: z.array(FieldDefinitionSchema),
  logic: z.array(ConditionalRuleSchema),
  calculations: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    formula: z.string(), // JavaScript expression
    targetField: z.string(),
    dependencies: z.array(z.string()),
  })),
  compliance: z.object({
    regulation: z.string(),
    deadline: z.string(),
    authority: z.string(),
    retention: z.object({
      years: z.number(),
      archival: z.boolean(),
    }),
    criticalThresholds: z.array(z.object({
      field: z.string(),
      value: z.any(),
      message: z.string(),
    })),
  }).optional(),
  workflow: z.object({
    stages: z.array(z.string()),
    approvalRequired: z.boolean().default(false),
    notifications: z.array(z.object({
      trigger: z.string(),
      recipients: z.array(z.string()),
      template: z.string(),
    })),
  }).optional(),
  styling: z.object({
    theme: z.enum(['construction', 'minimal', 'branded']).default('construction'),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
    }).optional(),
    layout: z.enum(['single-column', 'two-column', 'adaptive']).default('single-column'),
    mobileOptimized: z.boolean().default(true),
  }).optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FormTemplate = z.infer<typeof FormTemplateSchema>;

// Form Submission Schema
export const FormSubmissionSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  templateId: z.string().uuid(),
  templateVersion: z.number(),
  inspectionId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  submittedBy: z.string(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED']),
  data: z.record(z.any()), // Field name -> value pairs
  metadata: z.object({
    formId: z.string().uuid(),
    formVersion: z.number(),
    submittedAt: z.date(),
    submittedBy: z.string(),
    gpsLocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number(),
    }).optional(),
    offline: z.boolean().default(false),
    deviceInfo: z.object({
      userAgent: z.string(),
      platform: z.string(),
      version: z.string(),
    }).optional(),
    completionTime: z.number().optional(), // Milliseconds
    validationErrors: z.array(z.object({
      field: z.string(),
      message: z.string(),
    })),
    complianceChecks: z.array(z.object({
      rule: z.string(),
      passed: z.boolean(),
      message: z.string().optional(),
    })),
  }),
  offlineCreated: z.boolean().default(false),
  submittedAt: z.date().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  reviewNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FormSubmission = z.infer<typeof FormSubmissionSchema>;

// EPA Compliance Validation Functions
export const validateEpaThreshold = (value: number, threshold: number = EPA_RAIN_THRESHOLD_INCHES): boolean => {
  return value >= threshold;
};

export const calculateInspectionDeadline = (eventDate: Date, workingHours: boolean = true): Date => {
  const deadline = new Date(eventDate);
  if (workingHours) {
    // Add 24 working hours (3 business days)
    let daysToAdd = 0;
    let hoursToAdd = EPA_INSPECTION_DEADLINE_HOURS;
    
    while (hoursToAdd > 0) {
      deadline.setDate(deadline.getDate() + 1);
      const dayOfWeek = deadline.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        hoursToAdd -= 8; // 8-hour work day
      }
    }
  } else {
    deadline.setHours(deadline.getHours() + EPA_INSPECTION_DEADLINE_HOURS);
  }
  
  return deadline;
};

// Utility function to generate UUIDs (simplified for templates)
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Form Builder Preset Templates
export const EPA_SWPPP_INSPECTION_TEMPLATE: Partial<FormTemplate> = {
  name: 'EPA SWPPP Inspection Form',
  description: 'EPA 2022 CGP compliant stormwater inspection form',
  category: 'EPA_SWPPP',
  compliance: {
    regulation: 'EPA 2022 CGP Section 4.2',
    deadline: '24 hours after 0.25 inch precipitation during working hours',
    authority: 'Environmental Protection Agency',
    retention: {
      years: 7,
      archival: true,
    },
    criticalThresholds: [
      {
        field: 'rainfallAmount',
        value: 0.25,
        message: 'Inspection required at exactly 0.25 inches precipitation',
      },
    ],
  },
  fields: [
    {
      id: generateId(),
      type: 'text',
      name: 'projectName',
      label: 'Project Name',
      validation: { required: true },
      order: 1,
      width: 'full',
    },
    {
      id: generateId(),
      type: 'date',
      name: 'inspectionDate',
      label: 'Inspection Date',
      validation: { 
        required: true,
        maxDate: 'today',
      },
      order: 2,
      width: 'half',
    },
    {
      id: generateId(),
      type: 'number',
      name: 'rainfallAmount',
      label: 'Rainfall Amount (inches)',
      description: 'Inspection required at 0.25 inches',
      validation: {
        required: true,
        min: 0,
        max: 10,
        step: 0.01,
      },
      metadata: {
        epaCompliance: {
          regulation: 'EPA CGP 2022',
          section: '4.2',
          criticalField: true,
        },
      },
      order: 3,
      width: 'half',
    },
    {
      id: generateId(),
      type: 'bmpChecklist',
      name: 'bmpsInstalled',
      label: 'BMPs Installed and Functional',
      validation: { required: true },
      order: 4,
      width: 'full',
    },
    {
      id: generateId(),
      type: 'photo',
      name: 'sitePhotos',
      label: 'Site Condition Photos',
      validation: { required: true },
      metadata: {
        gpsRequired: true,
        photoQuality: 'high',
      },
      order: 5,
      width: 'full',
    },
    {
      id: generateId(),
      type: 'signature',
      name: 'inspectorSignature',
      label: 'Inspector Signature',
      validation: { required: true },
      metadata: {
        signatureCertificate: true,
      },
      order: 6,
      width: 'full',
    },
  ],
};

// Export all schemas for validation
export const schemas = {
  WeatherEventSchema,
  SwpppInspectionSchema,
  PhotoMetadataSchema,
  OrganizationSchema,
  UserRoleSchema,
  ProjectSchema,
  OfflineSyncSchema,
  InspectorAccessTokenSchema,
  FieldValidationSchema,
  ConditionalRuleSchema,
  FieldDefinitionSchema,
  FormTemplateSchema,
  FormSubmissionSchema,
};