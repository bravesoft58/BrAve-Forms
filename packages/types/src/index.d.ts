import { z } from 'zod';
export declare const EPA_RAIN_THRESHOLD_INCHES = 0.25;
export declare const EPA_INSPECTION_DEADLINE_HOURS = 24;
export declare const WeatherEventSchema: z.ZodObject<{
    projectId: z.ZodString;
    precipitationInches: z.ZodNumber;
    eventDate: z.ZodDate;
    source: z.ZodEnum<["NOAA", "OPENWEATHER", "MANUAL"]>;
    inspectionDeadline: z.ZodDate;
    requiresInspection: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    source: "NOAA" | "OPENWEATHER" | "MANUAL";
    projectId: string;
    precipitationInches: number;
    eventDate: Date;
    inspectionDeadline: Date;
    requiresInspection: boolean;
}, {
    source: "NOAA" | "OPENWEATHER" | "MANUAL";
    projectId: string;
    precipitationInches: number;
    eventDate: Date;
    inspectionDeadline: Date;
    requiresInspection: boolean;
}>;
export type WeatherEvent = z.infer<typeof WeatherEventSchema>;
export declare const SwpppInspectionSchema: z.ZodObject<{
    projectId: z.ZodString;
    inspectorId: z.ZodString;
    inspectionDate: z.ZodDate;
    weatherTriggered: z.ZodBoolean;
    precipitationInches: z.ZodOptional<z.ZodNumber>;
    bmps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["SILT_FENCE", "CHECK_DAM", "INLET_PROTECTION", "SEDIMENT_BASIN", "OTHER"]>;
        installed: z.ZodBoolean;
        functional: z.ZodBoolean;
        maintenanceRequired: z.ZodBoolean;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
        installed: boolean;
        functional: boolean;
        maintenanceRequired: boolean;
        notes?: string | undefined;
    }, {
        name: string;
        id: string;
        type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
        installed: boolean;
        functional: boolean;
        maintenanceRequired: boolean;
        notes?: string | undefined;
    }>, "many">;
    dischargePoints: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        location: z.ZodString;
        hasDischarge: z.ZodBoolean;
        turbidity: z.ZodOptional<z.ZodEnum<["CLEAR", "SLIGHTLY_TURBID", "TURBID", "VERY_TURBID"]>>;
        controlMeasures: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        location: string;
        hasDischarge: boolean;
        turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
        controlMeasures?: string | undefined;
    }, {
        id: string;
        location: string;
        hasDischarge: boolean;
        turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
        controlMeasures?: string | undefined;
    }>, "many">;
    violations: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        location: z.ZodString;
        severity: z.ZodEnum<["MINOR", "MAJOR", "CRITICAL"]>;
        description: z.ZodString;
        correctiveAction: z.ZodString;
        photoIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        location: string;
        severity: "MINOR" | "MAJOR" | "CRITICAL";
        correctiveAction: string;
        photoIds: string[];
    }, {
        type: string;
        description: string;
        location: string;
        severity: "MINOR" | "MAJOR" | "CRITICAL";
        correctiveAction: string;
        photoIds: string[];
    }>, "many">;
    overallCompliant: z.ZodBoolean;
    additionalNotes: z.ZodOptional<z.ZodString>;
    signature: z.ZodString;
    signedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    inspectorId: string;
    inspectionDate: Date;
    weatherTriggered: boolean;
    bmps: {
        name: string;
        id: string;
        type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
        installed: boolean;
        functional: boolean;
        maintenanceRequired: boolean;
        notes?: string | undefined;
    }[];
    dischargePoints: {
        id: string;
        location: string;
        hasDischarge: boolean;
        turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
        controlMeasures?: string | undefined;
    }[];
    violations: {
        type: string;
        description: string;
        location: string;
        severity: "MINOR" | "MAJOR" | "CRITICAL";
        correctiveAction: string;
        photoIds: string[];
    }[];
    overallCompliant: boolean;
    signature: string;
    signedAt: Date;
    precipitationInches?: number | undefined;
    additionalNotes?: string | undefined;
}, {
    projectId: string;
    inspectorId: string;
    inspectionDate: Date;
    weatherTriggered: boolean;
    bmps: {
        name: string;
        id: string;
        type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
        installed: boolean;
        functional: boolean;
        maintenanceRequired: boolean;
        notes?: string | undefined;
    }[];
    dischargePoints: {
        id: string;
        location: string;
        hasDischarge: boolean;
        turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
        controlMeasures?: string | undefined;
    }[];
    violations: {
        type: string;
        description: string;
        location: string;
        severity: "MINOR" | "MAJOR" | "CRITICAL";
        correctiveAction: string;
        photoIds: string[];
    }[];
    overallCompliant: boolean;
    signature: string;
    signedAt: Date;
    precipitationInches?: number | undefined;
    additionalNotes?: string | undefined;
}>;
export type SwpppInspection = z.infer<typeof SwpppInspectionSchema>;
export declare const PhotoMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    inspectionId: z.ZodString;
    filename: z.ZodString;
    mimeType: z.ZodString;
    fileSize: z.ZodNumber;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    takenAt: z.ZodDate;
    caption: z.ZodOptional<z.ZodString>;
    s3Key: z.ZodOptional<z.ZodString>;
    localPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    inspectionId: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    takenAt: Date;
    caption?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    s3Key?: string | undefined;
    localPath?: string | undefined;
}, {
    id: string;
    inspectionId: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    takenAt: Date;
    caption?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    s3Key?: string | undefined;
    localPath?: string | undefined;
}>;
export type PhotoMetadata = z.infer<typeof PhotoMetadataSchema>;
export declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    clerkOrgId: z.ZodString;
    name: z.ZodString;
    plan: z.ZodEnum<["STARTER", "PROFESSIONAL", "ENTERPRISE"]>;
    maxProjects: z.ZodNumber;
    maxUsers: z.ZodNumber;
    features: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    features: string[];
    id: string;
    clerkOrgId: string;
    plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
    maxProjects: number;
    maxUsers: number;
}, {
    name: string;
    features: string[];
    id: string;
    clerkOrgId: string;
    plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
    maxProjects: number;
    maxUsers: number;
}>;
export type Organization = z.infer<typeof OrganizationSchema>;
export declare const UserRoleSchema: z.ZodEnum<["OWNER", "ADMIN", "MANAGER", "MEMBER", "INSPECTOR"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    orgId: z.ZodString;
    name: z.ZodString;
    address: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    permitNumber: z.ZodOptional<z.ZodString>;
    startDate: z.ZodDate;
    endDate: z.ZodOptional<z.ZodDate>;
    disturbedAcres: z.ZodNumber;
    status: z.ZodEnum<["PLANNING", "ACTIVE", "SUSPENDED", "COMPLETED", "CLOSED"]>;
    swpppConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    bmps: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    address: string;
    status: "PLANNING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CLOSED";
    startDate: Date;
    bmps: Record<string, any>[];
    latitude: number;
    longitude: number;
    orgId: string;
    disturbedAcres: number;
    endDate?: Date | undefined;
    permitNumber?: string | undefined;
    swpppConfig?: Record<string, any> | undefined;
}, {
    name: string;
    id: string;
    address: string;
    status: "PLANNING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CLOSED";
    startDate: Date;
    bmps: Record<string, any>[];
    latitude: number;
    longitude: number;
    orgId: string;
    disturbedAcres: number;
    endDate?: Date | undefined;
    permitNumber?: string | undefined;
    swpppConfig?: Record<string, any> | undefined;
}>;
export type Project = z.infer<typeof ProjectSchema>;
export declare const OfflineSyncSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["CREATE", "UPDATE", "DELETE"]>;
    entity: z.ZodEnum<["INSPECTION", "PHOTO", "PROJECT", "BMP"]>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    createdAt: z.ZodDate;
    deviceId: z.ZodString;
    userId: z.ZodString;
    synced: z.ZodDefault<z.ZodBoolean>;
    syncedAt: z.ZodOptional<z.ZodDate>;
    conflictResolution: z.ZodOptional<z.ZodEnum<["CLIENT_WINS", "SERVER_WINS", "MERGE"]>>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, any>;
    id: string;
    type: "CREATE" | "UPDATE" | "DELETE";
    entity: "INSPECTION" | "PHOTO" | "PROJECT" | "BMP";
    createdAt: Date;
    deviceId: string;
    userId: string;
    synced: boolean;
    syncedAt?: Date | undefined;
    conflictResolution?: "CLIENT_WINS" | "SERVER_WINS" | "MERGE" | undefined;
}, {
    data: Record<string, any>;
    id: string;
    type: "CREATE" | "UPDATE" | "DELETE";
    entity: "INSPECTION" | "PHOTO" | "PROJECT" | "BMP";
    createdAt: Date;
    deviceId: string;
    userId: string;
    synced?: boolean | undefined;
    syncedAt?: Date | undefined;
    conflictResolution?: "CLIENT_WINS" | "SERVER_WINS" | "MERGE" | undefined;
}>;
export type OfflineSync = z.infer<typeof OfflineSyncSchema>;
export declare const InspectorAccessTokenSchema: z.ZodObject<{
    projectId: z.ZodString;
    token: z.ZodString;
    expiresAt: z.ZodDate;
    permissions: z.ZodArray<z.ZodEnum<["VIEW_INSPECTIONS", "VIEW_PHOTOS", "VIEW_BMPS", "VIEW_VIOLATIONS"]>, "many">;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    permissions: ("VIEW_INSPECTIONS" | "VIEW_PHOTOS" | "VIEW_BMPS" | "VIEW_VIOLATIONS")[];
    projectId: string;
    createdAt: Date;
    token: string;
    expiresAt: Date;
    createdBy: string;
}, {
    permissions: ("VIEW_INSPECTIONS" | "VIEW_PHOTOS" | "VIEW_BMPS" | "VIEW_VIOLATIONS")[];
    projectId: string;
    createdAt: Date;
    token: string;
    expiresAt: Date;
    createdBy: string;
}>;
export type InspectorAccessToken = z.infer<typeof InspectorAccessTokenSchema>;
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
export interface ComplianceValidation {
    isCompliant: boolean;
    violations: string[];
    warnings: string[];
    recommendations: string[];
}
export declare const FieldTypes: {
    readonly TEXT: "text";
    readonly NUMBER: "number";
    readonly DATE: "date";
    readonly TIME: "time";
    readonly SELECT: "select";
    readonly MULTI_SELECT: "multiSelect";
    readonly RADIO: "radio";
    readonly CHECKBOX: "checkbox";
    readonly TEXTAREA: "textarea";
    readonly PHOTO: "photo";
    readonly SIGNATURE: "signature";
    readonly GPS_LOCATION: "gpsLocation";
    readonly WEATHER: "weather";
    readonly INSPECTOR: "inspector";
    readonly BMP_CHECKLIST: "bmpChecklist";
    readonly MEASUREMENT: "measurement";
    readonly SWPPP_TRIGGER: "swpppTrigger";
    readonly VIOLATION_CODE: "violationCode";
    readonly CORRECTIVE_ACTION: "correctiveAction";
    readonly REPEATER: "repeater";
    readonly TABLE: "table";
    readonly CALCULATION: "calculation";
    readonly FILE_UPLOAD: "fileUpload";
};
export type FieldType = typeof FieldTypes[keyof typeof FieldTypes];
export declare const FieldValidationSchema: z.ZodObject<{
    required: z.ZodDefault<z.ZodBoolean>;
    minLength: z.ZodOptional<z.ZodNumber>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    pattern: z.ZodOptional<z.ZodString>;
    minDate: z.ZodOptional<z.ZodString>;
    maxDate: z.ZodOptional<z.ZodString>;
    step: z.ZodOptional<z.ZodNumber>;
    customValidation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    required: boolean;
    max?: number | undefined;
    min?: number | undefined;
    pattern?: string | undefined;
    minLength?: number | undefined;
    step?: number | undefined;
    maxLength?: number | undefined;
    minDate?: string | undefined;
    maxDate?: string | undefined;
    customValidation?: string | undefined;
}, {
    max?: number | undefined;
    min?: number | undefined;
    pattern?: string | undefined;
    minLength?: number | undefined;
    step?: number | undefined;
    required?: boolean | undefined;
    maxLength?: number | undefined;
    minDate?: string | undefined;
    maxDate?: string | undefined;
    customValidation?: string | undefined;
}>;
export type FieldValidation = z.infer<typeof FieldValidationSchema>;
export declare const ConditionalRuleSchema: z.ZodObject<{
    id: z.ZodString;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
        field: string;
        value?: any;
    }, {
        operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
        field: string;
        value?: any;
    }>, "many">;
    operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
        target: z.ZodString;
        value: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        target: string;
        type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
        value?: any;
    }, {
        target: string;
        type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
        value?: any;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    operator: "AND" | "OR";
    actions: {
        target: string;
        type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
        value?: any;
    }[];
    conditions: {
        operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
        field: string;
        value?: any;
    }[];
}, {
    id: string;
    actions: {
        target: string;
        type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
        value?: any;
    }[];
    conditions: {
        operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
        field: string;
        value?: any;
    }[];
    operator?: "AND" | "OR" | undefined;
}>;
export type ConditionalRule = z.infer<typeof ConditionalRuleSchema>;
export declare const FieldDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["text", "number", "date", "time", "select", "multiSelect", "radio", "checkbox", "textarea", "photo", "signature", "gpsLocation", "weather", "inspector", "bmpChecklist", "measurement", "swpppTrigger", "violationCode", "correctiveAction", "repeater", "table", "calculation", "fileUpload"]>;
    label: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    placeholder: z.ZodOptional<z.ZodString>;
    defaultValue: z.ZodOptional<z.ZodAny>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        label: string;
        value?: any;
    }, {
        label: string;
        value?: any;
    }>, "many">>;
    validation: z.ZodOptional<z.ZodObject<{
        required: z.ZodDefault<z.ZodBoolean>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        pattern: z.ZodOptional<z.ZodString>;
        minDate: z.ZodOptional<z.ZodString>;
        maxDate: z.ZodOptional<z.ZodString>;
        step: z.ZodOptional<z.ZodNumber>;
        customValidation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        max?: number | undefined;
        min?: number | undefined;
        pattern?: string | undefined;
        minLength?: number | undefined;
        step?: number | undefined;
        maxLength?: number | undefined;
        minDate?: string | undefined;
        maxDate?: string | undefined;
        customValidation?: string | undefined;
    }, {
        max?: number | undefined;
        min?: number | undefined;
        pattern?: string | undefined;
        minLength?: number | undefined;
        step?: number | undefined;
        required?: boolean | undefined;
        maxLength?: number | undefined;
        minDate?: string | undefined;
        maxDate?: string | undefined;
        customValidation?: string | undefined;
    }>>;
    conditional: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        conditions: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }, {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }>, "many">;
        operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
        actions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
            target: z.ZodString;
            value: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }, {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        operator: "AND" | "OR";
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
    }, {
        id: string;
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
        operator?: "AND" | "OR" | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        gpsRequired: z.ZodOptional<z.ZodBoolean>;
        photoQuality: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
        signatureCertificate: z.ZodOptional<z.ZodBoolean>;
        weatherSource: z.ZodOptional<z.ZodEnum<["noaa", "openweather"]>>;
        units: z.ZodOptional<z.ZodString>;
        calculation: z.ZodOptional<z.ZodString>;
        epaCompliance: z.ZodOptional<z.ZodObject<{
            regulation: z.ZodString;
            section: z.ZodString;
            criticalField: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            section: string;
            regulation: string;
            criticalField: boolean;
        }, {
            section: string;
            regulation: string;
            criticalField?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        calculation?: string | undefined;
        gpsRequired?: boolean | undefined;
        photoQuality?: "low" | "medium" | "high" | undefined;
        signatureCertificate?: boolean | undefined;
        weatherSource?: "noaa" | "openweather" | undefined;
        units?: string | undefined;
        epaCompliance?: {
            section: string;
            regulation: string;
            criticalField: boolean;
        } | undefined;
    }, {
        calculation?: string | undefined;
        gpsRequired?: boolean | undefined;
        photoQuality?: "low" | "medium" | "high" | undefined;
        signatureCertificate?: boolean | undefined;
        weatherSource?: "noaa" | "openweather" | undefined;
        units?: string | undefined;
        epaCompliance?: {
            section: string;
            regulation: string;
            criticalField?: boolean | undefined;
        } | undefined;
    }>>;
    order: z.ZodDefault<z.ZodNumber>;
    width: z.ZodDefault<z.ZodEnum<["full", "half", "third", "quarter"]>>;
}, "strip", z.ZodTypeAny, {
    order: number;
    width: "full" | "half" | "third" | "quarter";
    name: string;
    id: string;
    type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
    label: string;
    metadata?: {
        calculation?: string | undefined;
        gpsRequired?: boolean | undefined;
        photoQuality?: "low" | "medium" | "high" | undefined;
        signatureCertificate?: boolean | undefined;
        weatherSource?: "noaa" | "openweather" | undefined;
        units?: string | undefined;
        epaCompliance?: {
            section: string;
            regulation: string;
            criticalField: boolean;
        } | undefined;
    } | undefined;
    description?: string | undefined;
    defaultValue?: any;
    placeholder?: string | undefined;
    options?: {
        label: string;
        value?: any;
    }[] | undefined;
    validation?: {
        required: boolean;
        max?: number | undefined;
        min?: number | undefined;
        pattern?: string | undefined;
        minLength?: number | undefined;
        step?: number | undefined;
        maxLength?: number | undefined;
        minDate?: string | undefined;
        maxDate?: string | undefined;
        customValidation?: string | undefined;
    } | undefined;
    conditional?: {
        id: string;
        operator: "AND" | "OR";
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
    } | undefined;
}, {
    name: string;
    id: string;
    type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
    label: string;
    order?: number | undefined;
    width?: "full" | "half" | "third" | "quarter" | undefined;
    metadata?: {
        calculation?: string | undefined;
        gpsRequired?: boolean | undefined;
        photoQuality?: "low" | "medium" | "high" | undefined;
        signatureCertificate?: boolean | undefined;
        weatherSource?: "noaa" | "openweather" | undefined;
        units?: string | undefined;
        epaCompliance?: {
            section: string;
            regulation: string;
            criticalField?: boolean | undefined;
        } | undefined;
    } | undefined;
    description?: string | undefined;
    defaultValue?: any;
    placeholder?: string | undefined;
    options?: {
        label: string;
        value?: any;
    }[] | undefined;
    validation?: {
        max?: number | undefined;
        min?: number | undefined;
        pattern?: string | undefined;
        minLength?: number | undefined;
        step?: number | undefined;
        required?: boolean | undefined;
        maxLength?: number | undefined;
        minDate?: string | undefined;
        maxDate?: string | undefined;
        customValidation?: string | undefined;
    } | undefined;
    conditional?: {
        id: string;
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
        operator?: "AND" | "OR" | undefined;
    } | undefined;
}>;
export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;
export declare const FormTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    orgId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["EPA_SWPPP", "EPA_CGP", "OSHA_SAFETY", "STATE_PERMIT", "CUSTOM"]>;
    version: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    fields: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["text", "number", "date", "time", "select", "multiSelect", "radio", "checkbox", "textarea", "photo", "signature", "gpsLocation", "weather", "inspector", "bmpChecklist", "measurement", "swpppTrigger", "violationCode", "correctiveAction", "repeater", "table", "calculation", "fileUpload"]>;
        label: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        placeholder: z.ZodOptional<z.ZodString>;
        defaultValue: z.ZodOptional<z.ZodAny>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            label: string;
            value?: any;
        }, {
            label: string;
            value?: any;
        }>, "many">>;
        validation: z.ZodOptional<z.ZodObject<{
            required: z.ZodDefault<z.ZodBoolean>;
            minLength: z.ZodOptional<z.ZodNumber>;
            maxLength: z.ZodOptional<z.ZodNumber>;
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            pattern: z.ZodOptional<z.ZodString>;
            minDate: z.ZodOptional<z.ZodString>;
            maxDate: z.ZodOptional<z.ZodString>;
            step: z.ZodOptional<z.ZodNumber>;
            customValidation: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        }, {
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            required?: boolean | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        }>>;
        conditional: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            conditions: z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
                value: z.ZodAny;
            }, "strip", z.ZodTypeAny, {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }, {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }>, "many">;
            operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
            actions: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
                target: z.ZodString;
                value: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }, {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            id: string;
            operator: "AND" | "OR";
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
        }, {
            id: string;
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
            operator?: "AND" | "OR" | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodObject<{
            gpsRequired: z.ZodOptional<z.ZodBoolean>;
            photoQuality: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
            signatureCertificate: z.ZodOptional<z.ZodBoolean>;
            weatherSource: z.ZodOptional<z.ZodEnum<["noaa", "openweather"]>>;
            units: z.ZodOptional<z.ZodString>;
            calculation: z.ZodOptional<z.ZodString>;
            epaCompliance: z.ZodOptional<z.ZodObject<{
                regulation: z.ZodString;
                section: z.ZodString;
                criticalField: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                section: string;
                regulation: string;
                criticalField: boolean;
            }, {
                section: string;
                regulation: string;
                criticalField?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField: boolean;
            } | undefined;
        }, {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField?: boolean | undefined;
            } | undefined;
        }>>;
        order: z.ZodDefault<z.ZodNumber>;
        width: z.ZodDefault<z.ZodEnum<["full", "half", "third", "quarter"]>>;
    }, "strip", z.ZodTypeAny, {
        order: number;
        width: "full" | "half" | "third" | "quarter";
        name: string;
        id: string;
        type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
        label: string;
        metadata?: {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField: boolean;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        defaultValue?: any;
        placeholder?: string | undefined;
        options?: {
            label: string;
            value?: any;
        }[] | undefined;
        validation?: {
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        } | undefined;
        conditional?: {
            id: string;
            operator: "AND" | "OR";
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
        } | undefined;
    }, {
        name: string;
        id: string;
        type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
        label: string;
        order?: number | undefined;
        width?: "full" | "half" | "third" | "quarter" | undefined;
        metadata?: {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField?: boolean | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        defaultValue?: any;
        placeholder?: string | undefined;
        options?: {
            label: string;
            value?: any;
        }[] | undefined;
        validation?: {
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            required?: boolean | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        } | undefined;
        conditional?: {
            id: string;
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
            operator?: "AND" | "OR" | undefined;
        } | undefined;
    }>, "many">;
    logic: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        conditions: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }, {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }>, "many">;
        operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
        actions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
            target: z.ZodString;
            value: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }, {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        operator: "AND" | "OR";
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
    }, {
        id: string;
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
        operator?: "AND" | "OR" | undefined;
    }>, "many">;
    calculations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        formula: z.ZodString;
        targetField: z.ZodString;
        dependencies: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        formula: string;
        targetField: string;
        dependencies: string[];
    }, {
        name: string;
        id: string;
        formula: string;
        targetField: string;
        dependencies: string[];
    }>, "many">;
    compliance: z.ZodOptional<z.ZodObject<{
        regulation: z.ZodString;
        deadline: z.ZodString;
        authority: z.ZodString;
        retention: z.ZodObject<{
            years: z.ZodNumber;
            archival: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            years: number;
            archival: boolean;
        }, {
            years: number;
            archival: boolean;
        }>;
        criticalThresholds: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            value: z.ZodAny;
            message: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            message: string;
            field: string;
            value?: any;
        }, {
            message: string;
            field: string;
            value?: any;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        regulation: string;
        deadline: string;
        authority: string;
        retention: {
            years: number;
            archival: boolean;
        };
        criticalThresholds: {
            message: string;
            field: string;
            value?: any;
        }[];
    }, {
        regulation: string;
        deadline: string;
        authority: string;
        retention: {
            years: number;
            archival: boolean;
        };
        criticalThresholds: {
            message: string;
            field: string;
            value?: any;
        }[];
    }>>;
    workflow: z.ZodOptional<z.ZodObject<{
        stages: z.ZodArray<z.ZodString, "many">;
        approvalRequired: z.ZodDefault<z.ZodBoolean>;
        notifications: z.ZodArray<z.ZodObject<{
            trigger: z.ZodString;
            recipients: z.ZodArray<z.ZodString, "many">;
            template: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            template: string;
            trigger: string;
            recipients: string[];
        }, {
            template: string;
            trigger: string;
            recipients: string[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        notifications: {
            template: string;
            trigger: string;
            recipients: string[];
        }[];
        stages: string[];
        approvalRequired: boolean;
    }, {
        notifications: {
            template: string;
            trigger: string;
            recipients: string[];
        }[];
        stages: string[];
        approvalRequired?: boolean | undefined;
    }>>;
    styling: z.ZodOptional<z.ZodObject<{
        theme: z.ZodDefault<z.ZodEnum<["construction", "minimal", "branded"]>>;
        colors: z.ZodOptional<z.ZodObject<{
            primary: z.ZodString;
            secondary: z.ZodString;
            accent: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            primary: string;
            secondary: string;
            accent: string;
        }, {
            primary: string;
            secondary: string;
            accent: string;
        }>>;
        layout: z.ZodDefault<z.ZodEnum<["single-column", "two-column", "adaptive"]>>;
        mobileOptimized: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        theme: "construction" | "minimal" | "branded";
        layout: "single-column" | "two-column" | "adaptive";
        mobileOptimized: boolean;
        colors?: {
            primary: string;
            secondary: string;
            accent: string;
        } | undefined;
    }, {
        theme?: "construction" | "minimal" | "branded" | undefined;
        colors?: {
            primary: string;
            secondary: string;
            accent: string;
        } | undefined;
        layout?: "single-column" | "two-column" | "adaptive" | undefined;
        mobileOptimized?: boolean | undefined;
    }>>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    version: number;
    isActive: boolean;
    orgId: string;
    createdAt: Date;
    createdBy: string;
    category: "EPA_SWPPP" | "EPA_CGP" | "OSHA_SAFETY" | "STATE_PERMIT" | "CUSTOM";
    fields: {
        order: number;
        width: "full" | "half" | "third" | "quarter";
        name: string;
        id: string;
        type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
        label: string;
        metadata?: {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField: boolean;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        defaultValue?: any;
        placeholder?: string | undefined;
        options?: {
            label: string;
            value?: any;
        }[] | undefined;
        validation?: {
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        } | undefined;
        conditional?: {
            id: string;
            operator: "AND" | "OR";
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
        } | undefined;
    }[];
    logic: {
        id: string;
        operator: "AND" | "OR";
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
    }[];
    calculations: {
        name: string;
        id: string;
        formula: string;
        targetField: string;
        dependencies: string[];
    }[];
    updatedAt: Date;
    description?: string | undefined;
    compliance?: {
        regulation: string;
        deadline: string;
        authority: string;
        retention: {
            years: number;
            archival: boolean;
        };
        criticalThresholds: {
            message: string;
            field: string;
            value?: any;
        }[];
    } | undefined;
    workflow?: {
        notifications: {
            template: string;
            trigger: string;
            recipients: string[];
        }[];
        stages: string[];
        approvalRequired: boolean;
    } | undefined;
    styling?: {
        theme: "construction" | "minimal" | "branded";
        layout: "single-column" | "two-column" | "adaptive";
        mobileOptimized: boolean;
        colors?: {
            primary: string;
            secondary: string;
            accent: string;
        } | undefined;
    } | undefined;
}, {
    name: string;
    id: string;
    orgId: string;
    createdAt: Date;
    createdBy: string;
    category: "EPA_SWPPP" | "EPA_CGP" | "OSHA_SAFETY" | "STATE_PERMIT" | "CUSTOM";
    fields: {
        name: string;
        id: string;
        type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
        label: string;
        order?: number | undefined;
        width?: "full" | "half" | "third" | "quarter" | undefined;
        metadata?: {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField?: boolean | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        defaultValue?: any;
        placeholder?: string | undefined;
        options?: {
            label: string;
            value?: any;
        }[] | undefined;
        validation?: {
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            required?: boolean | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        } | undefined;
        conditional?: {
            id: string;
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
            operator?: "AND" | "OR" | undefined;
        } | undefined;
    }[];
    logic: {
        id: string;
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
        operator?: "AND" | "OR" | undefined;
    }[];
    calculations: {
        name: string;
        id: string;
        formula: string;
        targetField: string;
        dependencies: string[];
    }[];
    updatedAt: Date;
    version?: number | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    compliance?: {
        regulation: string;
        deadline: string;
        authority: string;
        retention: {
            years: number;
            archival: boolean;
        };
        criticalThresholds: {
            message: string;
            field: string;
            value?: any;
        }[];
    } | undefined;
    workflow?: {
        notifications: {
            template: string;
            trigger: string;
            recipients: string[];
        }[];
        stages: string[];
        approvalRequired?: boolean | undefined;
    } | undefined;
    styling?: {
        theme?: "construction" | "minimal" | "branded" | undefined;
        colors?: {
            primary: string;
            secondary: string;
            accent: string;
        } | undefined;
        layout?: "single-column" | "two-column" | "adaptive" | undefined;
        mobileOptimized?: boolean | undefined;
    } | undefined;
}>;
export type FormTemplate = z.infer<typeof FormTemplateSchema>;
export declare const FormSubmissionSchema: z.ZodObject<{
    id: z.ZodString;
    orgId: z.ZodString;
    templateId: z.ZodString;
    templateVersion: z.ZodNumber;
    inspectionId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    submittedBy: z.ZodString;
    status: z.ZodEnum<["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"]>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    metadata: z.ZodObject<{
        formId: z.ZodString;
        formVersion: z.ZodNumber;
        submittedAt: z.ZodDate;
        submittedBy: z.ZodString;
        gpsLocation: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            accuracy: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
            accuracy: number;
        }, {
            latitude: number;
            longitude: number;
            accuracy: number;
        }>>;
        offline: z.ZodDefault<z.ZodBoolean>;
        deviceInfo: z.ZodOptional<z.ZodObject<{
            userAgent: z.ZodString;
            platform: z.ZodString;
            version: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            version: string;
            userAgent: string;
            platform: string;
        }, {
            version: string;
            userAgent: string;
            platform: string;
        }>>;
        completionTime: z.ZodOptional<z.ZodNumber>;
        validationErrors: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            message: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            message: string;
            field: string;
        }, {
            message: string;
            field: string;
        }>, "many">;
        complianceChecks: z.ZodArray<z.ZodObject<{
            rule: z.ZodString;
            passed: z.ZodBoolean;
            message: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            rule: string;
            passed: boolean;
            message?: string | undefined;
        }, {
            rule: string;
            passed: boolean;
            message?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        submittedBy: string;
        formId: string;
        formVersion: number;
        submittedAt: Date;
        offline: boolean;
        validationErrors: {
            message: string;
            field: string;
        }[];
        complianceChecks: {
            rule: string;
            passed: boolean;
            message?: string | undefined;
        }[];
        gpsLocation?: {
            latitude: number;
            longitude: number;
            accuracy: number;
        } | undefined;
        deviceInfo?: {
            version: string;
            userAgent: string;
            platform: string;
        } | undefined;
        completionTime?: number | undefined;
    }, {
        submittedBy: string;
        formId: string;
        formVersion: number;
        submittedAt: Date;
        validationErrors: {
            message: string;
            field: string;
        }[];
        complianceChecks: {
            rule: string;
            passed: boolean;
            message?: string | undefined;
        }[];
        gpsLocation?: {
            latitude: number;
            longitude: number;
            accuracy: number;
        } | undefined;
        offline?: boolean | undefined;
        deviceInfo?: {
            version: string;
            userAgent: string;
            platform: string;
        } | undefined;
        completionTime?: number | undefined;
    }>;
    offlineCreated: z.ZodDefault<z.ZodBoolean>;
    submittedAt: z.ZodOptional<z.ZodDate>;
    reviewedBy: z.ZodOptional<z.ZodString>;
    reviewedAt: z.ZodOptional<z.ZodDate>;
    reviewNotes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    data: Record<string, any>;
    id: string;
    metadata: {
        submittedBy: string;
        formId: string;
        formVersion: number;
        submittedAt: Date;
        offline: boolean;
        validationErrors: {
            message: string;
            field: string;
        }[];
        complianceChecks: {
            rule: string;
            passed: boolean;
            message?: string | undefined;
        }[];
        gpsLocation?: {
            latitude: number;
            longitude: number;
            accuracy: number;
        } | undefined;
        deviceInfo?: {
            version: string;
            userAgent: string;
            platform: string;
        } | undefined;
        completionTime?: number | undefined;
    };
    status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";
    submittedBy: string;
    orgId: string;
    createdAt: Date;
    updatedAt: Date;
    templateId: string;
    templateVersion: number;
    offlineCreated: boolean;
    projectId?: string | undefined;
    inspectionId?: string | undefined;
    submittedAt?: Date | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
    reviewNotes?: string | undefined;
}, {
    data: Record<string, any>;
    id: string;
    metadata: {
        submittedBy: string;
        formId: string;
        formVersion: number;
        submittedAt: Date;
        validationErrors: {
            message: string;
            field: string;
        }[];
        complianceChecks: {
            rule: string;
            passed: boolean;
            message?: string | undefined;
        }[];
        gpsLocation?: {
            latitude: number;
            longitude: number;
            accuracy: number;
        } | undefined;
        offline?: boolean | undefined;
        deviceInfo?: {
            version: string;
            userAgent: string;
            platform: string;
        } | undefined;
        completionTime?: number | undefined;
    };
    status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";
    submittedBy: string;
    orgId: string;
    createdAt: Date;
    updatedAt: Date;
    templateId: string;
    templateVersion: number;
    projectId?: string | undefined;
    inspectionId?: string | undefined;
    submittedAt?: Date | undefined;
    offlineCreated?: boolean | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
    reviewNotes?: string | undefined;
}>;
export type FormSubmission = z.infer<typeof FormSubmissionSchema>;
export declare const validateEpaThreshold: (value: number, threshold?: number) => boolean;
export declare const calculateInspectionDeadline: (eventDate: Date, workingHours?: boolean) => Date;
export declare const EPA_SWPPP_INSPECTION_TEMPLATE: Partial<FormTemplate>;
export declare const schemas: {
    WeatherEventSchema: z.ZodObject<{
        projectId: z.ZodString;
        precipitationInches: z.ZodNumber;
        eventDate: z.ZodDate;
        source: z.ZodEnum<["NOAA", "OPENWEATHER", "MANUAL"]>;
        inspectionDeadline: z.ZodDate;
        requiresInspection: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        source: "NOAA" | "OPENWEATHER" | "MANUAL";
        projectId: string;
        precipitationInches: number;
        eventDate: Date;
        inspectionDeadline: Date;
        requiresInspection: boolean;
    }, {
        source: "NOAA" | "OPENWEATHER" | "MANUAL";
        projectId: string;
        precipitationInches: number;
        eventDate: Date;
        inspectionDeadline: Date;
        requiresInspection: boolean;
    }>;
    SwpppInspectionSchema: z.ZodObject<{
        projectId: z.ZodString;
        inspectorId: z.ZodString;
        inspectionDate: z.ZodDate;
        weatherTriggered: z.ZodBoolean;
        precipitationInches: z.ZodOptional<z.ZodNumber>;
        bmps: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["SILT_FENCE", "CHECK_DAM", "INLET_PROTECTION", "SEDIMENT_BASIN", "OTHER"]>;
            installed: z.ZodBoolean;
            functional: z.ZodBoolean;
            maintenanceRequired: z.ZodBoolean;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
            installed: boolean;
            functional: boolean;
            maintenanceRequired: boolean;
            notes?: string | undefined;
        }, {
            name: string;
            id: string;
            type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
            installed: boolean;
            functional: boolean;
            maintenanceRequired: boolean;
            notes?: string | undefined;
        }>, "many">;
        dischargePoints: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            location: z.ZodString;
            hasDischarge: z.ZodBoolean;
            turbidity: z.ZodOptional<z.ZodEnum<["CLEAR", "SLIGHTLY_TURBID", "TURBID", "VERY_TURBID"]>>;
            controlMeasures: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            location: string;
            hasDischarge: boolean;
            turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
            controlMeasures?: string | undefined;
        }, {
            id: string;
            location: string;
            hasDischarge: boolean;
            turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
            controlMeasures?: string | undefined;
        }>, "many">;
        violations: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            location: z.ZodString;
            severity: z.ZodEnum<["MINOR", "MAJOR", "CRITICAL"]>;
            description: z.ZodString;
            correctiveAction: z.ZodString;
            photoIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            type: string;
            description: string;
            location: string;
            severity: "MINOR" | "MAJOR" | "CRITICAL";
            correctiveAction: string;
            photoIds: string[];
        }, {
            type: string;
            description: string;
            location: string;
            severity: "MINOR" | "MAJOR" | "CRITICAL";
            correctiveAction: string;
            photoIds: string[];
        }>, "many">;
        overallCompliant: z.ZodBoolean;
        additionalNotes: z.ZodOptional<z.ZodString>;
        signature: z.ZodString;
        signedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        projectId: string;
        inspectorId: string;
        inspectionDate: Date;
        weatherTriggered: boolean;
        bmps: {
            name: string;
            id: string;
            type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
            installed: boolean;
            functional: boolean;
            maintenanceRequired: boolean;
            notes?: string | undefined;
        }[];
        dischargePoints: {
            id: string;
            location: string;
            hasDischarge: boolean;
            turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
            controlMeasures?: string | undefined;
        }[];
        violations: {
            type: string;
            description: string;
            location: string;
            severity: "MINOR" | "MAJOR" | "CRITICAL";
            correctiveAction: string;
            photoIds: string[];
        }[];
        overallCompliant: boolean;
        signature: string;
        signedAt: Date;
        precipitationInches?: number | undefined;
        additionalNotes?: string | undefined;
    }, {
        projectId: string;
        inspectorId: string;
        inspectionDate: Date;
        weatherTriggered: boolean;
        bmps: {
            name: string;
            id: string;
            type: "SILT_FENCE" | "CHECK_DAM" | "INLET_PROTECTION" | "SEDIMENT_BASIN" | "OTHER";
            installed: boolean;
            functional: boolean;
            maintenanceRequired: boolean;
            notes?: string | undefined;
        }[];
        dischargePoints: {
            id: string;
            location: string;
            hasDischarge: boolean;
            turbidity?: "CLEAR" | "SLIGHTLY_TURBID" | "TURBID" | "VERY_TURBID" | undefined;
            controlMeasures?: string | undefined;
        }[];
        violations: {
            type: string;
            description: string;
            location: string;
            severity: "MINOR" | "MAJOR" | "CRITICAL";
            correctiveAction: string;
            photoIds: string[];
        }[];
        overallCompliant: boolean;
        signature: string;
        signedAt: Date;
        precipitationInches?: number | undefined;
        additionalNotes?: string | undefined;
    }>;
    PhotoMetadataSchema: z.ZodObject<{
        id: z.ZodString;
        inspectionId: z.ZodString;
        filename: z.ZodString;
        mimeType: z.ZodString;
        fileSize: z.ZodNumber;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        takenAt: z.ZodDate;
        caption: z.ZodOptional<z.ZodString>;
        s3Key: z.ZodOptional<z.ZodString>;
        localPath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        inspectionId: string;
        filename: string;
        mimeType: string;
        fileSize: number;
        takenAt: Date;
        caption?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        s3Key?: string | undefined;
        localPath?: string | undefined;
    }, {
        id: string;
        inspectionId: string;
        filename: string;
        mimeType: string;
        fileSize: number;
        takenAt: Date;
        caption?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        s3Key?: string | undefined;
        localPath?: string | undefined;
    }>;
    OrganizationSchema: z.ZodObject<{
        id: z.ZodString;
        clerkOrgId: z.ZodString;
        name: z.ZodString;
        plan: z.ZodEnum<["STARTER", "PROFESSIONAL", "ENTERPRISE"]>;
        maxProjects: z.ZodNumber;
        maxUsers: z.ZodNumber;
        features: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        features: string[];
        id: string;
        clerkOrgId: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        maxProjects: number;
        maxUsers: number;
    }, {
        name: string;
        features: string[];
        id: string;
        clerkOrgId: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        maxProjects: number;
        maxUsers: number;
    }>;
    UserRoleSchema: z.ZodEnum<["OWNER", "ADMIN", "MANAGER", "MEMBER", "INSPECTOR"]>;
    ProjectSchema: z.ZodObject<{
        id: z.ZodString;
        orgId: z.ZodString;
        name: z.ZodString;
        address: z.ZodString;
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        permitNumber: z.ZodOptional<z.ZodString>;
        startDate: z.ZodDate;
        endDate: z.ZodOptional<z.ZodDate>;
        disturbedAcres: z.ZodNumber;
        status: z.ZodEnum<["PLANNING", "ACTIVE", "SUSPENDED", "COMPLETED", "CLOSED"]>;
        swpppConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        bmps: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        address: string;
        status: "PLANNING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CLOSED";
        startDate: Date;
        bmps: Record<string, any>[];
        latitude: number;
        longitude: number;
        orgId: string;
        disturbedAcres: number;
        endDate?: Date | undefined;
        permitNumber?: string | undefined;
        swpppConfig?: Record<string, any> | undefined;
    }, {
        name: string;
        id: string;
        address: string;
        status: "PLANNING" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CLOSED";
        startDate: Date;
        bmps: Record<string, any>[];
        latitude: number;
        longitude: number;
        orgId: string;
        disturbedAcres: number;
        endDate?: Date | undefined;
        permitNumber?: string | undefined;
        swpppConfig?: Record<string, any> | undefined;
    }>;
    OfflineSyncSchema: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["CREATE", "UPDATE", "DELETE"]>;
        entity: z.ZodEnum<["INSPECTION", "PHOTO", "PROJECT", "BMP"]>;
        data: z.ZodRecord<z.ZodString, z.ZodAny>;
        createdAt: z.ZodDate;
        deviceId: z.ZodString;
        userId: z.ZodString;
        synced: z.ZodDefault<z.ZodBoolean>;
        syncedAt: z.ZodOptional<z.ZodDate>;
        conflictResolution: z.ZodOptional<z.ZodEnum<["CLIENT_WINS", "SERVER_WINS", "MERGE"]>>;
    }, "strip", z.ZodTypeAny, {
        data: Record<string, any>;
        id: string;
        type: "CREATE" | "UPDATE" | "DELETE";
        entity: "INSPECTION" | "PHOTO" | "PROJECT" | "BMP";
        createdAt: Date;
        deviceId: string;
        userId: string;
        synced: boolean;
        syncedAt?: Date | undefined;
        conflictResolution?: "CLIENT_WINS" | "SERVER_WINS" | "MERGE" | undefined;
    }, {
        data: Record<string, any>;
        id: string;
        type: "CREATE" | "UPDATE" | "DELETE";
        entity: "INSPECTION" | "PHOTO" | "PROJECT" | "BMP";
        createdAt: Date;
        deviceId: string;
        userId: string;
        synced?: boolean | undefined;
        syncedAt?: Date | undefined;
        conflictResolution?: "CLIENT_WINS" | "SERVER_WINS" | "MERGE" | undefined;
    }>;
    InspectorAccessTokenSchema: z.ZodObject<{
        projectId: z.ZodString;
        token: z.ZodString;
        expiresAt: z.ZodDate;
        permissions: z.ZodArray<z.ZodEnum<["VIEW_INSPECTIONS", "VIEW_PHOTOS", "VIEW_BMPS", "VIEW_VIOLATIONS"]>, "many">;
        createdBy: z.ZodString;
        createdAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        permissions: ("VIEW_INSPECTIONS" | "VIEW_PHOTOS" | "VIEW_BMPS" | "VIEW_VIOLATIONS")[];
        projectId: string;
        createdAt: Date;
        token: string;
        expiresAt: Date;
        createdBy: string;
    }, {
        permissions: ("VIEW_INSPECTIONS" | "VIEW_PHOTOS" | "VIEW_BMPS" | "VIEW_VIOLATIONS")[];
        projectId: string;
        createdAt: Date;
        token: string;
        expiresAt: Date;
        createdBy: string;
    }>;
    FieldValidationSchema: z.ZodObject<{
        required: z.ZodDefault<z.ZodBoolean>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        pattern: z.ZodOptional<z.ZodString>;
        minDate: z.ZodOptional<z.ZodString>;
        maxDate: z.ZodOptional<z.ZodString>;
        step: z.ZodOptional<z.ZodNumber>;
        customValidation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        max?: number | undefined;
        min?: number | undefined;
        pattern?: string | undefined;
        minLength?: number | undefined;
        step?: number | undefined;
        maxLength?: number | undefined;
        minDate?: string | undefined;
        maxDate?: string | undefined;
        customValidation?: string | undefined;
    }, {
        max?: number | undefined;
        min?: number | undefined;
        pattern?: string | undefined;
        minLength?: number | undefined;
        step?: number | undefined;
        required?: boolean | undefined;
        maxLength?: number | undefined;
        minDate?: string | undefined;
        maxDate?: string | undefined;
        customValidation?: string | undefined;
    }>;
    ConditionalRuleSchema: z.ZodObject<{
        id: z.ZodString;
        conditions: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }, {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }>, "many">;
        operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
        actions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
            target: z.ZodString;
            value: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }, {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        operator: "AND" | "OR";
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
    }, {
        id: string;
        actions: {
            target: string;
            type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
            value?: any;
        }[];
        conditions: {
            operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
            field: string;
            value?: any;
        }[];
        operator?: "AND" | "OR" | undefined;
    }>;
    FieldDefinitionSchema: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["text", "number", "date", "time", "select", "multiSelect", "radio", "checkbox", "textarea", "photo", "signature", "gpsLocation", "weather", "inspector", "bmpChecklist", "measurement", "swpppTrigger", "violationCode", "correctiveAction", "repeater", "table", "calculation", "fileUpload"]>;
        label: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        placeholder: z.ZodOptional<z.ZodString>;
        defaultValue: z.ZodOptional<z.ZodAny>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            value: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            label: string;
            value?: any;
        }, {
            label: string;
            value?: any;
        }>, "many">>;
        validation: z.ZodOptional<z.ZodObject<{
            required: z.ZodDefault<z.ZodBoolean>;
            minLength: z.ZodOptional<z.ZodNumber>;
            maxLength: z.ZodOptional<z.ZodNumber>;
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            pattern: z.ZodOptional<z.ZodString>;
            minDate: z.ZodOptional<z.ZodString>;
            maxDate: z.ZodOptional<z.ZodString>;
            step: z.ZodOptional<z.ZodNumber>;
            customValidation: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        }, {
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            required?: boolean | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        }>>;
        conditional: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            conditions: z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
                value: z.ZodAny;
            }, "strip", z.ZodTypeAny, {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }, {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }>, "many">;
            operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
            actions: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
                target: z.ZodString;
                value: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }, {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            id: string;
            operator: "AND" | "OR";
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
        }, {
            id: string;
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
            operator?: "AND" | "OR" | undefined;
        }>>;
        metadata: z.ZodOptional<z.ZodObject<{
            gpsRequired: z.ZodOptional<z.ZodBoolean>;
            photoQuality: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
            signatureCertificate: z.ZodOptional<z.ZodBoolean>;
            weatherSource: z.ZodOptional<z.ZodEnum<["noaa", "openweather"]>>;
            units: z.ZodOptional<z.ZodString>;
            calculation: z.ZodOptional<z.ZodString>;
            epaCompliance: z.ZodOptional<z.ZodObject<{
                regulation: z.ZodString;
                section: z.ZodString;
                criticalField: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                section: string;
                regulation: string;
                criticalField: boolean;
            }, {
                section: string;
                regulation: string;
                criticalField?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField: boolean;
            } | undefined;
        }, {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField?: boolean | undefined;
            } | undefined;
        }>>;
        order: z.ZodDefault<z.ZodNumber>;
        width: z.ZodDefault<z.ZodEnum<["full", "half", "third", "quarter"]>>;
    }, "strip", z.ZodTypeAny, {
        order: number;
        width: "full" | "half" | "third" | "quarter";
        name: string;
        id: string;
        type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
        label: string;
        metadata?: {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField: boolean;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        defaultValue?: any;
        placeholder?: string | undefined;
        options?: {
            label: string;
            value?: any;
        }[] | undefined;
        validation?: {
            required: boolean;
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        } | undefined;
        conditional?: {
            id: string;
            operator: "AND" | "OR";
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
        } | undefined;
    }, {
        name: string;
        id: string;
        type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
        label: string;
        order?: number | undefined;
        width?: "full" | "half" | "third" | "quarter" | undefined;
        metadata?: {
            calculation?: string | undefined;
            gpsRequired?: boolean | undefined;
            photoQuality?: "low" | "medium" | "high" | undefined;
            signatureCertificate?: boolean | undefined;
            weatherSource?: "noaa" | "openweather" | undefined;
            units?: string | undefined;
            epaCompliance?: {
                section: string;
                regulation: string;
                criticalField?: boolean | undefined;
            } | undefined;
        } | undefined;
        description?: string | undefined;
        defaultValue?: any;
        placeholder?: string | undefined;
        options?: {
            label: string;
            value?: any;
        }[] | undefined;
        validation?: {
            max?: number | undefined;
            min?: number | undefined;
            pattern?: string | undefined;
            minLength?: number | undefined;
            step?: number | undefined;
            required?: boolean | undefined;
            maxLength?: number | undefined;
            minDate?: string | undefined;
            maxDate?: string | undefined;
            customValidation?: string | undefined;
        } | undefined;
        conditional?: {
            id: string;
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
            operator?: "AND" | "OR" | undefined;
        } | undefined;
    }>;
    FormTemplateSchema: z.ZodObject<{
        id: z.ZodString;
        orgId: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        category: z.ZodEnum<["EPA_SWPPP", "EPA_CGP", "OSHA_SAFETY", "STATE_PERMIT", "CUSTOM"]>;
        version: z.ZodDefault<z.ZodNumber>;
        isActive: z.ZodDefault<z.ZodBoolean>;
        fields: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodEnum<["text", "number", "date", "time", "select", "multiSelect", "radio", "checkbox", "textarea", "photo", "signature", "gpsLocation", "weather", "inspector", "bmpChecklist", "measurement", "swpppTrigger", "violationCode", "correctiveAction", "repeater", "table", "calculation", "fileUpload"]>;
            label: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            placeholder: z.ZodOptional<z.ZodString>;
            defaultValue: z.ZodOptional<z.ZodAny>;
            options: z.ZodOptional<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                value: z.ZodAny;
            }, "strip", z.ZodTypeAny, {
                label: string;
                value?: any;
            }, {
                label: string;
                value?: any;
            }>, "many">>;
            validation: z.ZodOptional<z.ZodObject<{
                required: z.ZodDefault<z.ZodBoolean>;
                minLength: z.ZodOptional<z.ZodNumber>;
                maxLength: z.ZodOptional<z.ZodNumber>;
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                pattern: z.ZodOptional<z.ZodString>;
                minDate: z.ZodOptional<z.ZodString>;
                maxDate: z.ZodOptional<z.ZodString>;
                step: z.ZodOptional<z.ZodNumber>;
                customValidation: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                required: boolean;
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
                minLength?: number | undefined;
                step?: number | undefined;
                maxLength?: number | undefined;
                minDate?: string | undefined;
                maxDate?: string | undefined;
                customValidation?: string | undefined;
            }, {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
                minLength?: number | undefined;
                step?: number | undefined;
                required?: boolean | undefined;
                maxLength?: number | undefined;
                minDate?: string | undefined;
                maxDate?: string | undefined;
                customValidation?: string | undefined;
            }>>;
            conditional: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                conditions: z.ZodArray<z.ZodObject<{
                    field: z.ZodString;
                    operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
                    value: z.ZodAny;
                }, "strip", z.ZodTypeAny, {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }, {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }>, "many">;
                operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
                actions: z.ZodArray<z.ZodObject<{
                    type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
                    target: z.ZodString;
                    value: z.ZodOptional<z.ZodAny>;
                }, "strip", z.ZodTypeAny, {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }, {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                id: string;
                operator: "AND" | "OR";
                actions: {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }[];
                conditions: {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }[];
            }, {
                id: string;
                actions: {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }[];
                conditions: {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }[];
                operator?: "AND" | "OR" | undefined;
            }>>;
            metadata: z.ZodOptional<z.ZodObject<{
                gpsRequired: z.ZodOptional<z.ZodBoolean>;
                photoQuality: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
                signatureCertificate: z.ZodOptional<z.ZodBoolean>;
                weatherSource: z.ZodOptional<z.ZodEnum<["noaa", "openweather"]>>;
                units: z.ZodOptional<z.ZodString>;
                calculation: z.ZodOptional<z.ZodString>;
                epaCompliance: z.ZodOptional<z.ZodObject<{
                    regulation: z.ZodString;
                    section: z.ZodString;
                    criticalField: z.ZodDefault<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    section: string;
                    regulation: string;
                    criticalField: boolean;
                }, {
                    section: string;
                    regulation: string;
                    criticalField?: boolean | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                calculation?: string | undefined;
                gpsRequired?: boolean | undefined;
                photoQuality?: "low" | "medium" | "high" | undefined;
                signatureCertificate?: boolean | undefined;
                weatherSource?: "noaa" | "openweather" | undefined;
                units?: string | undefined;
                epaCompliance?: {
                    section: string;
                    regulation: string;
                    criticalField: boolean;
                } | undefined;
            }, {
                calculation?: string | undefined;
                gpsRequired?: boolean | undefined;
                photoQuality?: "low" | "medium" | "high" | undefined;
                signatureCertificate?: boolean | undefined;
                weatherSource?: "noaa" | "openweather" | undefined;
                units?: string | undefined;
                epaCompliance?: {
                    section: string;
                    regulation: string;
                    criticalField?: boolean | undefined;
                } | undefined;
            }>>;
            order: z.ZodDefault<z.ZodNumber>;
            width: z.ZodDefault<z.ZodEnum<["full", "half", "third", "quarter"]>>;
        }, "strip", z.ZodTypeAny, {
            order: number;
            width: "full" | "half" | "third" | "quarter";
            name: string;
            id: string;
            type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
            label: string;
            metadata?: {
                calculation?: string | undefined;
                gpsRequired?: boolean | undefined;
                photoQuality?: "low" | "medium" | "high" | undefined;
                signatureCertificate?: boolean | undefined;
                weatherSource?: "noaa" | "openweather" | undefined;
                units?: string | undefined;
                epaCompliance?: {
                    section: string;
                    regulation: string;
                    criticalField: boolean;
                } | undefined;
            } | undefined;
            description?: string | undefined;
            defaultValue?: any;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            validation?: {
                required: boolean;
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
                minLength?: number | undefined;
                step?: number | undefined;
                maxLength?: number | undefined;
                minDate?: string | undefined;
                maxDate?: string | undefined;
                customValidation?: string | undefined;
            } | undefined;
            conditional?: {
                id: string;
                operator: "AND" | "OR";
                actions: {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }[];
                conditions: {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }[];
            } | undefined;
        }, {
            name: string;
            id: string;
            type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
            label: string;
            order?: number | undefined;
            width?: "full" | "half" | "third" | "quarter" | undefined;
            metadata?: {
                calculation?: string | undefined;
                gpsRequired?: boolean | undefined;
                photoQuality?: "low" | "medium" | "high" | undefined;
                signatureCertificate?: boolean | undefined;
                weatherSource?: "noaa" | "openweather" | undefined;
                units?: string | undefined;
                epaCompliance?: {
                    section: string;
                    regulation: string;
                    criticalField?: boolean | undefined;
                } | undefined;
            } | undefined;
            description?: string | undefined;
            defaultValue?: any;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
                minLength?: number | undefined;
                step?: number | undefined;
                required?: boolean | undefined;
                maxLength?: number | undefined;
                minDate?: string | undefined;
                maxDate?: string | undefined;
                customValidation?: string | undefined;
            } | undefined;
            conditional?: {
                id: string;
                actions: {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }[];
                conditions: {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }[];
                operator?: "AND" | "OR" | undefined;
            } | undefined;
        }>, "many">;
        logic: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            conditions: z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                operator: z.ZodEnum<["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]>;
                value: z.ZodAny;
            }, "strip", z.ZodTypeAny, {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }, {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }>, "many">;
            operator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
            actions: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["show", "hide", "enable", "disable", "require", "set_value", "trigger_calculation"]>;
                target: z.ZodString;
                value: z.ZodOptional<z.ZodAny>;
            }, "strip", z.ZodTypeAny, {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }, {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            id: string;
            operator: "AND" | "OR";
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
        }, {
            id: string;
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
            operator?: "AND" | "OR" | undefined;
        }>, "many">;
        calculations: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            formula: z.ZodString;
            targetField: z.ZodString;
            dependencies: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            formula: string;
            targetField: string;
            dependencies: string[];
        }, {
            name: string;
            id: string;
            formula: string;
            targetField: string;
            dependencies: string[];
        }>, "many">;
        compliance: z.ZodOptional<z.ZodObject<{
            regulation: z.ZodString;
            deadline: z.ZodString;
            authority: z.ZodString;
            retention: z.ZodObject<{
                years: z.ZodNumber;
                archival: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                years: number;
                archival: boolean;
            }, {
                years: number;
                archival: boolean;
            }>;
            criticalThresholds: z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                value: z.ZodAny;
                message: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                message: string;
                field: string;
                value?: any;
            }, {
                message: string;
                field: string;
                value?: any;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            regulation: string;
            deadline: string;
            authority: string;
            retention: {
                years: number;
                archival: boolean;
            };
            criticalThresholds: {
                message: string;
                field: string;
                value?: any;
            }[];
        }, {
            regulation: string;
            deadline: string;
            authority: string;
            retention: {
                years: number;
                archival: boolean;
            };
            criticalThresholds: {
                message: string;
                field: string;
                value?: any;
            }[];
        }>>;
        workflow: z.ZodOptional<z.ZodObject<{
            stages: z.ZodArray<z.ZodString, "many">;
            approvalRequired: z.ZodDefault<z.ZodBoolean>;
            notifications: z.ZodArray<z.ZodObject<{
                trigger: z.ZodString;
                recipients: z.ZodArray<z.ZodString, "many">;
                template: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                template: string;
                trigger: string;
                recipients: string[];
            }, {
                template: string;
                trigger: string;
                recipients: string[];
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            notifications: {
                template: string;
                trigger: string;
                recipients: string[];
            }[];
            stages: string[];
            approvalRequired: boolean;
        }, {
            notifications: {
                template: string;
                trigger: string;
                recipients: string[];
            }[];
            stages: string[];
            approvalRequired?: boolean | undefined;
        }>>;
        styling: z.ZodOptional<z.ZodObject<{
            theme: z.ZodDefault<z.ZodEnum<["construction", "minimal", "branded"]>>;
            colors: z.ZodOptional<z.ZodObject<{
                primary: z.ZodString;
                secondary: z.ZodString;
                accent: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                primary: string;
                secondary: string;
                accent: string;
            }, {
                primary: string;
                secondary: string;
                accent: string;
            }>>;
            layout: z.ZodDefault<z.ZodEnum<["single-column", "two-column", "adaptive"]>>;
            mobileOptimized: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            theme: "construction" | "minimal" | "branded";
            layout: "single-column" | "two-column" | "adaptive";
            mobileOptimized: boolean;
            colors?: {
                primary: string;
                secondary: string;
                accent: string;
            } | undefined;
        }, {
            theme?: "construction" | "minimal" | "branded" | undefined;
            colors?: {
                primary: string;
                secondary: string;
                accent: string;
            } | undefined;
            layout?: "single-column" | "two-column" | "adaptive" | undefined;
            mobileOptimized?: boolean | undefined;
        }>>;
        createdBy: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        version: number;
        isActive: boolean;
        orgId: string;
        createdAt: Date;
        createdBy: string;
        category: "EPA_SWPPP" | "EPA_CGP" | "OSHA_SAFETY" | "STATE_PERMIT" | "CUSTOM";
        fields: {
            order: number;
            width: "full" | "half" | "third" | "quarter";
            name: string;
            id: string;
            type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
            label: string;
            metadata?: {
                calculation?: string | undefined;
                gpsRequired?: boolean | undefined;
                photoQuality?: "low" | "medium" | "high" | undefined;
                signatureCertificate?: boolean | undefined;
                weatherSource?: "noaa" | "openweather" | undefined;
                units?: string | undefined;
                epaCompliance?: {
                    section: string;
                    regulation: string;
                    criticalField: boolean;
                } | undefined;
            } | undefined;
            description?: string | undefined;
            defaultValue?: any;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            validation?: {
                required: boolean;
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
                minLength?: number | undefined;
                step?: number | undefined;
                maxLength?: number | undefined;
                minDate?: string | undefined;
                maxDate?: string | undefined;
                customValidation?: string | undefined;
            } | undefined;
            conditional?: {
                id: string;
                operator: "AND" | "OR";
                actions: {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }[];
                conditions: {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }[];
            } | undefined;
        }[];
        logic: {
            id: string;
            operator: "AND" | "OR";
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
        }[];
        calculations: {
            name: string;
            id: string;
            formula: string;
            targetField: string;
            dependencies: string[];
        }[];
        updatedAt: Date;
        description?: string | undefined;
        compliance?: {
            regulation: string;
            deadline: string;
            authority: string;
            retention: {
                years: number;
                archival: boolean;
            };
            criticalThresholds: {
                message: string;
                field: string;
                value?: any;
            }[];
        } | undefined;
        workflow?: {
            notifications: {
                template: string;
                trigger: string;
                recipients: string[];
            }[];
            stages: string[];
            approvalRequired: boolean;
        } | undefined;
        styling?: {
            theme: "construction" | "minimal" | "branded";
            layout: "single-column" | "two-column" | "adaptive";
            mobileOptimized: boolean;
            colors?: {
                primary: string;
                secondary: string;
                accent: string;
            } | undefined;
        } | undefined;
    }, {
        name: string;
        id: string;
        orgId: string;
        createdAt: Date;
        createdBy: string;
        category: "EPA_SWPPP" | "EPA_CGP" | "OSHA_SAFETY" | "STATE_PERMIT" | "CUSTOM";
        fields: {
            name: string;
            id: string;
            type: "number" | "text" | "select" | "table" | "textarea" | "time" | "date" | "weather" | "inspector" | "checkbox" | "radio" | "correctiveAction" | "signature" | "multiSelect" | "photo" | "gpsLocation" | "bmpChecklist" | "measurement" | "swpppTrigger" | "violationCode" | "repeater" | "calculation" | "fileUpload";
            label: string;
            order?: number | undefined;
            width?: "full" | "half" | "third" | "quarter" | undefined;
            metadata?: {
                calculation?: string | undefined;
                gpsRequired?: boolean | undefined;
                photoQuality?: "low" | "medium" | "high" | undefined;
                signatureCertificate?: boolean | undefined;
                weatherSource?: "noaa" | "openweather" | undefined;
                units?: string | undefined;
                epaCompliance?: {
                    section: string;
                    regulation: string;
                    criticalField?: boolean | undefined;
                } | undefined;
            } | undefined;
            description?: string | undefined;
            defaultValue?: any;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
                minLength?: number | undefined;
                step?: number | undefined;
                required?: boolean | undefined;
                maxLength?: number | undefined;
                minDate?: string | undefined;
                maxDate?: string | undefined;
                customValidation?: string | undefined;
            } | undefined;
            conditional?: {
                id: string;
                actions: {
                    target: string;
                    type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                    value?: any;
                }[];
                conditions: {
                    operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                    field: string;
                    value?: any;
                }[];
                operator?: "AND" | "OR" | undefined;
            } | undefined;
        }[];
        logic: {
            id: string;
            actions: {
                target: string;
                type: "show" | "hide" | "enable" | "disable" | "require" | "set_value" | "trigger_calculation";
                value?: any;
            }[];
            conditions: {
                operator: "in" | "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "not_in";
                field: string;
                value?: any;
            }[];
            operator?: "AND" | "OR" | undefined;
        }[];
        calculations: {
            name: string;
            id: string;
            formula: string;
            targetField: string;
            dependencies: string[];
        }[];
        updatedAt: Date;
        version?: number | undefined;
        description?: string | undefined;
        isActive?: boolean | undefined;
        compliance?: {
            regulation: string;
            deadline: string;
            authority: string;
            retention: {
                years: number;
                archival: boolean;
            };
            criticalThresholds: {
                message: string;
                field: string;
                value?: any;
            }[];
        } | undefined;
        workflow?: {
            notifications: {
                template: string;
                trigger: string;
                recipients: string[];
            }[];
            stages: string[];
            approvalRequired?: boolean | undefined;
        } | undefined;
        styling?: {
            theme?: "construction" | "minimal" | "branded" | undefined;
            colors?: {
                primary: string;
                secondary: string;
                accent: string;
            } | undefined;
            layout?: "single-column" | "two-column" | "adaptive" | undefined;
            mobileOptimized?: boolean | undefined;
        } | undefined;
    }>;
    FormSubmissionSchema: z.ZodObject<{
        id: z.ZodString;
        orgId: z.ZodString;
        templateId: z.ZodString;
        templateVersion: z.ZodNumber;
        inspectionId: z.ZodOptional<z.ZodString>;
        projectId: z.ZodOptional<z.ZodString>;
        submittedBy: z.ZodString;
        status: z.ZodEnum<["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"]>;
        data: z.ZodRecord<z.ZodString, z.ZodAny>;
        metadata: z.ZodObject<{
            formId: z.ZodString;
            formVersion: z.ZodNumber;
            submittedAt: z.ZodDate;
            submittedBy: z.ZodString;
            gpsLocation: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
                accuracy: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                latitude: number;
                longitude: number;
                accuracy: number;
            }, {
                latitude: number;
                longitude: number;
                accuracy: number;
            }>>;
            offline: z.ZodDefault<z.ZodBoolean>;
            deviceInfo: z.ZodOptional<z.ZodObject<{
                userAgent: z.ZodString;
                platform: z.ZodString;
                version: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                version: string;
                userAgent: string;
                platform: string;
            }, {
                version: string;
                userAgent: string;
                platform: string;
            }>>;
            completionTime: z.ZodOptional<z.ZodNumber>;
            validationErrors: z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                message: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                message: string;
                field: string;
            }, {
                message: string;
                field: string;
            }>, "many">;
            complianceChecks: z.ZodArray<z.ZodObject<{
                rule: z.ZodString;
                passed: z.ZodBoolean;
                message: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                rule: string;
                passed: boolean;
                message?: string | undefined;
            }, {
                rule: string;
                passed: boolean;
                message?: string | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            submittedBy: string;
            formId: string;
            formVersion: number;
            submittedAt: Date;
            offline: boolean;
            validationErrors: {
                message: string;
                field: string;
            }[];
            complianceChecks: {
                rule: string;
                passed: boolean;
                message?: string | undefined;
            }[];
            gpsLocation?: {
                latitude: number;
                longitude: number;
                accuracy: number;
            } | undefined;
            deviceInfo?: {
                version: string;
                userAgent: string;
                platform: string;
            } | undefined;
            completionTime?: number | undefined;
        }, {
            submittedBy: string;
            formId: string;
            formVersion: number;
            submittedAt: Date;
            validationErrors: {
                message: string;
                field: string;
            }[];
            complianceChecks: {
                rule: string;
                passed: boolean;
                message?: string | undefined;
            }[];
            gpsLocation?: {
                latitude: number;
                longitude: number;
                accuracy: number;
            } | undefined;
            offline?: boolean | undefined;
            deviceInfo?: {
                version: string;
                userAgent: string;
                platform: string;
            } | undefined;
            completionTime?: number | undefined;
        }>;
        offlineCreated: z.ZodDefault<z.ZodBoolean>;
        submittedAt: z.ZodOptional<z.ZodDate>;
        reviewedBy: z.ZodOptional<z.ZodString>;
        reviewedAt: z.ZodOptional<z.ZodDate>;
        reviewNotes: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        data: Record<string, any>;
        id: string;
        metadata: {
            submittedBy: string;
            formId: string;
            formVersion: number;
            submittedAt: Date;
            offline: boolean;
            validationErrors: {
                message: string;
                field: string;
            }[];
            complianceChecks: {
                rule: string;
                passed: boolean;
                message?: string | undefined;
            }[];
            gpsLocation?: {
                latitude: number;
                longitude: number;
                accuracy: number;
            } | undefined;
            deviceInfo?: {
                version: string;
                userAgent: string;
                platform: string;
            } | undefined;
            completionTime?: number | undefined;
        };
        status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";
        submittedBy: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        templateId: string;
        templateVersion: number;
        offlineCreated: boolean;
        projectId?: string | undefined;
        inspectionId?: string | undefined;
        submittedAt?: Date | undefined;
        reviewedBy?: string | undefined;
        reviewedAt?: Date | undefined;
        reviewNotes?: string | undefined;
    }, {
        data: Record<string, any>;
        id: string;
        metadata: {
            submittedBy: string;
            formId: string;
            formVersion: number;
            submittedAt: Date;
            validationErrors: {
                message: string;
                field: string;
            }[];
            complianceChecks: {
                rule: string;
                passed: boolean;
                message?: string | undefined;
            }[];
            gpsLocation?: {
                latitude: number;
                longitude: number;
                accuracy: number;
            } | undefined;
            offline?: boolean | undefined;
            deviceInfo?: {
                version: string;
                userAgent: string;
                platform: string;
            } | undefined;
            completionTime?: number | undefined;
        };
        status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";
        submittedBy: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        templateId: string;
        templateVersion: number;
        projectId?: string | undefined;
        inspectionId?: string | undefined;
        submittedAt?: Date | undefined;
        offlineCreated?: boolean | undefined;
        reviewedBy?: string | undefined;
        reviewedAt?: Date | undefined;
        reviewNotes?: string | undefined;
    }>;
};
//# sourceMappingURL=index.d.ts.map