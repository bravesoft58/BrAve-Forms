"use strict";
// Shared TypeScript types for BrAve Forms platform
// EPA compliance and construction industry types
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.EPA_SWPPP_INSPECTION_TEMPLATE = exports.calculateInspectionDeadline = exports.validateEpaThreshold = exports.FormSubmissionSchema = exports.FormTemplateSchema = exports.FieldDefinitionSchema = exports.ConditionalRuleSchema = exports.FieldValidationSchema = exports.FieldTypes = exports.InspectorAccessTokenSchema = exports.OfflineSyncSchema = exports.ProjectSchema = exports.UserRoleSchema = exports.OrganizationSchema = exports.PhotoMetadataSchema = exports.SwpppInspectionSchema = exports.WeatherEventSchema = exports.EPA_INSPECTION_DEADLINE_HOURS = exports.EPA_RAIN_THRESHOLD_INCHES = void 0;
const zod_1 = require("zod");
// EPA Compliance Constants
exports.EPA_RAIN_THRESHOLD_INCHES = 0.25;
exports.EPA_INSPECTION_DEADLINE_HOURS = 24;
// Weather Event Schema
exports.WeatherEventSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    precipitationInches: zod_1.z.number().min(0),
    eventDate: zod_1.z.date(),
    source: zod_1.z.enum(['NOAA', 'OPENWEATHER', 'MANUAL']),
    inspectionDeadline: zod_1.z.date(),
    requiresInspection: zod_1.z.boolean()
});
// Inspection Form Schema (EPA SWPPP)
exports.SwpppInspectionSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    inspectorId: zod_1.z.string(),
    inspectionDate: zod_1.z.date(),
    weatherTriggered: zod_1.z.boolean(),
    precipitationInches: zod_1.z.number().optional(),
    // BMP Status
    bmps: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        type: zod_1.z.enum(['SILT_FENCE', 'CHECK_DAM', 'INLET_PROTECTION', 'SEDIMENT_BASIN', 'OTHER']),
        installed: zod_1.z.boolean(),
        functional: zod_1.z.boolean(),
        maintenanceRequired: zod_1.z.boolean(),
        notes: zod_1.z.string().optional()
    })),
    // Discharge Points
    dischargePoints: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        location: zod_1.z.string(),
        hasDischarge: zod_1.z.boolean(),
        turbidity: zod_1.z.enum(['CLEAR', 'SLIGHTLY_TURBID', 'TURBID', 'VERY_TURBID']).optional(),
        controlMeasures: zod_1.z.string().optional()
    })),
    // Violations
    violations: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        location: zod_1.z.string(),
        severity: zod_1.z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
        description: zod_1.z.string(),
        correctiveAction: zod_1.z.string(),
        photoIds: zod_1.z.array(zod_1.z.string())
    })),
    // Overall Status
    overallCompliant: zod_1.z.boolean(),
    additionalNotes: zod_1.z.string().optional(),
    signature: zod_1.z.string(),
    signedAt: zod_1.z.date()
});
// Photo Metadata Schema
exports.PhotoMetadataSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    inspectionId: zod_1.z.string().uuid(),
    filename: zod_1.z.string(),
    mimeType: zod_1.z.string(),
    fileSize: zod_1.z.number(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    takenAt: zod_1.z.date(),
    caption: zod_1.z.string().optional(),
    s3Key: zod_1.z.string().optional(),
    localPath: zod_1.z.string().optional()
});
// Organization Schema (Clerk Integration)
exports.OrganizationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    clerkOrgId: zod_1.z.string(),
    name: zod_1.z.string(),
    plan: zod_1.z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
    maxProjects: zod_1.z.number(),
    maxUsers: zod_1.z.number(),
    features: zod_1.z.array(zod_1.z.string())
});
// User Role Schema
exports.UserRoleSchema = zod_1.z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'INSPECTOR']);
// Project Schema
exports.ProjectSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orgId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(255),
    address: zod_1.z.string(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    permitNumber: zod_1.z.string().optional(),
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date().optional(),
    disturbedAcres: zod_1.z.number().min(0),
    status: zod_1.z.enum(['PLANNING', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CLOSED']),
    swpppConfig: zod_1.z.record(zod_1.z.any()).optional(),
    bmps: zod_1.z.array(zod_1.z.record(zod_1.z.any()))
});
// Offline Sync Schema
exports.OfflineSyncSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['CREATE', 'UPDATE', 'DELETE']),
    entity: zod_1.z.enum(['INSPECTION', 'PHOTO', 'PROJECT', 'BMP']),
    data: zod_1.z.record(zod_1.z.any()),
    createdAt: zod_1.z.date(),
    deviceId: zod_1.z.string(),
    userId: zod_1.z.string(),
    synced: zod_1.z.boolean().default(false),
    syncedAt: zod_1.z.date().optional(),
    conflictResolution: zod_1.z.enum(['CLIENT_WINS', 'SERVER_WINS', 'MERGE']).optional()
});
// Inspector Access Token (QR Code)
exports.InspectorAccessTokenSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    token: zod_1.z.string(),
    expiresAt: zod_1.z.date(),
    permissions: zod_1.z.array(zod_1.z.enum(['VIEW_INSPECTIONS', 'VIEW_PHOTOS', 'VIEW_BMPS', 'VIEW_VIOLATIONS'])),
    createdBy: zod_1.z.string(),
    createdAt: zod_1.z.date()
});
// Form Builder Types
exports.FieldTypes = {
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
};
// Field Validation Schema
exports.FieldValidationSchema = zod_1.z.object({
    required: zod_1.z.boolean().default(false),
    minLength: zod_1.z.number().optional(),
    maxLength: zod_1.z.number().optional(),
    min: zod_1.z.number().optional(),
    max: zod_1.z.number().optional(),
    pattern: zod_1.z.string().optional(),
    minDate: zod_1.z.string().optional(),
    maxDate: zod_1.z.string().optional(),
    step: zod_1.z.number().optional(),
    customValidation: zod_1.z.string().optional(), // JavaScript function string
});
// Conditional Logic Schema
exports.ConditionalRuleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    conditions: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        operator: zod_1.z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
        value: zod_1.z.any(),
    })),
    operator: zod_1.z.enum(['AND', 'OR']).default('AND'),
    actions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['show', 'hide', 'enable', 'disable', 'require', 'set_value', 'trigger_calculation']),
        target: zod_1.z.string(),
        value: zod_1.z.any().optional(),
    })),
});
// Field Definition Schema
exports.FieldDefinitionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum([
        'text', 'number', 'date', 'time', 'select', 'multiSelect', 'radio', 'checkbox',
        'textarea', 'photo', 'signature', 'gpsLocation', 'weather', 'inspector',
        'bmpChecklist', 'measurement', 'swpppTrigger', 'violationCode',
        'correctiveAction', 'repeater', 'table', 'calculation', 'fileUpload'
    ]),
    label: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    placeholder: zod_1.z.string().optional(),
    defaultValue: zod_1.z.any().optional(),
    options: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.string(),
        value: zod_1.z.any(),
    })).optional(),
    validation: exports.FieldValidationSchema.optional(),
    conditional: exports.ConditionalRuleSchema.optional(),
    metadata: zod_1.z.object({
        gpsRequired: zod_1.z.boolean().optional(),
        photoQuality: zod_1.z.enum(['high', 'medium', 'low']).optional(),
        signatureCertificate: zod_1.z.boolean().optional(),
        weatherSource: zod_1.z.enum(['noaa', 'openweather']).optional(),
        units: zod_1.z.string().optional(), // For measurement fields
        calculation: zod_1.z.string().optional(), // JavaScript expression
        epaCompliance: zod_1.z.object({
            regulation: zod_1.z.string(),
            section: zod_1.z.string(),
            criticalField: zod_1.z.boolean().default(false),
        }).optional(),
    }).optional(),
    order: zod_1.z.number().default(0),
    width: zod_1.z.enum(['full', 'half', 'third', 'quarter']).default('full'),
});
// Form Template Schema
exports.FormTemplateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orgId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    category: zod_1.z.enum(['EPA_SWPPP', 'EPA_CGP', 'OSHA_SAFETY', 'STATE_PERMIT', 'CUSTOM']),
    version: zod_1.z.number().min(1).default(1),
    isActive: zod_1.z.boolean().default(true),
    fields: zod_1.z.array(exports.FieldDefinitionSchema),
    logic: zod_1.z.array(exports.ConditionalRuleSchema),
    calculations: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        formula: zod_1.z.string(), // JavaScript expression
        targetField: zod_1.z.string(),
        dependencies: zod_1.z.array(zod_1.z.string()),
    })),
    compliance: zod_1.z.object({
        regulation: zod_1.z.string(),
        deadline: zod_1.z.string(),
        authority: zod_1.z.string(),
        retention: zod_1.z.object({
            years: zod_1.z.number(),
            archival: zod_1.z.boolean(),
        }),
        criticalThresholds: zod_1.z.array(zod_1.z.object({
            field: zod_1.z.string(),
            value: zod_1.z.any(),
            message: zod_1.z.string(),
        })),
    }).optional(),
    workflow: zod_1.z.object({
        stages: zod_1.z.array(zod_1.z.string()),
        approvalRequired: zod_1.z.boolean().default(false),
        notifications: zod_1.z.array(zod_1.z.object({
            trigger: zod_1.z.string(),
            recipients: zod_1.z.array(zod_1.z.string()),
            template: zod_1.z.string(),
        })),
    }).optional(),
    styling: zod_1.z.object({
        theme: zod_1.z.enum(['construction', 'minimal', 'branded']).default('construction'),
        colors: zod_1.z.object({
            primary: zod_1.z.string(),
            secondary: zod_1.z.string(),
            accent: zod_1.z.string(),
        }).optional(),
        layout: zod_1.z.enum(['single-column', 'two-column', 'adaptive']).default('single-column'),
        mobileOptimized: zod_1.z.boolean().default(true),
    }).optional(),
    createdBy: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Form Submission Schema
