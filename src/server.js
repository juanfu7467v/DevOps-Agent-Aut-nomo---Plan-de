const app = require('./app');
const config = require('./config/config');
const logger = require('./services/logger');
const taskService = require('./services/taskService');

const PORT = config.port;
const HOST = config.host;

function initializeTasks() {
  try {
    taskService.registerTask('health-check', async () => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    }, 'Periodic health check');
    logger.info('Tareas de sistema inicializadas');
  } catch (error) {
    logger.error('Error al inicializar tareas', { error: error.message });
  }
}

const server = app.listen(PORT, HOST, () => {
  logger.info(`Agente DevOps corriendo en http://${HOST}:${PORT}`);
  initializeTasks();
});

// Cierre ordenado
const gracefulShutdown = () => {
  server.close(() => {
    logger.info('Servidor apagado');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = server;
