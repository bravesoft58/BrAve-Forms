import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherService } from './weather.service';
import { WeatherResolver } from './weather.resolver';
import { WeatherMonitoringService } from './weather-monitoring.service';
import { NOAAService } from './providers/noaa.service';
import { OpenWeatherMapService } from './providers/openweathermap.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    forwardRef(() => NotificationsModule),
  ],
  providers: [
    WeatherService,
    WeatherResolver,
    WeatherMonitoringService,
    NOAAService,
    OpenWeatherMapService,
  ],
  exports: [WeatherService, WeatherMonitoringService, WeatherResolver],
})
export class WeatherModule {}