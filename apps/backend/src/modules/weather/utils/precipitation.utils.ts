import { PrecipitationData, PrecipitationAccumulation } from '../types/noaa.types';

/**
 * Calculate 24-hour rolling window precipitation accumulation
 * Per EPA Construction General Permit (CGP) 2022 Section 4.4
 *
 * EPA requires tracking rainfall within a 24-hour period to determine if
 * the 0.25 inch threshold has been exceeded, triggering inspection requirements.
 *
 * @param data - Array of precipitation observations from weather stations
 * @param windowHours - Accumulation window in hours (default: 24 per EPA CGP)
 * @param coordinates - Location coordinates for the accumulation
 * @returns PrecipitationAccumulation object with EPA compliance status
 *
 * @example
 * ```typescript
 * const observations = await noaaService.getPrecipitationObservations('KDCA', start, end);
 * const accumulation = calculate24HourAccumulation(observations, 24, { latitude: 38.8951, longitude: -77.0364 });
 *
 * if (accumulation.meetsEPAThreshold) {
 *   console.log(`EPA 0.25" threshold EXCEEDED: ${accumulation.totalInches}" recorded`);
 *   // Schedule inspection within 24 working hours
 * }
 * ```
 *
 * @see https://www.epa.gov/npdes/stormwater-discharges-construction-activities
 */
export function calculate24HourAccumulation(
  data: PrecipitationData[],
  windowHours: number = 24,
  coordinates: { latitude: number; longitude: number }
): PrecipitationAccumulation {
  // Sort by timestamp descending (newest first)
  const sorted = [...data].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Handle empty data
  if (sorted.length === 0) {
    const now = new Date();
    return {
      startTime: new Date(now.getTime() - windowHours * 60 * 60 * 1000),
      endTime: now,
      totalInches: 0,
      observationCount: 0,
      missingObservations: 0,
      meetsEPAThreshold: false,
      observations: [],
      stationId: 'UNKNOWN',
      coordinates,
    };
  }

  // Calculate window start/end times
  const endTime = sorted[0].timestamp;
  const startTime = new Date(endTime.getTime() - windowHours * 60 * 60 * 1000);

  // Filter observations within the 24-hour window
  const observationsInWindow = sorted.filter((reading) => reading.timestamp >= startTime);

  // Calculate total precipitation in inches
  const totalInches = observationsInWindow.reduce(
    (sum, reading) => sum + reading.precipitationInches,
    0
  );

  // EPA CGP 2022 Section 4.4: EXACTLY 0.25 inches (not approximate)
  const EPA_THRESHOLD_INCHES = 0.25;
  const meetsEPAThreshold = totalInches >= EPA_THRESHOLD_INCHES;

  // Estimate missing observations (assume hourly reporting)
  const expectedObservations = windowHours;
  const missingObservations = Math.max(0, expectedObservations - observationsInWindow.length);

  return {
    startTime,
    endTime,
    totalInches,
    observationCount: observationsInWindow.length,
    missingObservations,
    meetsEPAThreshold,
    observations: observationsInWindow,
    stationId: sorted.length > 0 ? sorted[0].stationId : 'UNKNOWN',
    coordinates,
  };
}

/**
 * Find the maximum 24-hour accumulation within a larger dataset
 * Useful for identifying the worst storm event in a multi-day period
 *
 * @param data - Array of precipitation observations
 * @param coordinates - Location coordinates
 * @returns PrecipitationAccumulation for the 24-hour period with highest rainfall
 *
 * @example
 * ```typescript
 * // Get last 7 days of data
 * const weekData = await noaaService.getPrecipitationObservations('KDCA', sevenDaysAgo, now);
 *
 * // Find worst 24-hour period
 * const worstStorm = findMaximum24HourAccumulation(weekData, { latitude: 38.8951, longitude: -77.0364 });
 *
 * if (worstStorm.meetsEPAThreshold) {
 *   console.log(`Worst storm: ${worstStorm.totalInches}" from ${worstStorm.startTime} to ${worstStorm.endTime}`);
 * }
 * ```
 */
