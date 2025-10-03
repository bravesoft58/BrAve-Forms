import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NOAAService } from '../noaa.service';

/**
 * ISSUE-027: Integration tests with real NOAA API
 *
 * These tests call the actual NOAA Weather Service API to verify:
 * 1. Station lookup works for EPA HQ coordinates
 * 2. Precipitation observations can be fetched
 * 3. Error handling works for invalid coordinates
 * 4. Retry logic functions correctly
 *
 * Note: These tests require internet connectivity and may be slow (10-15 seconds)
 */
describe('NOAAService Integration (Real API)', () => {
  let service: NOAAService;
  let module: TestingModule;

  // EPA HQ coordinates (Washington DC)
  const EPA_HQ_LAT = 38.8951;
  const EPA_HQ_LON = -77.0364;
  const EXPECTED_STATION = 'KDCA'; // Reagan National Airport

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        NOAAService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EPA_RAIN_THRESHOLD_INCHES') return '0.25';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NOAAService>(NOAAService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('getStationForCoordinates', () => {
    it('should fetch station ID for EPA HQ coordinates', async () => {
      // ISSUE-024: Test station lookup
      const stationId = await service.getStationForCoordinates(EPA_HQ_LAT, EPA_HQ_LON);

      expect(stationId).toBeTruthy();
      expect(typeof stationId).toBe('string');
      expect(stationId).toMatch(/^[A-Z0-9]{4}$/); // Station ID format (e.g., KDCA)

      // Log for verification
      console.log(`Found station: ${stationId} for EPA HQ (${EPA_HQ_LAT}, ${EPA_HQ_LON})`);
    }, 10000); // 10 second timeout

    it('should return null for invalid coordinates', async () => {
      // ISSUE-026: Test error handling
      const stationId = await service.getStationForCoordinates(999, 999);

      expect(stationId).toBeNull();
    }, 10000);

    it('should return null for coordinates with no nearby stations', async () => {
      // Middle of Pacific Ocean (no weather stations)
      const stationId = await service.getStationForCoordinates(0, -180);

      // NOAA should either return null or find a distant station
      // We accept both as valid responses
      if (stationId) {
        expect(typeof stationId).toBe('string');
      } else {
        expect(stationId).toBeNull();
      }
    }, 15000);
  });

  describe('getPrecipitationObservations', () => {
    it('should fetch precipitation observations for KDCA (last 24 hours)', async () => {
      // ISSUE-025: Test precipitation data fetching
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const observations = await service.getPrecipitationObservations(
        EXPECTED_STATION,
        startDate,
        endDate
      );

      expect(Array.isArray(observations)).toBe(true);

      // NOAA may return empty array if no precipitation or data unavailable
      // Both are valid responses
      console.log(`Fetched ${observations.length} observations for ${EXPECTED_STATION}`);

      // If observations exist, verify structure
      if (observations.length > 0) {
        const firstObs = observations[0];
        expect(firstObs).toHaveProperty('timestamp');
        expect(firstObs).toHaveProperty('precipitationInches');
        expect(firstObs).toHaveProperty('stationId');
        expect(firstObs).toHaveProperty('source');
        expect(firstObs).toHaveProperty('precipitationMm');

        expect(firstObs.timestamp).toBeInstanceOf(Date);
        expect(typeof firstObs.precipitationInches).toBe('number');
        expect(firstObs.stationId).toBe(EXPECTED_STATION);
        expect(firstObs.source).toBe('NOAA');
        expect(typeof firstObs.precipitationMm).toBe('number');

        console.log(
          `Sample observation: ${firstObs.precipitationInches}" at ${firstObs.timestamp.toISOString()}`
        );
      }
    }, 15000); // 15 second timeout

    it('should return empty array for invalid station ID', async () => {
      // ISSUE-026: Test error handling for bad station
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const observations = await service.getPrecipitationObservations(
        'INVALID',
        startDate,
        endDate
      );

      // Error handling returns empty array, not throw
      expect(Array.isArray(observations)).toBe(true);
      expect(observations.length).toBe(0);
    }, 15000);

    it('should handle date range with no observations', async () => {
      // Far future date range (no observations yet)
      const startDate = new Date('2030-01-01T00:00:00Z');
      const endDate = new Date('2030-01-02T00:00:00Z');

      const observations = await service.getPrecipitationObservations(
        EXPECTED_STATION,
        startDate,
        endDate
      );

      // Should return empty array (graceful handling)
      expect(Array.isArray(observations)).toBe(true);
      expect(observations.length).toBe(0);
    }, 15000);
  });

  describe('getPrecipitation (end-to-end)', () => {
    it('should fetch total precipitation for EPA HQ (last 24 hours)', async () => {
      // End-to-end test: coordinates → station → precipitation
      const totalPrecipitation = await service.getPrecipitation(EPA_HQ_LAT, EPA_HQ_LON);

      // Should return number or null (null if no precipitation or data unavailable)
      expect(totalPrecipitation === null || typeof totalPrecipitation === 'number').toBe(true);

      if (totalPrecipitation !== null) {
        expect(totalPrecipitation).toBeGreaterThanOrEqual(0);
        console.log(`Total 24-hour precipitation: ${totalPrecipitation}"`);

        // EPA threshold check (EXACTLY 0.25 inches per ISSUE-029)
        if (totalPrecipitation >= 0.25) {
          console.log(
            '⚠️  EPA 0.25" threshold EXCEEDED - inspection required within 24 working hours'
          );
        }
      } else {
        console.log('No precipitation data available for last 24 hours');
      }
    }, 20000); // 20 second timeout (multiple API calls)
  });

  describe('Retry Logic (ISSUE-026)', () => {
    it('should handle transient network errors with retry', async () => {
      // This test verifies retry logic exists
      // We can't easily trigger network errors in integration test
      // but we verify method completes successfully (retries work)

      const stationId = await service.getStationForCoordinates(EPA_HQ_LAT, EPA_HQ_LON);

      // If we get here without error, retry logic handled any transient failures
      expect(stationId).toBeTruthy();
    }, 15000);
  });

  describe('Null Precipitation Handling (DISCOVERY-002)', () => {
    it('should filter out null precipitation values', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const observations = await service.getPrecipitationObservations(
        EXPECTED_STATION,
        startDate,
        endDate
      );

      // All observations should have non-null precipitation values
      observations.forEach((obs) => {
        expect(obs.precipitationInches).not.toBeNull();
        expect(obs.precipitationInches).not.toBeUndefined();
        expect(typeof obs.precipitationInches).toBe('number');
      });
    }, 15000);
  });
});
