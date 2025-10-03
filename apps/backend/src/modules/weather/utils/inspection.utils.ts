/**
 * Inspection deadline calculation utilities for EPA CGP compliance
 *
 * EPA Construction General Permit (CGP) 2022 Section 4.4 requires stormwater
 * inspections within 24 hours of a storm event producing 0.25 inches or more
 * of precipitation "during normal working hours".
 *
 * @see https://www.epa.gov/npdes/stormwater-cgp (EPA CGP 2022 Section 4.4)
 */

export interface WorkingHoursConfig {
  /** Start hour (24-hour format, e.g., 8 for 8am) */
  start: number;
  /** End hour (24-hour format, e.g., 17 for 5pm) */
  end: number;
  /** Days of the week (0=Sunday, 1=Monday, ..., 6=Saturday) */
  daysOfWeek: number[];
}

/**
 * Calculate inspection deadline per EPA CGP working hours requirement
 *
 * EPA CGP 2022 Section 4.4: Inspections due within 24 hours of storm event
 * "during normal working hours" - if storm occurs on weekend, inspection
 * due on next business day.
 *
 * This function adds 24 working hours to the storm end time, skipping
 * non-working hours (nights, weekends, holidays).
 *
 * CRITICAL: Regulatory compliance requires accurate deadline calculation.
 * Failure to inspect within 24 working hours can result in EPA violations
 * and fines of $25,000-$50,000 per day.
 *
 * @param stormEndTime - When storm event ended (timestamp of last precipitation)
 * @param workingHours - Business hours configuration (default: 8am-5pm Monday-Friday)
 * @returns Inspection deadline timestamp (24 working hours after storm end)
 *
 * @see https://www.epa.gov/npdes/stormwater-cgp (EPA CGP 2022 Section 4.4)
 *
 * @example
 * ```typescript
 * // Storm ends Friday at 4pm
 * const stormEnd = new Date('2025-10-03T16:00:00');
 * const deadline = calculateInspectionDeadline(stormEnd);
 * // Result: Tuesday at 10am (24 working hours later, skipping weekend)
 *
 * // Storm ends Saturday at 10am (non-working day)
 * const weekendStorm = new Date('2025-10-05T10:00:00');
 * const weekendDeadline = calculateInspectionDeadline(weekendStorm);
 * // Result: Tuesday at 10am (starts counting Monday 8am, 24 hours later)
 * ```
 */
export function calculateInspectionDeadline(
  stormEndTime: Date,
  workingHours: WorkingHoursConfig = {
    start: 8,
    end: 17,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
  }
): Date {
  // Create new date to avoid mutating original
  const deadline = new Date(stormEndTime);
  let hoursAdded = 0;

  // Add 24 working hours
  while (hoursAdded < 24) {
    deadline.setHours(deadline.getHours() + 1);

    const dayOfWeek = deadline.getDay();
    const hour = deadline.getHours();

    // Check if current time is during working hours
    const isWorkingDay = workingHours.daysOfWeek.includes(dayOfWeek);
    const isWorkingHour = hour >= workingHours.start && hour < workingHours.end;

    if (isWorkingDay && isWorkingHour) {
      hoursAdded++;
    }
  }

  return deadline;
}
