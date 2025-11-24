import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

    this.setupMultiTenantMiddleware();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  private setupMultiTenantMiddleware() {
    this.$use(async (params, next) => {
      const context = params.args?.[0]?.context;
      // Extract orgId from user object attached by Passport (standard NestJS pattern)
      // Passport attaches validated user to request.user, not request.auth
      const orgId = context?.req?.user?.orgId || context?.orgId;

      if (orgId && this.isMultiTenantModel(params.model)) {
        if (
          params.action === 'findMany' ||
          params.action === 'findFirst' ||
          params.action === 'findUnique'
        ) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          // Only set orgId if not already explicitly provided by the service
          if (!params.args.where.orgId) {
            params.args.where.orgId = orgId;
          }
        }

        if (params.action === 'create' || params.action === 'createMany') {
          params.args = params.args || {};
          if (params.action === 'create') {
            params.args.data = params.args.data || {};
            params.args.data.orgId = orgId; // Fixed: use orgId not organizationId
          } else {
            const data = Array.isArray(params.args.data) ? params.args.data : [params.args.data];
            params.args.data = data.map((item) => ({ ...item, orgId })); // Fixed: use orgId
          }
        }

        if (
          params.action === 'update' ||
          params.action === 'updateMany' ||
          params.action === 'delete' ||
          params.action === 'deleteMany'
        ) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          params.args.where.orgId = orgId; // Fixed: use orgId not organizationId
        }
      }

      return next(params);
    });
  }

  private isMultiTenantModel(model: string | undefined): boolean {
    // Complete list of models that require organization isolation
    const multiTenantModels = [
      'Project',
      'Inspection',
      'Photo',
      'FormTemplate',
      'FormSubmission',
      'UserOrganization', // Include for proper user-org scoping
      // WeatherEvent is tied to projects, inherits org context through project
      // Organization itself is not scoped (it's the tenant boundary)
    ];
    return model ? multiTenantModels.includes(model) : false;
  }
}
