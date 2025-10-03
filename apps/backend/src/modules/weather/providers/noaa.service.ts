import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  NOAAPointResponse,
  NOAAStationListResponse,
  NOAAObservationsResponse,
  PrecipitationData,
} from '../types/noaa.types';
import { RedisService } from '../../../common/cache/redis.service';

@Injectable()
export class NOAAService {
  private readonly logger = new Logger(NOAAService.name);
  private readonly baseUrl = 'https://api.weather.gov';
  private readonly userAgent = '(BrAveFormsApp, contact@braveforms.com)'; // Per NOAA best practices
  private readonly millimetersPerInch = 25.4; // Exact conversion factor
  private readonly cacheTTL = 6 * 60 * 60; // 6 hours in seconds

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {}

  /**
   * Retry HTTP request with exponential backoff
   * ISSUE-026: Error handling with retry logic
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on 4xx errors (client errors)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          this.logger.warn(`Client error ${error.response.status}, not retrying: ${error.message}`);
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delayMs = baseDelayMs * Math.pow(2, attempt);
          this.logger.debug(
            `Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get nearest weather station ID for given GPS coordinates
   * ISSUE-024: Separate method for station lookup (improves testability)
   *
   * @param latitude - Decimal latitude (-90 to 90)
   * @param longitude - Decimal longitude (-180 to 180)
   * @returns Station ID (e.g., "KDCA") or null if no stations found
   */
  async getStationForCoordinates(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Step 1: Get grid point for coordinates with retry
      const pointResponse = await this.retryWithBackoff(() =>
        firstValueFrom(
          this.httpService.get<NOAAPointResponse>(
            `${this.baseUrl}/points/${latitude},${longitude}`,
            {
              headers: {
                'User-Agent': this.userAgent,
              },
            }
          )
        )
      );

      // Check response status (HttpService throws on non-2xx, but explicit check for safety)
      if (!pointResponse.data?.properties?.observationStations) {
        this.logger.error(
          `NOAA API returned invalid point data for coordinates ${latitude}, ${longitude}`
        );
        return null;
      }

      const observationStationsUrl = pointResponse.data.properties.observationStations;

      // Step 2: Get list of nearby stations with retry
      const stationsResponse = await this.retryWithBackoff(() =>
        firstValueFrom(
          this.httpService.get<NOAAStationListResponse>(observationStationsUrl, {
            headers: {
              'User-Agent': this.userAgent,
            },
          })
        )
      );

      const stations = stationsResponse.data.features;

      if (!stations || stations.length === 0) {
        this.logger.warn(
          `No NOAA observation stations found for coordinates: ${latitude}, ${longitude}`
        );
        return null;
      }

      // Return first (closest) station ID
      const stationId = stations[0].properties.stationIdentifier;
      this.logger.debug(`Found station ${stationId} for coordinates ${latitude}, ${longitude}`);
      return stationId;
    } catch (error) {
      const statusCode = error.response?.status || 'unknown';
      const statusText = error.response?.statusText || 'unknown error';
      this.logger.error(
        `Failed to get station for coordinates ${latitude}, ${longitude} ` +
          `(HTTP ${statusCode}: ${statusText}): ${error.message}`
      );
      return null;
    }
  }

  async getPrecipitation(latitude: number, longitude: number): Promise<number | null> {
    try {
      // Get station information for the coordinates
      const pointResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/points/${latitude},${longitude}`)
      );

      const { properties } = pointResponse.data;

      // Get observation stations near the point
      const stationsResponse = await firstValueFrom(
        this.httpService.get(properties.observationStations)
      );

      const stations = stationsResponse.data.features;

      if (!stations || stations.length === 0) {
        this.logger.warn('No NOAA observation stations found for coordinates');
        return null;
      }

      // Try multiple stations to get precipitation data
      for (const station of stations.slice(0, 3)) {
        try {
          const precipAmount = await this.getStationPrecipitation(station.id);
          if (precipAmount !== null) {
            return precipAmount;
          }
        } catch (error) {
          this.logger.debug(`Station ${station.id} failed, trying next station`);
          continue;
        }
      }

      // Fallback to forecast-based estimation if observations unavailable
      return this.getForecastBasedPrecipitation(properties);
    } catch (error) {
      this.logger.error(`Failed to fetch NOAA precipitation data: ${error.message}`);
      return null;
    }
  }

  /**
   * Get precipitation observations for a specific station and date range
   * ISSUE-025: Separate method for fetching observations (returns array, not total)
   *
   * @param stationId - Weather station identifier (e.g., "KDCA")
   * @param startDate - Start of observation period
   * @param endDate - End of observation period
   * @returns Array of precipitation observations with converted units
   */
  async getPrecipitationObservations(
    stationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PrecipitationData[]> {
    // Generate cache key from station and date range
    const cacheKey = `noaa:precipitation:${stationId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    try {
      // 1. Check cache first (ISSUE-033: Redis caching with 6-hour TTL)
      const cached = await this.redisService.get<PrecipitationData[]>(cacheKey);
      if (cached) {
        this.logger.debug(
          `Cache HIT for station ${stationId} (${startDate.toISOString()} to ${endDate.toISOString()})`
        );
        // Reconstruct Date objects (JSON.parse converts them to strings)
        return cached.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }

      this.logger.debug(`Cache MISS for station ${stationId}, fetching from NOAA API`);

      const observationsUrl = `${this.baseUrl}/stations/${stationId}/observations`;
      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });

      // 2. Fetch from NOAA API with retry logic
      const response = await this.retryWithBackoff(() =>
        firstValueFrom(
          this.httpService.get<NOAAObservationsResponse>(`${observationsUrl}?${params}`, {
            headers: {
              'User-Agent': this.userAgent,
            },
          })
        )
      );

      // Validate response structure
      if (!response.data?.features) {
        this.logger.error(`NOAA API returned invalid observations data for station ${stationId}`);
        return [];
      }

      const observations = response.data.features;

      // Convert NOAA observations to PrecipitationData format
      const precipitationData = observations
        .map((obs) => {
          const precipHour = obs.properties.precipitationLastHour;
          const precipMm = precipHour?.value;

          // Skip null precipitation values (common in NOAA data - DISCOVERY-002)
          if (precipMm === null || precipMm === undefined) {
            return null;
          }

          return {
            timestamp: new Date(obs.properties.timestamp),
            precipitationInches: precipMm / this.millimetersPerInch,
            stationId,
            source: 'NOAA' as const,
            precipitationMm: precipMm, // Keep original for auditing
          };
        })
        .filter((data) => data !== null) as PrecipitationData[];

      // 3. Store in cache for 6 hours (ISSUE-033: Redis caching)
      await this.redisService.set(cacheKey, precipitationData, this.cacheTTL);
      this.logger.debug(
        `Cached ${precipitationData.length} observations for station ${stationId} (TTL: ${this.cacheTTL}s)`
      );

      return precipitationData;
    } catch (error) {
      const statusCode = error.response?.status || 'unknown';
      const statusText = error.response?.statusText || 'unknown error';
      const dateRange = `${startDate.toISOString()} to ${endDate.toISOString()}`;
      this.logger.error(
        `Failed to fetch observations for station ${stationId} (${dateRange}) ` +
          `(HTTP ${statusCode}: ${statusText}): ${error.message}`
      );
      return [];
    }
  }

  /**
   * Get total precipitation for a station (24-hour accumulation)
   * Used by existing getPrecipitation method
   */
  private async getStationPrecipitation(stationId: string): Promise<number | null> {
    try {
      // Get last 24 hours of observations
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      // Use the new typed method
      const observations = await this.getPrecipitationObservations(stationId, startTime, endTime);

      // Sum all observations
      const totalPrecipitation = observations.reduce(
        (sum, obs) => sum + obs.precipitationInches,
        0
      );

      return totalPrecipitation > 0 ? totalPrecipitation : null;
    } catch (error) {
      this.logger.debug(`Station precipitation fetch failed: ${error.message}`);
      return null;
    }
  }

  private async getForecastBasedPrecipitation(pointProperties: any): Promise<number | null> {
    try {
      // Use quantitative precipitation forecast as backup
      const { gridId, gridX, gridY } = pointProperties;

      const gridDataResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/gridpoints/${gridId}/${gridX},${gridY}`)
      );

      const qpf = gridDataResponse.data.properties.quantitativePrecipitation;
      if (!qpf || !qpf.values) {
        return this.extractFromForecastText(pointProperties);
      }

      // Sum precipitation values for last 24 hours
      const last24Hours = qpf.values.slice(0, 24);
      let totalPrecipitation = 0;

      for (const value of last24Hours) {
        if (value.value !== null) {
          // Convert from mm to inches using exact conversion
          totalPrecipitation += value.value / this.millimetersPerInch;
        }
      }

      return totalPrecipitation;
    } catch (error) {
      this.logger.debug(`Forecast-based precipitation failed: ${error.message}`);
      return 0; // Return 0 instead of null as final fallback
    }
  }

  private async extractFromForecastText(pointProperties: any): Promise<number> {
    try {
      const { gridId, gridX, gridY } = pointProperties;

      const forecastResponse = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`
        )
      );

      const periods = forecastResponse.data.properties.periods;
      const last24Hours = periods.slice(0, 24);

      let totalPrecipitation = 0;
      for (const period of last24Hours) {
        const precipValue = this.extractPrecipitationValue(period.detailedForecast);
        totalPrecipitation += precipValue;
      }

      return totalPrecipitation;
    } catch (error) {
      this.logger.warn(`All NOAA precipitation methods failed, returning 0`);
      return 0;
    }
  }

  private extractPrecipitationValue(forecast: string): number {
    const precipRegex = /(\d+\.?\d*)\s*inch/i;
    const match = forecast.match(precipRegex);
    return match ? parseFloat(match[1]) : 0;
  }
}