export function findMaximum24HourAccumulation(
  data: PrecipitationData[],
  coordinates: { latitude: number; longitude: number }
): PrecipitationAccumulation {
  if (data.length === 0) {
    const now = new Date();
    return {
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endTime: now,
      totalInches: 0,
      observationCount: 0,
      missingObservations: 24,
      meetsEPAThreshold: false,
      observations: [],
      stationId: 'UNKNOWN',
      coordinates,
    };
  }

  // Sort by timestamp ascending (oldest first)
  const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let maxAccumulation: PrecipitationAccumulation | null = null;

  // Slide 24-hour window through dataset
  for (let i = 0; i < sorted.length; i++) {
    const windowStart = sorted[i].timestamp;
    const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

    // Get observations in this 24-hour window
    const windowObservations = sorted.filter(
      (obs) => obs.timestamp >= windowStart && obs.timestamp <= windowEnd
    );

    const totalInches = windowObservations.reduce((sum, obs) => sum + obs.precipitationInches, 0);

    const accumulation: PrecipitationAccumulation = {
      startTime: windowStart,
      endTime: windowEnd,
      totalInches,
      observationCount: windowObservations.length,
      missingObservations: Math.max(0, 24 - windowObservations.length),
      meetsEPAThreshold: totalInches >= 0.25,
      observations: windowObservations,
      stationId: windowObservations[0]?.stationId || 'UNKNOWN',
      coordinates,
    };

    if (!maxAccumulation || accumulation.totalInches > maxAccumulation.totalInches) {
      maxAccumulation = accumulation;
    }
  }

  return maxAccumulation!;
}

/**
 * Check if multiple storm events within a period meet EPA threshold
 * EPA considers multiple storms producing ≥0.25" each as separate inspection triggers
 *
 * @param data - Array of precipitation observations
 * @param coordinates - Location coordinates
 * @returns Array of PrecipitationAccumulation objects for each storm event
 *
 * @example
 * ```typescript
 * const weekData = await noaaService.getPrecipitationObservations('KDCA', sevenDaysAgo, now);
 * const storms = findStormEvents(weekData, { latitude: 38.8951, longitude: -77.0364 });
 *
 * storms.forEach(storm => {
 *   if (storm.meetsEPAThreshold) {
 *     console.log(`Storm event: ${storm.totalInches}" from ${storm.startTime}`);
 *     // Each storm requires separate inspection
 *   }
 * });
 * ```
 */
export function findStormEvents(
  data: PrecipitationData[],
  coordinates: { latitude: number; longitude: number },
  minGapHours: number = 6 // Storms separated by 6+ hours are considered separate events
): PrecipitationAccumulation[] {
  if (data.length === 0) return [];

  // Sort by timestamp ascending (oldest first)
  const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const storms: PrecipitationAccumulation[] = [];
  let currentStorm: PrecipitationData[] = [];
  let lastTimestamp: Date | null = null;

  for (const observation of sorted) {
    // Check if this is part of current storm or a new storm
    if (
      lastTimestamp &&
      observation.timestamp.getTime() - lastTimestamp.getTime() > minGapHours * 60 * 60 * 1000
    ) {
      // Gap too large, finalize current storm
      if (currentStorm.length > 0) {
        const accumulation = calculate24HourAccumulation(currentStorm, 24, coordinates);
        storms.push(accumulation);
      }
      currentStorm = [];
    }

    currentStorm.push(observation);
    lastTimestamp = observation.timestamp;
  }

  // Finalize last storm
  if (currentStorm.length > 0) {
    const accumulation = calculate24HourAccumulation(currentStorm, 24, coordinates);
    storms.push(accumulation);
  }

  return storms;
}

/**
 * Check if precipitation meets EPA CGP 0.25" threshold
 *
 * EPA Construction General Permit (CGP) 2022 Section 4.4 requires stormwater
 * inspections within 24 hours of a storm event producing 0.25 inches or more
 * of precipitation.
 *
 * CRITICAL: This threshold must be EXACTLY 0.25 inches, not 0.24" or 0.26".
 * Approximation can result in regulatory violations and fines of $25,000-$50,000
 * per day per violation.
 *
 * @param totalInches - Total precipitation in inches (from calculate24HourAccumulation)
 * @returns true if precipitation >= 0.25 inches (triggers inspection requirement)
 *
 * @see https://www.epa.gov/npdes/stormwater-cgp (EPA CGP 2022 Section 4.4)
 *
 * @example
 * ```typescript
 * const precipitation = 0.25; // inches
 * const requiresInspection = meetsEPAThreshold(precipitation);
 * console.log(requiresInspection); // true
 *
 * const belowThreshold = 0.24; // inches
 * console.log(meetsEPAThreshold(belowThreshold)); // false
 *
 * const wellAbove = 0.50; // inches
 * console.log(meetsEPAThreshold(wellAbove)); // true
 * ```
 */
export function meetsEPAThreshold(totalInches: number): boolean {
  const EPA_CGP_THRESHOLD_INCHES = 0.25;
  return totalInches >= EPA_CGP_THRESHOLD_INCHES;
}
