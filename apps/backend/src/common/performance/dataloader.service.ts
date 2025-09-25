import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

/**
 * DataLoader Service for GraphQL Performance Optimization
 * Implements batching and caching for N+1 query prevention
 */
@Injectable()
export class DataLoaderService {
  private readonly logger = new Logger(DataLoaderService.name);
  
  // User loaders
  public readonly userLoader: DataLoader<string, any>;
  public readonly usersByOrgLoader: DataLoader<string, any[]>;
  
  // Project loaders
  public readonly projectLoader: DataLoader<string, any>;
  public readonly projectsByUserLoader: DataLoader<string, any[]>;
  public readonly projectsByOrgLoader: DataLoader<string, any[]>;
  
  // Form loaders
  public readonly formTemplateLoader: DataLoader<string, any>;
  public readonly formSubmissionLoader: DataLoader<string, any>;
  public readonly formSubmissionsByProjectLoader: DataLoader<string, any[]>;
  
  // Weather data loaders
  public readonly weatherDataLoader: DataLoader<string, any>;
  public readonly currentWeatherLoader: DataLoader<string, any>;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    // Initialize all DataLoaders with optimized batch loading
    this.userLoader = this.createUserLoader();
    this.usersByOrgLoader = this.createUsersByOrgLoader();
    this.projectLoader = this.createProjectLoader();
    this.projectsByUserLoader = this.createProjectsByUserLoader();
    this.projectsByOrgLoader = this.createProjectsByOrgLoader();
    this.formTemplateLoader = this.createFormTemplateLoader();
    this.formSubmissionLoader = this.createFormSubmissionLoader();
    this.formSubmissionsByProjectLoader = this.createFormSubmissionsByProjectLoader();
    this.weatherDataLoader = this.createWeatherDataLoader();
    this.currentWeatherLoader = this.createCurrentWeatherLoader();
  }

  /**
   * Create optimized user loader with Redis caching
   */
  private createUserLoader(): DataLoader<string, any> {
    return new DataLoader(
      async (userIds: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          // Check Redis cache first
          const cachedUsers = await this.redis.mget(
            userIds.map(id => `user:${id}`)
          );
          
          const uncachedIds: string[] = [];
          const userMap = new Map();
          
          // Separate cached and uncached users
          userIds.forEach((id, index) => {
            const cached = cachedUsers[index];
            if (cached) {
              userMap.set(id, JSON.parse(cached));
            } else {
              uncachedIds.push(id);
            }
          });
          
          // Fetch uncached users from database
          if (uncachedIds.length > 0) {
            const uncachedUsers = await this.prisma.user.findMany({
              where: { 
                clerkId: { in: uncachedIds }
              },
              select: {
                id: true,
                clerkId: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                organizationId: true,
                createdAt: true,
                updatedAt: true,
              }
            });
            
            // Cache newly fetched users
            const pipeline = this.redis.pipeline();
            uncachedUsers.forEach(user => {
              userMap.set(user.clerkId, user);
              pipeline.setex(
                `user:${user.clerkId}`,
                3600, // 1 hour TTL
                JSON.stringify(user)
              );
            });
            await pipeline.exec();
          }
          
          const duration = performance.now() - startTime;
          this.logger.debug(`User batch load: ${userIds.length} users in ${Math.round(duration)}ms`);
          
          // Return users in requested order
          return userIds.map(id => userMap.get(id) || null);
          
        } catch (error) {
          this.logger.error('Error in user batch loading:', error);
          return userIds.map(() => null);
        }
      },
      {
        cache: true,
        maxBatchSize: 100,
        batchScheduleFn: callback => setTimeout(callback, 10), // 10ms batch window
      }
    );
  }

  /**
   * Create users by organization loader
   */
  private createUsersByOrgLoader(): DataLoader<string, any[]> {
    return new DataLoader(
      async (orgIds: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          const users = await this.prisma.user.findMany({
            where: {
              organizationId: { in: [...orgIds] }
            },
            select: {
              id: true,
              clerkId: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              organizationId: true,
            }
          });
          
          // Group users by organization
          const usersByOrg = new Map<string, any[]>();
          orgIds.forEach(orgId => usersByOrg.set(orgId, []));
          
          users.forEach(user => {
            const orgUsers = usersByOrg.get(user.organizationId) || [];
            orgUsers.push(user);
            usersByOrg.set(user.organizationId, orgUsers);
          });
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Users by org batch load: ${orgIds.length} orgs in ${Math.round(duration)}ms`);
          
          return orgIds.map(orgId => usersByOrg.get(orgId) || []);
          
        } catch (error) {
          this.logger.error('Error in users by org batch loading:', error);
          return orgIds.map(() => []);
        }
      },
      {
        cache: true,
        maxBatchSize: 50,
        batchScheduleFn: callback => setTimeout(callback, 10),
      }
    );
  }

  /**
   * Create optimized project loader with caching
   */
  private createProjectLoader(): DataLoader<string, any> {
    return new DataLoader(
      async (projectIds: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          const projects = await this.prisma.project.findMany({
            where: {
              id: { in: [...projectIds] }
            },
            include: {
              organization: {
                select: { id: true, name: true }
              },
              _count: {
                select: {
                  forms: true,
                  submissions: true
                }
              }
            }
          });
          
          const projectMap = new Map(projects.map(p => [p.id, p]));
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Project batch load: ${projectIds.length} projects in ${Math.round(duration)}ms`);
          
          return projectIds.map(id => projectMap.get(id) || null);
          
        } catch (error) {
          this.logger.error('Error in project batch loading:', error);
          return projectIds.map(() => null);
        }
      },
      {
        cache: true,
        maxBatchSize: 100,
        batchScheduleFn: callback => setTimeout(callback, 10),
      }
    );
  }

  /**
   * Create projects by user loader (for role-based access)
   */
  private createProjectsByUserLoader(): DataLoader<string, any[]> {
    return new DataLoader(
      async (keys: readonly string[]) => {
        // Keys are in format: "userId:orgId:role"
        const startTime = performance.now();
        
        try {
          const results = await Promise.all(
            keys.map(async (key) => {
              const [userId, orgId, role] = key.split(':');
              
              // Build where clause based on user role
              let whereClause: any = { organizationId: orgId };
              
              switch (role) {
                case 'OWNER':
                case 'ADMIN':
                  // Full access to all org projects
                  break;
                case 'MANAGER':
                  // Access to projects they manage
                  whereClause.OR = [
                    { managerId: userId },
                    { members: { some: { userId } } }
                  ];
                  break;
                case 'MEMBER':
                  // Only assigned projects
                  whereClause.members = { some: { userId } };
                  break;
                default:
                  return [];
              }
              
              return await this.prisma.project.findMany({
                where: whereClause,
                include: {
                  _count: {
                    select: { forms: true, submissions: true }
                  }
                },
                orderBy: { updatedAt: 'desc' }
              });
            })
          );
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Projects by user batch load: ${keys.length} queries in ${Math.round(duration)}ms`);
          
          return results;
          
        } catch (error) {
          this.logger.error('Error in projects by user batch loading:', error);
          return keys.map(() => []);
        }
      },
      {
        cache: true,
        maxBatchSize: 20,
        batchScheduleFn: callback => setTimeout(callback, 15),
      }
    );
  }

  /**
   * Create projects by organization loader
   */
  private createProjectsByOrgLoader(): DataLoader<string, any[]> {
    return new DataLoader(
      async (orgIds: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          const projects = await this.prisma.project.findMany({
            where: {
              organizationId: { in: [...orgIds] }
            },
            include: {
              _count: {
                select: { forms: true, submissions: true }
              }
            },
            orderBy: { updatedAt: 'desc' }
          });
          
          // Group projects by organization
          const projectsByOrg = new Map<string, any[]>();
          orgIds.forEach(orgId => projectsByOrg.set(orgId, []));
          
          projects.forEach(project => {
            const orgProjects = projectsByOrg.get(project.organizationId) || [];
            orgProjects.push(project);
            projectsByOrg.set(project.organizationId, orgProjects);
          });
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Projects by org batch load: ${orgIds.length} orgs in ${Math.round(duration)}ms`);
          
          return orgIds.map(orgId => projectsByOrg.get(orgId) || []);
          
        } catch (error) {
          this.logger.error('Error in projects by org batch loading:', error);
          return orgIds.map(() => []);
        }
      },
      {
        cache: true,
        maxBatchSize: 50,
        batchScheduleFn: callback => setTimeout(callback, 10),
      }
    );
  }

  /**
   * Create form template loader with aggressive caching
   */
  private createFormTemplateLoader(): DataLoader<string, any> {
    return new DataLoader(
      async (templateIds: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          // Check Redis cache first (form templates change infrequently)
          const cachedTemplates = await this.redis.mget(
            templateIds.map(id => `form_template:${id}`)
          );
          
          const uncachedIds: string[] = [];
          const templateMap = new Map();
          
          templateIds.forEach((id, index) => {
            const cached = cachedTemplates[index];
            if (cached) {
              templateMap.set(id, JSON.parse(cached));
            } else {
              uncachedIds.push(id);
            }
          });
          
          // Fetch uncached templates
          if (uncachedIds.length > 0) {
            const templates = await this.prisma.formTemplate.findMany({
              where: { id: { in: uncachedIds } },
              include: {
                fields: {
                  orderBy: { order: 'asc' }
                },
                _count: {
                  select: { submissions: true }
                }
              }
            });
            
            // Cache templates for 24 hours (they change infrequently)
            const pipeline = this.redis.pipeline();
            templates.forEach(template => {
              templateMap.set(template.id, template);
              pipeline.setex(
                `form_template:${template.id}`,
                86400, // 24 hours
                JSON.stringify(template)
              );
            });
            await pipeline.exec();
          }
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Form template batch load: ${templateIds.length} templates in ${Math.round(duration)}ms`);
          
          return templateIds.map(id => templateMap.get(id) || null);
          
        } catch (error) {
          this.logger.error('Error in form template batch loading:', error);
          return templateIds.map(() => null);
        }
      },
      {
        cache: true,
        maxBatchSize: 50,
        batchScheduleFn: callback => setTimeout(callback, 5),
      }
    );
  }

  /**
   * Create form submission loader
   */
  private createFormSubmissionLoader(): DataLoader<string, any> {
    return new DataLoader(
      async (submissionIds: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          const submissions = await this.prisma.formSubmission.findMany({
            where: {
              id: { in: [...submissionIds] }
            },
            include: {
              form: {
                select: { id: true, title: true, type: true }
              },
              project: {
                select: { id: true, name: true }
              },
              photos: {
                select: { 
                  id: true, 
                  filename: true, 
                  url: true, 
                  metadata: true 
                }
              }
            }
          });
          
          const submissionMap = new Map(submissions.map(s => [s.id, s]));
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Form submission batch load: ${submissionIds.length} submissions in ${Math.round(duration)}ms`);
          
          return submissionIds.map(id => submissionMap.get(id) || null);
          
        } catch (error) {
          this.logger.error('Error in form submission batch loading:', error);
          return submissionIds.map(() => null);
        }
      },
      {
        cache: true,
        maxBatchSize: 100,
        batchScheduleFn: callback => setTimeout(callback, 10),
      }
    );
  }

  /**
   * Create form submissions by project loader
   */
  private createFormSubmissionsByProjectLoader(): DataLoader<string, any[]> {
    return new DataLoader(
      async (projectIds: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          const submissions = await this.prisma.formSubmission.findMany({
            where: {
              projectId: { in: [...projectIds] }
            },
            include: {
              form: {
                select: { id: true, title: true, type: true }
              },
              photos: {
                select: { 
                  id: true, 
                  filename: true, 
                  url: true 
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to recent submissions for performance
          });
          
          // Group submissions by project
          const submissionsByProject = new Map<string, any[]>();
          projectIds.forEach(projectId => submissionsByProject.set(projectId, []));
          
          submissions.forEach(submission => {
            const projectSubmissions = submissionsByProject.get(submission.projectId) || [];
            projectSubmissions.push(submission);
            submissionsByProject.set(submission.projectId, projectSubmissions);
          });
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Submissions by project batch load: ${projectIds.length} projects in ${Math.round(duration)}ms`);
          
          return projectIds.map(projectId => submissionsByProject.get(projectId) || []);
          
        } catch (error) {
          this.logger.error('Error in submissions by project batch loading:', error);
          return projectIds.map(() => []);
        }
      },
      {
        cache: true,
        maxBatchSize: 25,
        batchScheduleFn: callback => setTimeout(callback, 10),
      }
    );
  }

  /**
   * Create weather data loader with location-based caching
   */
  private createWeatherDataLoader(): DataLoader<string, any> {
    return new DataLoader(
      async (locationKeys: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          // Check Redis cache for weather data (5 minute TTL)
          const cachedWeather = await this.redis.mget(
            locationKeys.map(key => `weather:${key}`)
          );
          
          const uncachedKeys: string[] = [];
          const weatherMap = new Map();
          
          locationKeys.forEach((key, index) => {
            const cached = cachedWeather[index];
            if (cached) {
              weatherMap.set(key, JSON.parse(cached));
            } else {
              uncachedKeys.push(key);
            }
          });
          
          // Fetch uncached weather data
          if (uncachedKeys.length > 0) {
            const weatherRecords = await this.prisma.weatherData.findMany({
              where: {
                locationKey: { in: uncachedKeys },
                timestamp: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              },
              orderBy: { timestamp: 'desc' },
              take: 1000 // Reasonable limit
            });
            
            // Group by location key
            const weatherByLocation = new Map<string, any[]>();
            weatherRecords.forEach(record => {
              const existing = weatherByLocation.get(record.locationKey) || [];
              existing.push(record);
              weatherByLocation.set(record.locationKey, existing);
            });
            
            // Cache weather data for 5 minutes
            const pipeline = this.redis.pipeline();
            uncachedKeys.forEach(key => {
              const weather = weatherByLocation.get(key) || [];
              weatherMap.set(key, weather);
              pipeline.setex(
                `weather:${key}`,
                300, // 5 minutes
                JSON.stringify(weather)
              );
            });
            await pipeline.exec();
          }
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Weather data batch load: ${locationKeys.length} locations in ${Math.round(duration)}ms`);
          
          return locationKeys.map(key => weatherMap.get(key) || []);
          
        } catch (error) {
          this.logger.error('Error in weather data batch loading:', error);
          return locationKeys.map(() => []);
        }
      },
      {
        cache: true,
        maxBatchSize: 20,
        batchScheduleFn: callback => setTimeout(callback, 5),
      }
    );
  }

  /**
   * Create current weather loader for real-time data
   */
  private createCurrentWeatherLoader(): DataLoader<string, any> {
    return new DataLoader(
      async (locationKeys: readonly string[]) => {
        const startTime = performance.now();
        
        try {
          const currentWeather = await this.prisma.weatherData.findMany({
            where: {
              locationKey: { in: [...locationKeys] },
              timestamp: {
                gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
              }
            },
            orderBy: { timestamp: 'desc' },
            distinct: ['locationKey']
          });
          
          const weatherMap = new Map(currentWeather.map(w => [w.locationKey, w]));
          
          const duration = performance.now() - startTime;
          this.logger.debug(`Current weather batch load: ${locationKeys.length} locations in ${Math.round(duration)}ms`);
          
          return locationKeys.map(key => weatherMap.get(key) || null);
          
        } catch (error) {
          this.logger.error('Error in current weather batch loading:', error);
          return locationKeys.map(() => null);
        }
      },
      {
        cache: true,
        maxBatchSize: 10,
        batchScheduleFn: callback => setTimeout(callback, 5),
      }
    );
  }

  /**
   * Clear all caches (useful for testing or cache invalidation)
   */
  async clearAllCaches(): Promise<void> {
    this.userLoader.clearAll();
    this.usersByOrgLoader.clearAll();
    this.projectLoader.clearAll();
    this.projectsByUserLoader.clearAll();
    this.projectsByOrgLoader.clearAll();
    this.formTemplateLoader.clearAll();
    this.formSubmissionLoader.clearAll();
    this.formSubmissionsByProjectLoader.clearAll();
    this.weatherDataLoader.clearAll();
    this.currentWeatherLoader.clearAll();
    
    this.logger.debug('All DataLoader caches cleared');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): Record<string, any> {
    return {
      userLoader: {
        cacheSize: this.userLoader.cache?.size || 0
      },
      projectLoader: {
        cacheSize: this.projectLoader.cache?.size || 0
      },
      formTemplateLoader: {
        cacheSize: this.formTemplateLoader.cache?.size || 0
      },
      weatherDataLoader: {
        cacheSize: this.weatherDataLoader.cache?.size || 0
      }
    };
  }
}