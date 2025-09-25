// EPA/OSHA Compliance Rules Engine for BrAve Forms
// Ensures construction sites meet regulatory requirements

import dayjs from 'dayjs';
import { 
  EPA_RAIN_THRESHOLD_INCHES, 
  EPA_INSPECTION_DEADLINE_HOURS,
  type WeatherEvent,
  type SwpppInspection,
  type ComplianceValidation 
} from '@brave-forms/types';

/**
 * EPA SWPPP Compliance Rules
 * Based on EPA Construction General Permit (CGP) 2022
 */
export class EpaComplianceEngine {
  /**
   * Check if a weather event requires EPA inspection
   * CRITICAL: Must be EXACTLY 0.25 inches, not approximated
   */
  static requiresRainEventInspection(precipitationInches: number): boolean {
    // EPA CGP Part 4.2 - Inspection required for 0.25" or greater
    return precipitationInches >= EPA_RAIN_THRESHOLD_INCHES;
  }

  /**
   * Calculate inspection deadline based on weather event
   * Accounts for working hours only
   */
  static calculateInspectionDeadline(
    eventDate: Date,
    workingHours: { start: number; end: number } = { start: 7, end: 17 }
  ): Date {
    let deadline = dayjs(eventDate).add(EPA_INSPECTION_DEADLINE_HOURS, 'hours');
    
    // Adjust for working hours
    const deadlineHour = deadline.hour();
    if (deadlineHour < workingHours.start) {
      deadline = deadline.hour(workingHours.start).minute(0);
    } else if (deadlineHour >= workingHours.end) {
      // Move to next working day
      deadline = deadline.add(1, 'day').hour(workingHours.start).minute(0);
    }
    
    // Skip weekends
    if (deadline.day() === 0) { // Sunday
      deadline = deadline.add(1, 'day');
    } else if (deadline.day() === 6) { // Saturday
      deadline = deadline.add(2, 'days');
    }
    
    return deadline.toDate();
  }

  /**
   * Validate SWPPP inspection completeness
   */
  static validateInspection(inspection: SwpppInspection): ComplianceValidation {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Required BMP checks
    if (!inspection.bmps || inspection.bmps.length === 0) {
      violations.push('No BMPs documented - EPA requires all BMPs to be inspected');
    } else {
      const nonFunctionalBmps = inspection.bmps.filter(bmp => !bmp.functional);
      if (nonFunctionalBmps.length > 0) {
        violations.push(`${nonFunctionalBmps.length} non-functional BMPs require immediate corrective action`);
      }

      const maintenanceRequired = inspection.bmps.filter(bmp => bmp.maintenanceRequired);
      if (maintenanceRequired.length > 0) {
        warnings.push(`${maintenanceRequired.length} BMPs require maintenance within 7 days`);
      }
    }

    // Discharge point checks
    if (!inspection.dischargePoints || inspection.dischargePoints.length === 0) {
      violations.push('Discharge points must be inspected per EPA CGP Part 4.1');
    } else {
      const turbidDischarges = inspection.dischargePoints.filter(
        dp => dp.hasDischarge && (dp.turbidity === 'TURBID' || dp.turbidity === 'VERY_TURBID')
      );
      if (turbidDischarges.length > 0) {
        violations.push(`${turbidDischarges.length} discharge points show potential violations`);
      }
    }

    // Check for critical violations
    const criticalViolations = inspection.violations.filter(v => v.severity === 'CRITICAL');
    if (criticalViolations.length > 0) {
      violations.push(`${criticalViolations.length} CRITICAL violations require immediate action`);
    }

    // Weather-triggered inspection timeliness
    if (inspection.weatherTriggered) {
      if (!inspection.precipitationInches) {
        warnings.push('Weather-triggered inspection missing precipitation amount');
      } else if (inspection.precipitationInches < EPA_RAIN_THRESHOLD_INCHES) {
        warnings.push(`Precipitation ${inspection.precipitationInches}" below EPA trigger threshold`);
      }
    }

    // Recommendations
    if (inspection.violations.length > 0 && inspection.violations.every(v => !v.correctiveAction)) {
      recommendations.push('Document corrective actions for all violations');
    }

    if (!inspection.additionalNotes) {
      recommendations.push('Consider adding site-specific observations in notes');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      recommendations
    };
  }

  /**
   * Check if inspection was completed on time
   */
  static isInspectionTimely(
    weatherEvent: WeatherEvent,
    inspectionDate: Date
  ): boolean {
    return dayjs(inspectionDate).isBefore(weatherEvent.inspectionDeadline) ||
           dayjs(inspectionDate).isSame(weatherEvent.inspectionDeadline);
  }

  /**
   * Calculate potential EPA fines for violations
   */
  static calculatePotentialFines(violations: string[]): {
    minFine: number;
    maxFine: number;
    dailyFine: number;
  } {
    // EPA can impose fines of $25,000 - $50,000 per day per violation
    const BASE_MIN_FINE = 25000;
    const BASE_MAX_FINE = 50000;
    
    return {
      minFine: violations.length * BASE_MIN_FINE,
      maxFine: violations.length * BASE_MAX_FINE,
      dailyFine: violations.length * BASE_MIN_FINE // Minimum daily fine
    };
  }
}

/**
 * OSHA Safety Compliance Rules
 * Based on OSHA Construction Standards (29 CFR 1926)
 */
export class OshaComplianceEngine {
  /**
   * Validate safety inspection requirements
   */
  static validateSafetyInspection(data: any): ComplianceValidation {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for required safety elements
    if (!data.competentPerson) {
      violations.push('OSHA requires designation of competent person (29 CFR 1926.32(f))');
    }

    if (!data.hazardAssessment) {
      violations.push('Hazard assessment required before work begins');
    }

    if (!data.fallProtection && data.workHeight > 6) {
      violations.push('Fall protection required for work above 6 feet (29 CFR 1926.501)');
    }

    if (!data.excavationInspection && data.hasExcavation) {
      violations.push('Daily excavation inspections required (29 CFR 1926.651)');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      recommendations
    };
  }
}

/**
 * State-specific compliance rules
 */
export class StateComplianceEngine {
  static validateStateRequirements(
    state: string,
    inspection: SwpppInspection
  ): ComplianceValidation {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // State-specific rules (examples)
    switch (state.toUpperCase()) {
      case 'CA':
        // California-specific requirements
        if (!inspection.formData || !(inspection.formData as any).casqaCompliant) {
          warnings.push('California CASQA compliance documentation recommended');
        }
        break;
      
      case 'TX':
        // Texas-specific requirements
        if (inspection.bmps.length < 5) {
          warnings.push('Texas TCEQ typically requires minimum 5 BMPs for construction sites');
        }
        break;
      
      case 'FL':
        // Florida-specific requirements
        if (!inspection.formData || !(inspection.formData as any).npdesPermit) {
          violations.push('Florida requires NPDES permit documentation');
        }
        break;
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      recommendations
    };
  }
}

// Export all compliance engines
export default {
  EpaComplianceEngine,
  OshaComplianceEngine,  
  StateComplianceEngine
};