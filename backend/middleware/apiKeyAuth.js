const apiKeyManager = require('../utils/apiKeyManager');
const logger = require('../utils/logger');

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  const serviceName = req.header('X-Service-Name');

  if (!apiKey || !serviceName) {
    logger.warn('Missing API key or service name in request');
    return res.status(401).json({ error: 'Missing API key or service name' });
  }

  if (!apiKeyManager.verifyKey(serviceName, apiKey)) {
    logger.warn(`Invalid API key attempt for service: ${serviceName}`);
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

module.exports = apiKeyAuth; 