import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OpenWeatherMapService {
  private readonly logger = new Logger(OpenWeatherMapService.name);
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY', '');
  }

  async getPrecipitation(latitude: number, longitude: number): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/onecall`, {
          params: {
            lat: latitude,
            lon: longitude,
            exclude: 'minutely,alerts',
            appid: this.apiKey,
            units: 'imperial',
          },
        })
      );
      
      const hourlyData = response.data.hourly.slice(0, 24);
      let totalPrecipitation = 0;
      
      for (const hour of hourlyData) {
        if (hour.rain) {
          totalPrecipitation += hour.rain['1h'] * 0.0393701;
        }
        if (hour.snow) {
          totalPrecipitation += hour.snow['1h'] * 0.0393701 * 0.1;
        }
      }
      
      return totalPrecipitation;
    } catch (error) {
      this.logger.error(`Failed to fetch OpenWeatherMap data: ${error.message}`);
      throw error;
    }
  }
}