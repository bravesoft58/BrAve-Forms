const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock Stripe routes
router.get('/config', (req, res) => {
  try {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key'
    });
  } catch (error) {
    logger.error('Error retrieving Stripe config:', error);
    res.status(500).json({ error: 'Failed to get Stripe configuration' });
  }
});

router.post('/create-payment-intent', (req, res) => {
  try {
    // Mock response
    res.json({
      clientSecret: 'mock_client_secret',
      amount: req.body.amount || 1000
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

router.post('/webhook', (req, res) => {
  try {
    // Mock webhook handler
    logger.info('Received Stripe webhook event');
    res.json({ received: true });
  } catch (error) {
    logger.error('Error handling Stripe webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
});

module.exports = router; 