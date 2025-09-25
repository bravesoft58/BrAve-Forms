import { type WeatherEvent, type SwpppInspection, type ComplianceValidation } from '@brave-forms/types';
/**
 * EPA SWPPP Compliance Rules
 * Based on EPA Construction General Permit (CGP) 2022
 */
export declare class EpaComplianceEngine {
    /**
     * Check if a weather event requires EPA inspection
     * CRITICAL: Must be EXACTLY 0.25 inches, not approximated
     */
    static requiresRainEventInspection(precipitationInches: number): boolean;
    /**
     * Calculate inspection deadline based on weather event
     * Accounts for working hours only
     */
    static calculateInspectionDeadline(eventDate: Date, workingHours?: {
        start: number;
        end: number;
    }): Date;
    /**
     * Validate SWPPP inspection completeness
     */
    static validateInspection(inspection: SwpppInspection): ComplianceValidation;
    /**
     * Check if inspection was completed on time
     */
    static isInspectionTimely(weatherEvent: WeatherEvent, inspectionDate: Date): boolean;
    /**
     * Calculate potential EPA fines for violations
     */
    static calculatePotentialFines(violations: string[]): {
        minFine: number;
        maxFine: number;
        dailyFine: number;
    };
}
/**
 * OSHA Safety Compliance Rules
 * Based on OSHA Construction Standards (29 CFR 1926)
 */
export declare class OshaComplianceEngine {
    /**
     * Validate safety inspection requirements
     */
    static validateSafetyInspection(data: any): ComplianceValidation;
}
/**
 * State-specific compliance rules
 */
export declare class StateComplianceEngine {
    static validateStateRequirements(state: string, inspection: SwpppInspection): ComplianceValidation;
}
declare const _default: {
    EpaComplianceEngine: typeof EpaComplianceEngine;
    OshaComplianceEngine: typeof OshaComplianceEngine;
    StateComplianceEngine: typeof StateComplianceEngine;
};
export default _default;
//# sourceMappingURL=index.d.ts.map