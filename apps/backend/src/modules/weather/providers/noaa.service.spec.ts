import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NOAAService } from './noaa.service';
import { RedisService } from '../../../common/cache/redis.service';
import { of, throwError } from 'rxjs';
import { PrecipitationData } from '../types/noaa.types';

describe('NOAAService - Redis Caching', () => {
  let service: NOAAService;
  let httpService: HttpService;
  let redisService: RedisService;
  let _configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NOAAService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NOAAService>(NOAAService);
    httpService = module.get<HttpService>(HttpService);
    redisService = module.get<RedisService>(RedisService);
    _configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrecipitationObservations - Cache Hit Scenario', () => {
    it('should return cached data when cache hit occurs', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');
      const cacheKey = `noaa:precipitation:${stationId}:${startDate.toISOString()}:${endDate.toISOString()}`;

      const cachedData: PrecipitationData[] = [
        {
          timestamp: new Date('2025-10-02T12:00:00Z'),
          precipitationInches: 0.25,
          stationId: 'KDCA',
          source: 'NOAA',
        },
        {
          timestamp: new Date('2025-10-02T18:00:00Z'),
          precipitationInches: 0.15,
          stationId: 'KDCA',
          source: 'NOAA',
        },
      ];

      // Mock Redis to return cached data (as plain objects with string timestamps)
      const cachedDataSerialized = cachedData.map((item) => ({
        ...item,
        timestamp: item.timestamp.toISOString(), // Simulates JSON serialization
      }));

      jest.spyOn(redisService, 'get').mockResolvedValue(cachedDataSerialized);

      // Act
      const result = await service.getPrecipitationObservations(stationId, startDate, endDate);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(cacheKey);
      expect(redisService.get).toHaveBeenCalledTimes(1);

      // Verify no HTTP calls were made (cache hit)
      expect(httpService.get).not.toHaveBeenCalled();

      // Verify data returned
      expect(result).toHaveLength(2);
      expect(result[0].precipitationInches).toBe(0.25);
      expect(result[1].precipitationInches).toBe(0.15);

      // Verify Date objects were reconstructed
      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[1].timestamp).toBeInstanceOf(Date);
      expect(result[0].timestamp.toISOString()).toBe('2025-10-02T12:00:00.000Z');
    });

    it('should not call Redis set when cache hit occurs', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');

      const cachedData = [
        {
          timestamp: '2025-10-02T12:00:00.000Z',
          precipitationInches: 0.3,
          stationId: 'KDCA',
          source: 'NOAA',
        },
      ];

      jest.spyOn(redisService, 'get').mockResolvedValue(cachedData);

      // Act
      await service.getPrecipitationObservations(stationId, startDate, endDate);

      // Assert
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('getPrecipitationObservations - Cache Miss Scenario', () => {
    it('should fetch from NOAA API and cache data when cache miss occurs', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');
      const cacheKey = `noaa:precipitation:${stationId}:${startDate.toISOString()}:${endDate.toISOString()}`;

      // Mock cache miss
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      // Mock NOAA API response
      const noaaResponse = {
        data: {
          features: [
            {
              properties: {
                timestamp: '2025-10-02T12:00:00Z',
                precipitationLastHour: {
                  value: 6.35, // 0.25 inches in millimeters
                  unitCode: 'wmoUnit:mm',
                },
              },
            },
          ],
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(noaaResponse as any));

      // Act
      const result = await service.getPrecipitationObservations(stationId, startDate, endDate);

      // Assert
      // Verify cache was checked first
      expect(redisService.get).toHaveBeenCalledWith(cacheKey);

      // Verify NOAA API was called
      expect(httpService.get).toHaveBeenCalled();

      // Verify data was cached with 6-hour TTL (21,600 seconds)
      expect(redisService.set).toHaveBeenCalledWith(
        cacheKey,
        expect.any(Array),
        6 * 60 * 60 // 21,600 seconds
      );

      // Verify returned data
      expect(result).toHaveLength(1);
      expect(result[0].precipitationInches).toBe(0.25);
      expect(result[0].stationId).toBe(stationId);
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it('should use 6-hour TTL (21600 seconds) when caching', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');

      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const noaaResponse = {
        data: {
          features: [
            {
              properties: {
                timestamp: '2025-10-02T12:00:00Z',
                precipitationLastHour: {
                  value: 10.0, // millimeters
                  unitCode: 'wmoUnit:mm',
                },
              },
            },
          ],
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(noaaResponse as any));

      // Act
      await service.getPrecipitationObservations(stationId, startDate, endDate);

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        21600 // Exactly 6 hours in seconds
      );
    });
  });

  describe('getPrecipitationObservations - Cache Key Generation', () => {
    it('should generate unique cache keys for different stations', async () => {
      // Arrange
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');

      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const noaaResponse = {
        data: { features: [] },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(noaaResponse as any));

      // Act - Call with different stations
      await service.getPrecipitationObservations('KDCA', startDate, endDate);
      await service.getPrecipitationObservations('KIAD', startDate, endDate);

      // Assert
      expect(redisService.get).toHaveBeenCalledTimes(2);

      const call1 = (redisService.get as jest.Mock).mock.calls[0][0];
      const call2 = (redisService.get as jest.Mock).mock.calls[1][0];

      expect(call1).toContain('KDCA');
      expect(call2).toContain('KIAD');
      expect(call1).not.toBe(call2);
    });

    it('should generate unique cache keys for different date ranges', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate1 = new Date('2025-10-02T00:00:00Z');
      const endDate1 = new Date('2025-10-03T00:00:00Z');
      const startDate2 = new Date('2025-10-03T00:00:00Z');
      const endDate2 = new Date('2025-10-04T00:00:00Z');

      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const noaaResponse = {
        data: { features: [] },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(noaaResponse as any));

      // Act - Call with different date ranges
      await service.getPrecipitationObservations(stationId, startDate1, endDate1);
      await service.getPrecipitationObservations(stationId, startDate2, endDate2);

      // Assert
      expect(redisService.get).toHaveBeenCalledTimes(2);

      const call1 = (redisService.get as jest.Mock).mock.calls[0][0];
      const call2 = (redisService.get as jest.Mock).mock.calls[1][0];

      expect(call1).toContain('2025-10-02T00:00:00.000Z');
      expect(call2).toContain('2025-10-03T00:00:00.000Z');
      expect(call1).not.toBe(call2);
    });

    it('should include stationId and date range in cache key', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');

      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const noaaResponse = {
        data: { features: [] },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(noaaResponse as any));

      // Act
      await service.getPrecipitationObservations(stationId, startDate, endDate);

      // Assert
      const cacheKey = (redisService.get as jest.Mock).mock.calls[0][0];

      expect(cacheKey).toContain('noaa:precipitation');
      expect(cacheKey).toContain(stationId);
      expect(cacheKey).toContain(startDate.toISOString());
      expect(cacheKey).toContain(endDate.toISOString());
    });
  });

  describe('getPrecipitationObservations - Date Reconstruction', () => {
    it('should reconstruct Date objects from cached string timestamps', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');

      const cachedData = [
        {
          timestamp: '2025-10-02T06:00:00.000Z', // String (JSON serialization)
          precipitationInches: 0.1,
          stationId: 'KDCA',
          source: 'NOAA',
        },
        {
          timestamp: '2025-10-02T12:00:00.000Z', // String
          precipitationInches: 0.15,
          stationId: 'KDCA',
          source: 'NOAA',
        },
      ];

      jest.spyOn(redisService, 'get').mockResolvedValue(cachedData);

      // Act
      const result = await service.getPrecipitationObservations(stationId, startDate, endDate);

      // Assert
      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[1].timestamp).toBeInstanceOf(Date);

      // Verify correct date values (UTC hours)
      expect(result[0].timestamp.getUTCHours()).toBe(6);
      expect(result[1].timestamp.getUTCHours()).toBe(12);

      // Verify ISO string representation matches
      expect(result[0].timestamp.toISOString()).toBe('2025-10-02T06:00:00.000Z');
      expect(result[1].timestamp.toISOString()).toBe('2025-10-02T12:00:00.000Z');
    });
  });

  describe('getPrecipitationObservations - Error Handling', () => {
    it('should return empty array and not cache when NOAA API call fails', async () => {
      // Arrange
      const stationId = 'KDCA';
      const startDate = new Date('2025-10-02T00:00:00Z');
      const endDate = new Date('2025-10-03T00:00:00Z');

      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      // Mock NOAA API failure
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('NOAA API unavailable')));

      // Act
      const result = await service.getPrecipitationObservations(stationId, startDate, endDate);

      // Assert
      // Service returns empty array on error (graceful degradation)
      expect(result).toEqual([]);

      // Verify data was NOT cached
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });
});