exports.FormSubmissionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orgId: zod_1.z.string().uuid(),
    templateId: zod_1.z.string().uuid(),
    templateVersion: zod_1.z.number(),
    inspectionId: zod_1.z.string().uuid().optional(),
    projectId: zod_1.z.string().uuid().optional(),
    submittedBy: zod_1.z.string(),
    status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED']),
    data: zod_1.z.record(zod_1.z.any()), // Field name -> value pairs
    metadata: zod_1.z.object({
        formId: zod_1.z.string().uuid(),
        formVersion: zod_1.z.number(),
        submittedAt: zod_1.z.date(),
        submittedBy: zod_1.z.string(),
        gpsLocation: zod_1.z.object({
            latitude: zod_1.z.number(),
            longitude: zod_1.z.number(),
            accuracy: zod_1.z.number(),
        }).optional(),
        offline: zod_1.z.boolean().default(false),
        deviceInfo: zod_1.z.object({
            userAgent: zod_1.z.string(),
            platform: zod_1.z.string(),
            version: zod_1.z.string(),
        }).optional(),
        completionTime: zod_1.z.number().optional(), // Milliseconds
        validationErrors: zod_1.z.array(zod_1.z.object({
            field: zod_1.z.string(),
            message: zod_1.z.string(),
        })),
        complianceChecks: zod_1.z.array(zod_1.z.object({
            rule: zod_1.z.string(),
            passed: zod_1.z.boolean(),
            message: zod_1.z.string().optional(),
        })),
    }),
    offlineCreated: zod_1.z.boolean().default(false),
    submittedAt: zod_1.z.date().optional(),
    reviewedBy: zod_1.z.string().optional(),
    reviewedAt: zod_1.z.date().optional(),
    reviewNotes: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// EPA Compliance Validation Functions
