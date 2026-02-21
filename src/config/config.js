require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    dir: process.env.LOG_DIR || './src/logs',
  },

  // GitHub Integration
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
  },

  // Security
  security: {
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    },
  },

  // Webhooks
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || 'your-secret-key',
    port: process.env.WEBHOOK_PORT || 3001,
  },

  // External APIs
  externalApis: {
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retries: parseInt(process.env.API_RETRIES || '3'),
  },

  // Cron Jobs
  cronJobs: {
    enabled: process.env.CRON_ENABLED === 'true',
  },

  // Deployment
  deployment: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_DEPLOYS || '3'),
    timeout: parseInt(process.env.DEPLOY_TIMEOUT || '300000'),
  },
};

module.exports = config;
