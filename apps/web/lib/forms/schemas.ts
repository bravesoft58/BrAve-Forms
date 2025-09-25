import { z } from 'zod';

// Common validation patterns
const requiredString = z.string().min(1, 'This field is required');
const optionalString = z.string().optional();
const positiveNumber = z.number().min(0, 'Must be a positive number');
const percentage = z.number().min(0).max(100, 'Must be between 0 and 100');

// GPS coordinates schema
export const gpsCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude'),
  accuracy: z.number().optional(),
  timestamp: z.date().optional(),
});

// Photo upload schema
export const photoUploadSchema = z.object({
  id: z.string().uuid().optional(),
  file: z.instanceof(File, { message: 'Valid file required' }),
  caption: optionalString,
  gpsCoordinates: gpsCoordinatesSchema.optional(),
  timestamp: z.date().default(() => new Date()),
  category: z.enum([
    'before',
    'after', 
    'violation',
    'maintenance',
    'general',
    'weather_conditions',
    'bmp_installation',
    'corrective_action'
  ]).optional(),
});

// Storm water inspection schema (EPA CGP compliant)
export const stormWaterInspectionSchema = z.object({
  // Basic information
  projectId: z.string().uuid('Valid project ID required'),
  inspectionDate: z.date(),
  inspectionTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid time required (HH:MM)'),
  inspectorName: requiredString,
  inspectorTitle: requiredString,
  
  // Weather conditions (critical for EPA compliance)
  weatherConditions: z.enum([
    'clear',
    'partly_cloudy',
    'overcast',
    'light_rain',
    'heavy_rain',
    'snow',
    'fog',
    'windy'
  ]),
  temperature: z.number().int().min(-50).max(150, 'Temperature must be between -50°F and 150°F'),
  
  // Rainfall data (EPA CGP requirement - EXACT 0.25" trigger)
  rainfall24Hours: z.number()
    .min(0, 'Rainfall cannot be negative')
    .max(20, 'Rainfall seems unusually high - please verify')
    .refine((val) => Number.isFinite(val), 'Must be a valid number'),
  rainfallTriggerTime: z.date().optional(),
  
  // BMP (Best Management Practices) status
  bmpsInstalled: z.array(z.string()).min(1, 'At least one BMP must be documented'),
  bmpsNeedingMaintenance: z.array(z.string()).default([]),
  bmpEffectiveness: z.enum(['excellent', 'good', 'fair', 'poor']),
  
  // Discharge observations
  dischargeObserved: z.boolean(),
  dischargeColor: z.enum(['clear', 'slightly_cloudy', 'cloudy', 'colored', 'foamy', 'oily']).optional(),
  dischargeSediment: z.boolean().optional(),
  dischargeDebris: z.boolean().optional(),
  
  // Violations and corrective actions
  violationsObserved: z.boolean(),
  violationDescriptions: z.array(z.string()).default([]),
  correctiveActions: z.array(z.string()).default([]),
  correctiveActionDeadline: z.date().optional(),
  
  // Photos (minimum required for compliance)
  photos: z.array(photoUploadSchema)
    .min(1, 'At least one photo is required for compliance')
    .max(20, 'Maximum 20 photos per inspection'),
  
  // Inspector certification
  inspectorSignature: requiredString,
  certificationStatement: z.boolean().refine(val => val === true, {
    message: 'Inspector must certify the accuracy of this inspection'
  }),
  
  // Next inspection requirements
  nextInspectionRequired: z.date().optional(),
  
  // Additional notes
  notes: optionalString,
  
  // Offline/sync metadata
  offlineId: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    timestamp: z.date().optional(),
  }).optional(),
}).refine((data) => {
  // EPA CGP Rule: If rainfall >= 0.25", rainfallTriggerTime must be provided
  if (data.rainfall24Hours >= 0.25 && !data.rainfallTriggerTime) {
    return false;
  }
  return true;
}, {
  message: 'Rainfall trigger time must be specified when rainfall >= 0.25 inches',
  path: ['rainfallTriggerTime'],
}).refine((data) => {
  // If violations observed, descriptions must be provided
  if (data.violationsObserved && data.violationDescriptions.length === 0) {
    return false;
  }
  return true;
}, {
  message: 'Violation descriptions are required when violations are observed',
  path: ['violationDescriptions'],
}).refine((data) => {
  // If corrective actions needed, deadline should be set
  if (data.correctiveActions.length > 0 && !data.correctiveActionDeadline) {
    return false;
  }
  return true;
}, {
  message: 'Corrective action deadline is required when corrective actions are specified',
  path: ['correctiveActionDeadline'],
});

// Weekly inspection schema (less stringent than storm water)
export const weeklyInspectionSchema = z.object({
  projectId: z.string().uuid(),
  inspectionDate: z.date(),
  inspectionTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  inspectorName: requiredString,
  inspectorTitle: requiredString,
  
  // General site conditions
  siteConditions: z.enum(['excellent', 'good', 'fair', 'poor']),
  weatherConditions: z.enum([
    'clear', 'partly_cloudy', 'overcast', 'light_rain', 'heavy_rain', 'snow', 'fog', 'windy'
  ]),
  
  // Areas inspected
  areasInspected: z.array(z.string()).min(1, 'At least one area must be inspected'),
  
  // Issues found
  issuesFound: z.boolean(),
  issueDescriptions: z.array(z.string()).default([]),
  correctiveActions: z.array(z.string()).default([]),
  
  // Photos
  photos: z.array(photoUploadSchema).default([]),
  
  // Notes and signature
  notes: optionalString,
  inspectorSignature: requiredString,
  
  // Next inspection
  nextInspectionDate: z.date().optional(),
});

