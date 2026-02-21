const cron = require('node-cron');
const logger = require('./logger');

class TaskService {
  constructor() {
    this.tasks = new Map();
    this.jobs = new Map();
    this.taskHistory = [];
  }

  registerTask(id, handler, description = '') {
    try {
      const task = {
        id,
        handler,
        description,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: null,
        status: 'registered',
        runCount: 0,
        errorCount: 0,
      };

      this.tasks.set(id, task);
      logger.info('Task registered successfully', { id, description });
      return { success: true, task };
    } catch (error) {
      logger.error('Failed to register task', { id, error: error.message });
      throw error;
    }
  }

  async executeTask(id, params = {}) {
    try {
      const task = this.tasks.get(id);
      if (!task) {
        throw new Error(`Task not found: ${id}`);
      }

      logger.info('Executing task', { id, params });

      const startTime = Date.now();
      const result = await task.handler(params);
      const duration = Date.now() - startTime;

      task.lastRun = new Date().toISOString();
      task.runCount++;
      task.status = 'completed';

      this.taskHistory.push({
        taskId: id,
        executedAt: new Date().toISOString(),
        duration,
        status: 'success',
        result,
      });

      logger.info('Task executed successfully', { id, duration });
      return { success: true, result, duration };
    } catch (error) {
      const task = this.tasks.get(id);
      if (task) {
        task.errorCount++;
        task.status = 'failed';
      }

      this.taskHistory.push({
        taskId: id,
        executedAt: new Date().toISOString(),
        status: 'error',
        error: error.message,
      });

      logger.error('Task execution failed', { id, error: error.message });
      throw error;
    }
  }

  scheduleCronJob(id, cronExpression, params = {}) {
    try {
      if (this.jobs.has(id)) {
        throw new Error(`Cron job already exists: ${id}`);
      }

      const job = cron.schedule(cronExpression, async () => {
        try {
          await this.executeTask(id, params);
        } catch (error) {
          logger.error('Cron job execution failed', { id, error: error.message });
        }
      });

      this.jobs.set(id, {
        job,
        cronExpression,
        params,
        createdAt: new Date().toISOString(),
      });

      logger.info('Cron job scheduled successfully', { id, cronExpression });
      return { success: true, id, cronExpression };
    } catch (error) {
      logger.error('Failed to schedule cron job', { id, error: error.message });
      throw error;
    }
  }

  unscheduleCronJob(id) {
    try {
      const cronJob = this.jobs.get(id);
      if (!cronJob) {
        throw new Error(`Cron job not found: ${id}`);
      }

      cronJob.job.stop();
      this.jobs.delete(id);
      logger.info('Cron job unscheduled successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to unschedule cron job', { id, error: error.message });
      throw error;
    }
  }

  getTask(id) {
    return this.tasks.get(id);
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  getCronJob(id) {
    return this.jobs.get(id);
  }

  getAllCronJobs() {
    return Array.from(this.jobs.values()).map(job => ({
      cronExpression: job.cronExpression,
      params: job.params,
      createdAt: job.createdAt,
    }));
  }

  getTaskHistory(taskId = null, limit = 100) {
    let history = this.taskHistory;
    if (taskId) {
      history = history.filter(h => h.taskId === taskId);
    }
    return history.slice(-limit);
  }

  clearTaskHistory() {
    this.taskHistory = [];
    logger.info('Task history cleared');
    return { success: true };
  }
}

module.exports = new TaskService();