const validateEpaThreshold = (value, threshold = exports.EPA_RAIN_THRESHOLD_INCHES) => {
    return value >= threshold;
};
exports.validateEpaThreshold = validateEpaThreshold;
const calculateInspectionDeadline = (eventDate, workingHours = true) => {
    const deadline = new Date(eventDate);
    if (workingHours) {
        // Add 24 working hours (3 business days)
        let daysToAdd = 0;
        let hoursToAdd = exports.EPA_INSPECTION_DEADLINE_HOURS;
        while (hoursToAdd > 0) {
            deadline.setDate(deadline.getDate() + 1);
            const dayOfWeek = deadline.getDay();
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                hoursToAdd -= 8; // 8-hour work day
            }
        }
    }
    else {
        deadline.setHours(deadline.getHours() + exports.EPA_INSPECTION_DEADLINE_HOURS);
    }
    return deadline;
};
exports.calculateInspectionDeadline = calculateInspectionDeadline;
// Utility function to generate UUIDs (simplified for templates)
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// Form Builder Preset Templates
exports.EPA_SWPPP_INSPECTION_TEMPLATE = {
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
exports.schemas = {
    WeatherEventSchema: exports.WeatherEventSchema,
    SwpppInspectionSchema: exports.SwpppInspectionSchema,
    PhotoMetadataSchema: exports.PhotoMetadataSchema,
    OrganizationSchema: exports.OrganizationSchema,
    UserRoleSchema: exports.UserRoleSchema,
    ProjectSchema: exports.ProjectSchema,
    OfflineSyncSchema: exports.OfflineSyncSchema,
    InspectorAccessTokenSchema: exports.InspectorAccessTokenSchema,
    FieldValidationSchema: exports.FieldValidationSchema,
    ConditionalRuleSchema: exports.ConditionalRuleSchema,
    FieldDefinitionSchema: exports.FieldDefinitionSchema,
    FormTemplateSchema: exports.FormTemplateSchema,
    FormSubmissionSchema: exports.FormSubmissionSchema,
};
//# sourceMappingURL=index.js.map