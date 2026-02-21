const cors = require('cors');
const config = require('../config/config');
const logger = require('../services/logger');

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.security.corsOrigins;

    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS request blocked', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature'],
  maxAge: 86400,
};

module.exports = cors(corsOptions);
