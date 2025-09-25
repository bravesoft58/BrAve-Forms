import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

/**
 * Redis Service for High-Performance Caching
 * Optimized for construction site data patterns and 30-day offline capability
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;
  private clusterMode = false;
  
  // Performance metrics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalRequests: 0
  };

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6381');
    const clusterNodes = this.configService.get<string>('REDIS_CLUSTER_NODES');
    
    const baseOptions: RedisOptions = {
      // Connection settings optimized for construction site performance
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnFailover: 1000,
      maxRetriesPerRequest: 3,
      
      // Connection pool settings for concurrent construction workers
      lazyConnect: true,
      keepAlive: 30000,
      
      // Compression for limited bandwidth scenarios
      compression: 'gzip',
      
      // Error handling
      retryDelayOnClusterDown: 2000,
      maxRetriesPerRequest: 2,
    };

    try {
      if (clusterNodes) {
        // Cluster mode for production
        const nodes = clusterNodes.split(',').map(node => {
          const [host, port] = node.trim().split(':');
          return { host, port: parseInt(port) || 6379 };
        });
        
        this.redis = new Redis.Cluster(nodes, {
          redisOptions: baseOptions,
          enableOfflineQueue: false,
        });
        
        this.clusterMode = true;
        this.logger.log(`Redis cluster initialized with ${nodes.length} nodes`);
      } else {
        // Single instance for development
        this.redis = new Redis(redisUrl, baseOptions);
        this.logger.log(`Redis single instance initialized: ${redisUrl}`);
      }

      // Event listeners for monitoring
      this.setupEventListeners();
      
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('disconnect', () => {
      this.logger.warn('Redis disconnected');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis error:', error);
      this.stats.errors++;
    });

    this.redis.on('reconnecting', () => {
      this.logger.log('Redis reconnecting...');
    });
  }

  /**
   * Get value from cache with performance tracking
   */
  async get<T = any>(key: string): Promise<T | null> {
    this.stats.totalRequests++;
    
    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // Return as string if not valid JSON
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Get multiple values efficiently
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    
    this.stats.totalRequests += keys.length;
    
    try {
      const values = await this.redis.mget(...keys);
      
      // Count hits and misses
      values.forEach(value => {
        if (value === null) {
          this.stats.misses++;
        } else {
          this.stats.hits++;
        }
      });
      
      return values;
    } catch (error) {
      this.logger.error(`Error getting keys ${keys.join(', ')}:`, error);
      this.stats.errors += keys.length;
      return keys.map(() => null);
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    this.stats.sets++;
    
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Set value with expiry time (SETEX)
   */
  async setex(key: string, ttlSeconds: number, value: any): Promise<boolean> {
    return this.set(key, value, ttlSeconds);
  }

  /**
   * Set multiple values efficiently
   */
  async mset(keyValuePairs: { key: string; value: any; ttl?: number }[]): Promise<boolean> {
    if (keyValuePairs.length === 0) return true;
    
    try {
      const pipeline = this.redis.pipeline();
      
      keyValuePairs.forEach(({ key, value, ttl }) => {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (ttl) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });
      
      await pipeline.exec();
      this.stats.sets += keyValuePairs.length;
      
      return true;
    } catch (error) {
      this.logger.error('Error in batch set operation:', error);
      this.stats.errors += keyValuePairs.length;
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    this.stats.deletes++;
    
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async mdel(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    
    try {
      const result = await this.redis.del(...keys);
      this.stats.deletes += keys.length;
      return result;
    } catch (error) {
      this.logger.error(`Error deleting keys ${keys.join(', ')}:`, error);
      this.stats.errors += keys.length;
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL on existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting TTL on key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment value (for counters)
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Increment by amount
   */
  async incrby(key: string, increment: number): Promise<number> {
    try {
      return await this.redis.incrby(key, increment);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} by ${increment}:`, error);
      return 0;
    }
  }

  /**
   * Set with NX (only if not exists)
   */
  async setnx(key: string, value: any): Promise<boolean> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      const result = await this.redis.setnx(key, serializedValue);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting key ${key} with NX:`, error);
      return false;
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Error adding to set ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Error getting set members ${key}:`, error);
      return [];
    }
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.srem(key, ...members);
    } catch (error) {
      this.logger.error(`Error removing from set ${key}:`, error);
      return 0;
    }
  }

  /**
   * Push to list (left)
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.redis.lpush(key, ...values);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
      return 0;
    }
  }

  /**
   * Pop from list (right)
   */
  async rpop(key: string): Promise<string | null> {
    try {
      return await this.redis.rpop(key);
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error);
      return null;
    }
  }

  /**
   * Get list length
   */
  async llen(key: string): Promise<number> {
    try {
      return await this.redis.llen(key);
    } catch (error) {
      this.logger.error(`Error getting list length ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get Redis pipeline for batch operations
   */
  pipeline(): Redis.Pipeline {
    return this.redis.pipeline();
  }

  /**
   * Execute Lua script
   */
  async eval(script: string, keys: string[], args: string[]): Promise<any> {
    try {
      return await this.redis.eval(script, keys.length, ...keys, ...args);
    } catch (error) {
      this.logger.error('Error executing Lua script:', error);
      throw error;
    }
  }

  /**
   * Flush all data (use with caution)
   */
  async flushall(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.warn('All Redis data flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis:', error);
      throw error;
    }
  }

  /**
   * Flush database (current DB only)
   */
  async flushdb(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('Current Redis database flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 ? 
      (this.stats.hits / this.stats.totalRequests * 100).toFixed(2) : '0.00';
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      clusterMode: this.clusterMode,
      isConnected: this.redis.status === 'ready'
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = performance.now();
    
    try {
      await this.redis.ping();
      const latency = Math.round(performance.now() - start);
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: -1
      };
    }
  }

  /**
   * Get Redis info
   */
  async info(section?: string): Promise<string> {
    try {
      return await this.redis.info(section);
    } catch (error) {
      this.logger.error('Error getting Redis info:', error);
      return '';
    }
  }

  /**
   * Get memory usage
   */
  async memoryUsage(key: string): Promise<number | null> {
    try {
      return await this.redis.memory('usage', key);
    } catch (error) {
      this.logger.error(`Error getting memory usage for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Construction site specific: Cache form data for offline access
   */
  async cacheFormDataForOffline(projectId: string, formData: any[], ttlDays = 30): Promise<boolean> {
    const ttlSeconds = ttlDays * 24 * 60 * 60;
    
    try {
      const pipeline = this.pipeline();
      
      // Cache individual forms
      formData.forEach((form, index) => {
        const key = `offline:form:${projectId}:${form.id || index}`;
        pipeline.setex(key, ttlSeconds, JSON.stringify(form));
      });
      
      // Cache form list
      const listKey = `offline:forms:${projectId}`;
      pipeline.setex(listKey, ttlSeconds, JSON.stringify(formData.map(f => f.id)));
      
      await pipeline.exec();
      
      this.logger.debug(`Cached ${formData.length} forms for offline access (project: ${projectId})`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error caching offline form data for project ${projectId}:`, error);
      return false;
    }
  }

  /**
   * Construction site specific: Cache weather alerts for instant access
   */
  async cacheWeatherAlert(locationKey: string, alert: any): Promise<boolean> {
    const key = `weather:alert:${locationKey}`;
    // Weather alerts are critical - cache for 1 hour
    return this.setex(key, 3600, alert);
  }

  /**
   * Construction site specific: Cache EPA compliance rules
   */
  async cacheComplianceRules(rules: any[]): Promise<boolean> {
    const key = 'compliance:rules:epa';
    // Compliance rules change infrequently - cache for 1 week
    return this.setex(key, 7 * 24 * 60 * 60, rules);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
    }
  }
}