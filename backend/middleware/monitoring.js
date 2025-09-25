const logger = require('../utils/logger');

// Middleware to monitor suspicious activities
const monitorActivity = (req, res, next) => {
  // Log request details
  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.userId,
    timestamp: new Date().toISOString(),
    userAgent: req.get('user-agent'),
  };

  // Check for suspicious patterns
  const isSuspicious = checkForSuspiciousPatterns(requestInfo);

  if (isSuspicious) {
    logger.warn('Suspicious activity detected', { requestInfo });
  }

  // Log all requests
  logger.info('Request received', { requestInfo });

  next();
};

// Function to check for suspicious patterns
const checkForSuspiciousPatterns = (requestInfo) => {
  const suspiciousPatterns = [
    // Multiple failed login attempts
    (info) => info.path.includes('/auth/login') && info.method === 'POST',
    // Unusual user agent
    (info) => !info.userAgent || info.userAgent.includes('bot'),
    // Unusual request frequency
    (info) => {
      // Implement rate checking logic here
      return false;
    },
    // Unusual IP patterns
    (info) => {
      // Implement IP checking logic here
      return false;
    },
  ];

  return suspiciousPatterns.some(pattern => pattern(requestInfo));
};

// Middleware to log errors
const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
  });
  next(err);
};

module.exports = {
  monitorActivity,
  errorLogger,
}; 