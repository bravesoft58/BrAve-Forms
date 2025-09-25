import { 
  Resolver, 
  Query, 
  Args, 
  ObjectType, 
  Field, 
  Float, 
  ID, 
  registerEnumType,
  Subscription
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { WeatherService } from './weather.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WeatherSource } from '@prisma/client';

registerEnumType(WeatherSource, {
  name: 'WeatherSource',
});

@ObjectType()
export class PrecipitationCheckResult {
  @Field(() => Boolean)
  exceeded: boolean;

  @Field(() => Float)
  amount: number;

  @Field(() => Boolean)
  requiresInspection: boolean;

  @Field(() => String)
  source: string;

  @Field(() => String)
  confidence: string;

  @Field(() => String, { nullable: true })
  timestamp?: string;
}

@ObjectType()
export class WeatherEvent {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field(() => Float)
  precipitationInches: number;

  @Field()
  eventDate: Date;

  @Field()
  inspectionDeadline: Date;

  @Field(() => Boolean)
  inspectionCompleted: boolean;

  @Field(() => WeatherSource)
  source: WeatherSource;

  @Field(() => Boolean)
  notificationsSent: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class WeatherAlert {
  @Field(() => ID)
  projectId: string;

  @Field(() => String)
  projectName: string;

  @Field(() => Float)
  precipitationAmount: number;

  @Field(() => String)
  alertType: string;

  @Field(() => Date)
  timestamp: Date;

  @Field(() => String)
  source: string;

  @Field(() => String)
  message: string;
}

@Resolver()
@UseGuards(ClerkAuthGuard)
export class WeatherResolver {
  private pubSub = new PubSub();

  constructor(private readonly weatherService: WeatherService) {}

  @Query(() => PrecipitationCheckResult, {
    name: 'checkProjectWeather',
    description: 'Check if project location has exceeded EPA 0.25 inch threshold'
  })
  async checkProjectWeather(
    @Args('projectId') projectId: string,
    @Args('latitude', { type: () => Float }) latitude: number,
    @Args('longitude', { type: () => Float }) longitude: number,
    @CurrentUser() user: CurrentUser,
  ): Promise<PrecipitationCheckResult> {
    // Multi-tenant validation handled by service
    const result = await this.weatherService.checkPrecipitation(latitude, longitude, projectId);
    
    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Query(() => [WeatherEvent], {
    name: 'recentWeatherEvents',
    description: 'Get recent weather events for a project'
  })
  async recentWeatherEvents(
    @Args('projectId') projectId: string,
    @Args('days', { type: () => Float, defaultValue: 7 }) days: number,
    @CurrentUser() user: CurrentUser,
  ): Promise<WeatherEvent[]> {
    return this.weatherService.getRecentWeatherEvents(projectId, days);
  }

  @Query(() => [WeatherEvent], {
    name: 'pendingInspections',
    description: 'Get all pending inspections for the organization'
  })
  async pendingInspections(
    @CurrentUser() user: CurrentUser,
  ): Promise<WeatherEvent[]> {
    return this.weatherService.getPendingInspections(user.orgId);
  }

  @Subscription(() => WeatherAlert, {
    name: 'weatherAlerts',
    description: 'Subscribe to real-time weather alerts for organization projects'
  })
  weatherAlerts(
    @Args('orgId') orgId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    // Multi-tenant security: only subscribe to user's organization
    if (user.orgId !== orgId) {
      throw new Error('Unauthorized: Cannot subscribe to alerts for other organizations');
    }

    return this.pubSub.asyncIterator(`WEATHER_ALERTS_${orgId}`);
  }

  // Method to publish alerts - called by WeatherMonitoringService
  async publishWeatherAlert(orgId: string, alert: WeatherAlert): Promise<void> {
    await this.pubSub.publish(`WEATHER_ALERTS_${orgId}`, {
      weatherAlerts: alert,
    });
  }
}
