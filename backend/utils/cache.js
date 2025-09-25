const Redis = require('redis');
const logger = require('./logger');

class Cache {
  constructor() {
    this.enabled = process.env.ENABLE_REDIS === 'true';
    this.client = null;

    if (this.enabled) {
      try {
        this.client = Redis.createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        this.client.on('error', (err) => {
          logger.error('Redis Client Error:', err);
          this.enabled = false;
        });
        
        this.client.on('connect', () => logger.info('Connected to Redis'));
        
        this.client.connect().catch(err => {
          logger.error('Redis connection failed:', err);
          this.enabled = false;
        });
      } catch (error) {
        logger.error('Redis initialization failed:', error);
        this.enabled = false;
      }
    } else {
      logger.info('Redis cache disabled');
    }
  }

  // Set cache with expiration
  async set(key, value, expireInSeconds = 3600) {
    if (!this.enabled || !this.client) return;
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.set(key, serializedValue, {
        EX: expireInSeconds
      });
      logger.debug(`Cache set for key: ${key}`);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  // Get cached value
  async get(key) {
    if (!this.enabled || !this.client) return null;
    
    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache
  async del(key) {
    if (!this.enabled || !this.client) return;
    
    try {
      await this.client.del(key);
      logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  // Clear all cache
  async clear() {
    if (!this.enabled || !this.client) return;
    
    try {
      await this.client.flushAll();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }
}

module.exports = new Cache(); 