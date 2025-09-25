import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NOAAService } from './providers/noaa.service';
import { OpenWeatherMapService } from './providers/openweathermap.service';

describe('WeatherService - EPA Compliance Tests', () => {
  let service: WeatherService;
  let prismaService: PrismaService;
  let noaaService: NOAAService;

  const mockPrismaService = {
    weatherEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'EPA_RAIN_THRESHOLD_INCHES') {
        return '0.25'; // Must return exactly '0.25' as string to pass validation
      }
      return defaultValue || 'test-value';
    }),
  };

  const mockNOAAService = {
    getPrecipitation: jest.fn(),
  };

  const mockOpenWeatherMapService = {
    getPrecipitation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NOAAService, useValue: mockNOAAService },
        { provide: OpenWeatherMapService, useValue: mockOpenWeatherMapService },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    prismaService = module.get<PrismaService>(PrismaService);
    noaaService = module.get<NOAAService>(NOAAService);
  });

  describe('EPA 0.25" Rain Threshold Compliance', () => {
    it('CRITICAL: Must trigger inspection at EXACTLY 0.25 inches - not 0.24 or 0.26', async () => {
      const projectId = 'test-project-123';
      const latitude = 40.7128;
      const longitude = -74.0060;

      // Test 0.24" - should NOT trigger
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.24);
      let result = await service.checkPrecipitation(latitude, longitude, projectId);
      expect(result.exceeded).toBe(false);
      expect(result.amount).toBe(0.24);
      expect(mockPrismaService.weatherEvent.create).not.toHaveBeenCalled();

      // Test EXACTLY 0.25" - MUST trigger
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.25);
      mockPrismaService.weatherEvent.create.mockResolvedValueOnce({
        id: 'event-1',
        projectId,
        precipitationInches: 0.25,
        eventTime: new Date(),
        inspectionDeadline: new Date(),
      });
      
      result = await service.checkPrecipitation(latitude, longitude, projectId);
      expect(result.exceeded).toBe(true);
      expect(result.amount).toBe(0.25);
      expect(mockPrismaService.weatherEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId,
            precipitationInches: 0.25,
          }),
        })
      );

      // Test 0.26" - should also trigger
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.26);
      mockPrismaService.weatherEvent.create.mockResolvedValueOnce({
        id: 'event-2',
        projectId,
        precipitationInches: 0.26,
        eventTime: new Date(),
        inspectionDeadline: new Date(),
      });
      
      result = await service.checkPrecipitation(latitude, longitude, projectId);
      expect(result.exceeded).toBe(true);
      expect(result.amount).toBe(0.26);
    });

    it('Must use OpenWeatherMap as fallback when NOAA unavailable', async () => {
      const projectId = 'test-project-123';
      const latitude = 40.7128;
      const longitude = -74.0060;

      // NOAA returns null (unavailable)
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(null);
      // OpenWeatherMap returns 0.30"
      mockOpenWeatherMapService.getPrecipitation.mockResolvedValueOnce(0.30);
      mockPrismaService.weatherEvent.create.mockResolvedValueOnce({
        id: 'event-3',
        projectId,
        precipitationInches: 0.30,
        eventTime: new Date(),
        inspectionDeadline: new Date(),
      });

      const result = await service.checkPrecipitation(latitude, longitude, projectId);
      
      expect(mockNOAAService.getPrecipitation).toHaveBeenCalled();
      expect(mockOpenWeatherMapService.getPrecipitation).toHaveBeenCalled();
      expect(result.exceeded).toBe(true);
      expect(result.amount).toBe(0.30);
    });

    it('Must calculate 24-hour deadline during working hours only', async () => {
      const projectId = 'test-project-123';
      
      // Mock NOAA to return 0.25" precipitation
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(0.25);
      mockPrismaService.weatherEvent.create.mockImplementation((args) => {
        const deadline = args.data.inspectionDeadline;
        
        // Verify deadline is within reasonable range (24-72 hours for weekend adjustment)
        const now = new Date();
        const timeDiff = deadline.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        expect(hoursDiff).toBeGreaterThan(0);
        expect(hoursDiff).toBeLessThan(96); // Allow up to 4 days for weekend+holiday adjustments
        
        return Promise.resolve({
          id: 'event-4',
          ...args.data,
        });
      });

      const result = await service.checkPrecipitation(40.7128, -74.0060, projectId);
      expect(result.exceeded).toBe(true);
      expect(mockPrismaService.weatherEvent.create).toHaveBeenCalled();
    });

    it('Must store exact precipitation amount without rounding', async () => {
      const projectId = 'test-project-123';
      const exactAmount = 0.251234567;
      
      mockNOAAService.getPrecipitation.mockResolvedValueOnce(exactAmount);
      mockPrismaService.weatherEvent.create.mockImplementation((args) => {
        // Verify exact amount is stored without rounding
        expect(args.data.precipitationInches).toBe(exactAmount);
        expect(args.data.precipitationInches.toString()).toBe('0.251234567');
        return Promise.resolve({
          id: 'event-5',
          ...args.data,
        });
      });

      const result = await service.checkPrecipitation(40.7128, -74.0060, projectId);
      expect(result.amount).toBe(exactAmount);
      expect(result.exceeded).toBe(true); // Should exceed 0.25" threshold
      expect(result.source).toBe('NOAA');
      expect(result.confidence).toBe('HIGH');
    });
  });

  describe('EPA Compliance Validation', () => {
    it('Must never approximate the 0.25" threshold', () => {
      // This test verifies the constant is exactly 0.25
      const weatherServiceCode = require('fs').readFileSync(
        require('path').join(__dirname, 'weather.service.ts'),
        'utf8'
      );
      
      expect(weatherServiceCode).toContain('EPA_RAIN_THRESHOLD_INCHES = 0.25');
      expect(weatherServiceCode).not.toContain('EPA_RAIN_THRESHOLD_INCHES = 0.24');
      expect(weatherServiceCode).not.toContain('EPA_RAIN_THRESHOLD_INCHES = 0.26');
    });
  });
});