// Project creation schema
export const projectSchema = z.object({
  name: requiredString.min(2, 'Project name must be at least 2 characters'),
  description: optionalString,
  address: requiredString,
  city: requiredString,
  state: z.string().length(2, 'State must be 2 characters (e.g., CA)').toUpperCase(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  
  // Permit information
  permitNumber: requiredString,
  permitType: z.enum(['npdes', 'cgp', 'local', 'other']),
  permitIssuedDate: z.date(),
  permitExpirationDate: z.date(),
  
  // Project timeline
  projectStartDate: z.date(),
  projectEndDate: z.date().optional(),
  
  // GPS coordinates
  coordinates: gpsCoordinatesSchema,
  
  // Contractor information
  contractorName: requiredString,
  contractorContact: z.string().email('Valid email required'),
  contractorPhone: z.string().regex(/^\+?[\d\s\-\(\)\.]{10,}$/, 'Valid phone number required'),
  
  // Inspection schedule
  inspectionFrequency: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),
  
  // BMP requirements
  requiredBmps: z.array(z.string()).min(1, 'At least one BMP must be specified'),
  
  // Additional settings
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Project end date must be after start date
  if (data.projectEndDate && data.projectStartDate >= data.projectEndDate) {
    return false;
  }
  return true;
}, {
  message: 'Project end date must be after start date',
  path: ['projectEndDate'],
}).refine((data) => {
  // Permit expiration must be after issue date
  if (data.permitIssuedDate >= data.permitExpirationDate) {
    return false;
  }
  return true;
}, {
  message: 'Permit expiration date must be after issue date',
  path: ['permitExpirationDate'],
});

// User profile schema
export const userProfileSchema = z.object({
  firstName: requiredString.min(1, 'First name is required'),
  lastName: requiredString.min(1, 'Last name is required'),
  email: z.string().email('Valid email address required'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)\.]{10,}$/, 'Valid phone number required').optional(),
  
  // Professional information
  title: requiredString,
  certifications: z.array(z.string()).default([]),
  licenseNumber: optionalString,
  
  // Preferences
  timezone: z.string().default(Intl.DateTimeFormat().resolvedOptions().timeZone),
  language: z.string().default('en-US'),
  
  // Notification preferences
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  weatherAlerts: z.boolean().default(true),
  complianceAlerts: z.boolean().default(true),
});

// Settings schema
export const settingsSchema = z.object({
  // Sync settings
  autoSync: z.boolean().default(true),
  syncInterval: z.number().int().min(1).max(60).default(5), // minutes
  offlineRetentionDays: z.number().int().min(7).max(365).default(30),
  
  // UI preferences
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  language: z.string().default('en-US'),
  
  // Notification settings
  enableNotifications: z.boolean().default(true),
  weatherAlerts: z.boolean().default(true),
  complianceAlerts: z.boolean().default(true),
  deadlineReminders: z.boolean().default(true),
  
  // Data usage settings
  highQualityPhotos: z.boolean().default(true),
  autoUploadPhotos: z.boolean().default(false),
  compressPhotos: z.boolean().default(true),
  
  // Location settings
  enableGPS: z.boolean().default(true),
  gpsAccuracy: z.enum(['high', 'medium', 'low']).default('high'),
});

// Form validation helper types
export type StormWaterInspectionFormData = z.infer<typeof stormWaterInspectionSchema>;
export type WeeklyInspectionFormData = z.infer<typeof weeklyInspectionSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
export type PhotoUploadFormData = z.infer<typeof photoUploadSchema>;
export type GPSCoordinates = z.infer<typeof gpsCoordinatesSchema>;

// Form validation utilities
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Convert Zod errors to field-level errors
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
};

// EPA compliance validation utilities
export const validateEPACompliance = {
  // Check if rainfall meets EPA CGP 0.25" trigger
  isRainfallTrigger: (rainfall: number): boolean => {
    return rainfall >= 0.25; // EXACT 0.25" per EPA CGP
  },
  
  // Calculate inspection deadline (24 hours from rainfall during working hours)
  getInspectionDeadline: (rainfallTime: Date): Date => {
    const deadline = new Date(rainfallTime);
    deadline.setHours(deadline.getHours() + 24);
    return deadline;
  },
  
  // Check if inspection is within compliance window
  isWithinComplianceWindow: (rainfallTime: Date, inspectionTime: Date): boolean => {
    const deadline = validateEPACompliance.getInspectionDeadline(rainfallTime);
    return inspectionTime <= deadline;
  },
  
  // Validate required inspection elements for EPA CGP
  validateInspectionCompleteness: (inspection: Partial<StormWaterInspectionFormData>): {
    isComplete: boolean;
    missingElements: string[];
  } => {
    const required = [
      'inspectorSignature',
      'certificationStatement',
      'bmpsInstalled',
      'photos',
      'weatherConditions',
    ];
    
    const missingElements: string[] = [];
    
    required.forEach((field) => {
      if (!inspection[field as keyof StormWaterInspectionFormData]) {
        missingElements.push(field);
      }
    });
    
    // Special validation for photos (minimum 1 required)
    if (inspection.photos && inspection.photos.length === 0) {
      missingElements.push('photos (minimum 1 required)');
    }
    
    // Special validation for certification
    if (!inspection.certificationStatement) {
      missingElements.push('inspector certification');
    }
    
    return {
      isComplete: missingElements.length === 0,
      missingElements,
    };
  },
};