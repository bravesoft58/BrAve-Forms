import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NOAAService {
  private readonly logger = new Logger(NOAAService.name);
  private readonly baseUrl = 'https://api.weather.gov';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

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

  private async getStationPrecipitation(stationId: string): Promise<number | null> {
    try {
      // Get last 24 hours of observations
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      
      const observationsUrl = `${this.baseUrl}/stations/${stationId}/observations` +
        `?start=${startTime.toISOString()}&end=${endTime.toISOString()}`;
      
      const response = await firstValueFrom(
        this.httpService.get(observationsUrl)
      );
      
      const observations = response.data.features;
      let totalPrecipitation = 0;
      
      for (const obs of observations) {
        const precipData = obs.properties.precipitationLastHour;
        if (precipData && precipData.value !== null) {
          // Convert from mm to inches (1 mm = 0.0393701 inches)
          const precipInches = precipData.value * 0.0393701;
          totalPrecipitation += precipInches;
        }
      }
      
      return totalPrecipitation;
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
          // Convert from mm to inches
          totalPrecipitation += value.value * 0.0393701;
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