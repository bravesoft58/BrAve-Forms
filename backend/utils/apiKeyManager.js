const crypto = require('crypto');
const logger = require('./logger');

class ApiKeyManager {
  constructor() {
    this.keys = new Map();
    this.rotationInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Generate a new API key
  generateKey(serviceName) {
    const key = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    this.keys.set(serviceName, {
      current: key,
      previous: this.keys.get(serviceName)?.current || null,
      timestamp
    });

    logger.info(`Generated new API key for ${serviceName}`);
    return key;
  }

  // Verify an API key
  verifyKey(serviceName, key) {
    const serviceKeys = this.keys.get(serviceName);
    if (!serviceKeys) return false;

    // Check both current and previous keys during rotation period
    const isValid = key === serviceKeys.current || 
                   (serviceKeys.previous && key === serviceKeys.previous);

    if (!isValid) {
      logger.warn(`Invalid API key attempt for ${serviceName}`);
    }

    return isValid;
  }

  // Rotate API keys
  rotateKeys() {
    for (const [serviceName, keys] of this.keys.entries()) {
      if (Date.now() - keys.timestamp >= this.rotationInterval) {
        this.generateKey(serviceName);
        logger.info(`Rotated API key for ${serviceName}`);
      }
    }
  }

  // Start automatic key rotation
  startRotation() {
    setInterval(() => this.rotateKeys(), this.rotationInterval);
    logger.info('Started automatic API key rotation');
  }
}

module.exports = new ApiKeyManager(); 