const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { auth, userRateLimiter } = require('./middleware/auth');
const { monitorActivity, errorLogger } = require('./middleware/monitoring');
const apiKeyAuth = require('./middleware/apiKeyAuth');
const apiKeyManager = require('./utils/apiKeyManager');
const logger = require('./utils/logger');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet()); // Add security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Monitoring middleware
app.use(monitorActivity);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err));

// Initialize API keys for services
apiKeyManager.generateKey('stripe');
apiKeyManager.startRotation();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const logRoutes = require('./routes/logs');
const apiKeyRoutes = require('./routes/apiKeys');

// Use routes with authentication middleware
app.use('/api/auth', authRoutes);
app.use('/api/projects', auth, projectRoutes);
app.use('/api/logs', auth, logRoutes);
app.use('/api/keys', auth, apiKeyRoutes);

// Protected routes for third-party integrations
app.use('/api/stripe', apiKeyAuth, require('./routes/stripe'));

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app; // For testing