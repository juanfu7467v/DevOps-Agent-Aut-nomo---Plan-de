const app = require('./app');
const config = require('./config/config');
const logger = require('./services/logger');
const taskService = require('./services/taskService');

const PORT = config.port;
const HOST = config.host;

// Initialize default tasks
function initializeTasks() {
  try {
    // Example health check task
    taskService.registerTask('health-check', async () => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    }, 'Periodic health check');

    // Example cleanup task
    taskService.registerTask('cleanup', async () => {
      logger.info('Running cleanup task');
      return { cleaned: true, timestamp: new Date().toISOString() };
    }, 'Cleanup old logs and data');

    logger.info('Default tasks initialized');
  } catch (error) {
    logger.error('Failed to initialize tasks', { error: error.message });
  }
}

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info(`DevOps Agent started`, {
    port: PORT,
    host: HOST,
    env: config.env,
    timestamp: new Date().toISOString(),
  });

  initializeTasks();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason.message || reason,
    promise: promise.toString(),
  });
});

// Uncaught exception
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

module.exports = server;
