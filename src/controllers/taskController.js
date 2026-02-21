const taskService = require('../services/taskService');
const logger = require('../services/logger');
const { ErrorHandler } = require('../services/errorHandler');

class TaskController {
  static async executeTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { params = {} } = req.body;

      const result = await taskService.executeTask(taskId, params);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getAllTasks(req, res) {
    try {
      const tasks = taskService.getAllTasks();
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      logger.error('Error getting tasks', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static getTask(req, res) {
    try {
      const { taskId } = req.params;
      const task = taskService.getTask(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      logger.error('Error getting task', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static getTaskHistory(req, res) {
    try {
      const { taskId } = req.query;
      const { limit = 100 } = req.query;

      const history = taskService.getTaskHistory(taskId, parseInt(limit));
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error getting task history', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static getAllCronJobs(req, res) {
    try {
      const jobs = taskService.getAllCronJobs();
      res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      logger.error('Error getting cron jobs', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = TaskController;
