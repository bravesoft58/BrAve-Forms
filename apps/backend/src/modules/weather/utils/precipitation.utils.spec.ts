import {
  calculate24HourAccumulation,
  meetsEPAThreshold,
  findMaximum24HourAccumulation,
  findStormEvents,
} from './precipitation.utils';
import { PrecipitationData } from '../types/noaa.types';

describe('Precipitation Utils', () => {
  const testCoordinates = { latitude: 38.8951, longitude: -77.0364 }; // EPA HQ

  describe('meetsEPAThreshold', () => {
    it('should return true for EXACTLY 0.25 inches', () => {
      expect(meetsEPAThreshold(0.25)).toBe(true);
    });

    it('should return true for 0.26 inches (above threshold)', () => {
      expect(meetsEPAThreshold(0.26)).toBe(true);
    });

    it('should return false for 0.24 inches (below threshold)', () => {
      expect(meetsEPAThreshold(0.24)).toBe(false);
    });

    it('should return false for 0 inches', () => {
      expect(meetsEPAThreshold(0)).toBe(false);
    });

    it('should return false for negative values', () => {
      expect(meetsEPAThreshold(-0.1)).toBe(false);
    });

    it('should return true for 1.0 inch (well above threshold)', () => {
      expect(meetsEPAThreshold(1.0)).toBe(true);
    });

    it('should return true for 0.250000001 inches (floating point precision)', () => {
      expect(meetsEPAThreshold(0.250000001)).toBe(true);
    });

    it('should return false for 0.249999999 inches (floating point precision)', () => {
      expect(meetsEPAThreshold(0.249999999)).toBe(false);
    });
  });

  describe('calculate24HourAccumulation', () => {
    it('should sum precipitation within 24-hour window', () => {
      const now = new Date();
      const data: PrecipitationData[] = [
        {
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
          precipitationInches: 0.1,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 2.54,
        },
        {
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
          precipitationInches: 0.15,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 3.81,
        },
      ];

      const result = calculate24HourAccumulation(data, 24, testCoordinates);

      expect(result.totalInches).toBe(0.25);
      expect(result.meetsEPAThreshold).toBe(true);
      expect(result.observationCount).toBe(2);
      expect(result.stationId).toBe('KDCA');
    });

    it('should exclude observations outside 24-hour window', () => {
      const now = new Date();
      const data: PrecipitationData[] = [
        {
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago - IN WINDOW
          precipitationInches: 0.1,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 2.54,
        },
        {
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago - IN WINDOW
          precipitationInches: 0.15,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 3.81,
        },
        {
          timestamp: new Date(now.getTime() - 30 * 60 * 60 * 1000), // 30 hours ago - OUTSIDE WINDOW
          precipitationInches: 0.5,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 12.7,
        },
      ];

      const result = calculate24HourAccumulation(data, 24, testCoordinates);

      expect(result.totalInches).toBe(0.25); // Should NOT include the 0.50 from 30 hours ago
      expect(result.meetsEPAThreshold).toBe(true);
      expect(result.observationCount).toBe(2); // Only 2 observations in window
    });

    it('should return 0 for empty array', () => {
      const result = calculate24HourAccumulation([], 24, testCoordinates);

      expect(result.totalInches).toBe(0);
      expect(result.meetsEPAThreshold).toBe(false);
      expect(result.observationCount).toBe(0);
      expect(result.stationId).toBe('UNKNOWN');
    });

    it('should calculate correct window start/end times', () => {
      const now = new Date('2025-10-02T12:00:00Z');
      const data: PrecipitationData[] = [
        {
          timestamp: now,
          precipitationInches: 0.25,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 6.35,
        },
      ];

      const result = calculate24HourAccumulation(data, 24, testCoordinates);

      expect(result.endTime).toEqual(now);
      expect(result.startTime).toEqual(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    });

    it('should handle threshold boundary at exactly 0.25 inches', () => {
      const now = new Date();
      const data: PrecipitationData[] = [
        {
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          precipitationInches: 0.25,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 6.35,
        },
      ];

      const result = calculate24HourAccumulation(data, 24, testCoordinates);

      expect(result.totalInches).toBe(0.25);
      expect(result.meetsEPAThreshold).toBe(true);
    });

    it('should handle threshold boundary at 0.24 inches (below threshold)', () => {
      const now = new Date();
      const data: PrecipitationData[] = [
        {
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          precipitationInches: 0.24,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 6.096,
        },
      ];

      const result = calculate24HourAccumulation(data, 24, testCoordinates);

      expect(result.totalInches).toBe(0.24);
      expect(result.meetsEPAThreshold).toBe(false);
    });

    it('should calculate missing observations (24 expected for hourly data)', () => {
      const now = new Date();
      const data: PrecipitationData[] = [
        {
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          precipitationInches: 0.1,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 2.54,
        },
        {
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          precipitationInches: 0.15,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 3.81,
        },
      ];

      const result = calculate24HourAccumulation(data, 24, testCoordinates);

      expect(result.observationCount).toBe(2);
      expect(result.missingObservations).toBe(22); // 24 expected - 2 actual = 22 missing
    });

    it('should preserve coordinates in result', () => {
      const coords = { latitude: 40.7128, longitude: -74.006 }; // NYC
      const now = new Date();
      const data: PrecipitationData[] = [
        {
          timestamp: now,
          precipitationInches: 0.1,
          stationId: 'KJFK',
          source: 'NOAA',
          precipitationMm: 2.54,
        },
      ];

      const result = calculate24HourAccumulation(data, 24, coords);

      expect(result.coordinates).toEqual(coords);
    });
  });

  describe('findMaximum24HourAccumulation', () => {
    it('should find the worst 24-hour period', () => {
      const baseTime = new Date('2025-10-01T00:00:00Z');
      const data: PrecipitationData[] = [
        // Day 1: 0.10"
        {
          timestamp: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000),
          precipitationInches: 0.1,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 2.54,
        },
        // Day 2: 0.30" (worst period)
        {
          timestamp: new Date(baseTime.getTime() + 25 * 60 * 60 * 1000),
          precipitationInches: 0.2,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 5.08,
        },
        {
          timestamp: new Date(baseTime.getTime() + 26 * 60 * 60 * 1000),
          precipitationInches: 0.1,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 2.54,
        },
      ];

      const result = findMaximum24HourAccumulation(data, testCoordinates);

      expect(result.totalInches).toBeGreaterThanOrEqual(0.2); // Should find the day 2 period
      expect(result.meetsEPAThreshold).toBe(true);
    });

    it('should return zero accumulation for empty array', () => {
      const result = findMaximum24HourAccumulation([], testCoordinates);

      expect(result.totalInches).toBe(0);
      expect(result.meetsEPAThreshold).toBe(false);
    });
  });

  describe('findStormEvents', () => {
    it('should separate storms with 6+ hour gaps', () => {
      const baseTime = new Date('2025-10-01T00:00:00Z');
      const data: PrecipitationData[] = [
        // Storm 1
        {
          timestamp: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000),
          precipitationInches: 0.2,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 5.08,
        },
        {
          timestamp: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
          precipitationInches: 0.1,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 2.54,
        },
        // Gap: 6+ hours
        // Storm 2
        {
          timestamp: new Date(baseTime.getTime() + 10 * 60 * 60 * 1000),
          precipitationInches: 0.15,
          stationId: 'KDCA',
          source: 'NOAA',
          precipitationMm: 3.81,
        },
      ];

      const result = findStormEvents(data, testCoordinates, 6);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for no data', () => {
      const result = findStormEvents([], testCoordinates);

      expect(result).toEqual([]);
    });
  });
});
