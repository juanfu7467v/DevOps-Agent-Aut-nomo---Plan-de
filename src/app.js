const express = require('express');
const helmet = require('helmet');
const config = require('./config/config');
const logger = require('./services/logger');
const corsMiddleware = require('./middleware/corsMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const healthController = require('./controllers/healthController');
const taskController = require('./controllers/taskController');
const deploymentController = require('./controllers/deploymentController');

const app = express();

// Security middleware
app.use(helmet());
app.use(corsMiddleware);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
app.use(rateLimitMiddleware.middleware());

// Logging
app.use(loggingMiddleware);

// Health endpoints
app.get('/health', healthController.getHealth);
app.get('/stats', healthController.getStats);

// Task endpoints
app.get('/api/tasks', taskController.getAllTasks);
app.get('/api/tasks/:taskId', taskController.getTask);
app.post('/api/tasks/:taskId/execute', taskController.executeTask);
app.get('/api/tasks/history', taskController.getTaskHistory);
app.get('/api/cron-jobs', taskController.getAllCronJobs);

// Deployment endpoints
app.post('/api/deployments', deploymentController.createDeployment);
app.get('/api/deployments', deploymentController.getAllDeployments);
app.get('/api/deployments/:deploymentId', deploymentController.getDeployment);
app.post('/api/deployments/:deploymentId/execute', deploymentController.executeDeployment);
app.get('/api/deployments/:deploymentId/logs', deploymentController.getDeploymentLogs);
app.delete('/api/deployments/:deploymentId', deploymentController.cancelDeployment);
app.get('/api/deployments/history', deploymentController.getDeploymentHistory);

// Logs endpoint
app.get('/logs', (req, res) => {
  try {
    const { type = 'info', limit = 100 } = req.query;
    const logs = logger.getLogs(type, parseInt(limit));
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Error middleware
app.use(errorMiddleware);

module.exports = app;
