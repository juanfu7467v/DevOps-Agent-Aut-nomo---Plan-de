const os = require('os');
const logger = require('./logger');

class HealthService {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastCheck = null;
  }

  getSystemInfo() {
    return {
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadAverage: os.loadavg(),
      },
      platform: os.platform(),
      nodeVersion: process.version,
    };
  }

  getHealth() {
    const systemInfo = this.getSystemInfo();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    const isHealthy =
      systemInfo.memory.percentage < 90 &&
      systemInfo.cpu.loadAverage[0] < os.cpus().length * 2;

    const status = isHealthy ? 'healthy' : 'degraded';

    this.lastCheck = {
      timestamp: new Date().toISOString(),
      status,
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) : 0,
      systemInfo,
    };

    logger.info('Health check performed', { status, uptime });

    return this.lastCheck;
  }

  incrementRequestCount() {
    this.requestCount++;
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  getStats() {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) : 0,
      lastCheck: this.lastCheck,
    };
  }
}

module.exports = new HealthService();
