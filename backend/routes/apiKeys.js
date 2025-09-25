const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const apiKeyManager = require('../utils/apiKeyManager');
const logger = require('../utils/logger');

// Get all API keys (admin only)
router.get('/', isAdmin, (req, res) => {
  try {
    const keys = {};
    for (const [serviceName, keyData] of apiKeyManager.keys.entries()) {
      keys[serviceName] = {
        current: keyData.current,
        lastRotated: new Date(keyData.timestamp).toISOString()
      };
    }
    res.json(keys);
  } catch (error) {
    logger.error('Error getting API keys:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Generate new API key for a service (admin only)
router.post('/:serviceName', isAdmin, (req, res) => {
  try {
    const { serviceName } = req.params;
    const newKey = apiKeyManager.generateKey(serviceName);
    res.json({ 
      message: 'API key generated successfully',
      key: newKey
    });
  } catch (error) {
    logger.error('Error generating API key:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Rotate API key for a service (admin only)
router.post('/:serviceName/rotate', isAdmin, (req, res) => {
  try {
    const { serviceName } = req.params;
    const newKey = apiKeyManager.generateKey(serviceName);
    res.json({ 
      message: 'API key rotated successfully',
      key: newKey
    });
  } catch (error) {
    logger.error('Error rotating API key:', error);
    res.status(500).json({ error: 'Failed to rotate API key' });
  }
});

module.exports = router; 