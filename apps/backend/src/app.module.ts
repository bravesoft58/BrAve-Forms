import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { FormsModule } from './modules/forms/forms.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { WeatherModule } from './modules/weather/weather.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { QueueModule } from './modules/queue/queue.module';
import { StorageModule } from './modules/storage/storage.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '../../.env.local'),
        join(process.cwd(), '../../.env'),
        '.env.local', 
        '.env'
      ],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      context: ({ req }) => ({ req }),
      formatError: (error) => {
        const graphQLFormattedError = {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          timestamp: new Date().toISOString(),
        };
        return graphQLFormattedError;
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    FormsModule,
    InspectionsModule,
    WeatherModule,
    ComplianceModule,
    NotificationsModule,
    ReportsModule,
    QueueModule,
    StorageModule,
    HealthModule,
    OrganizationsModule,
    WebhooksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}