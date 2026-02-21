const healthService = require('../services/healthService');
const logger = require('../services/logger');

class HealthController {
  static getHealth(req, res) {
    try {
      const health = healthService.getHealth();
      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error('Error getting health status', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static getStats(req, res) {
    try {
      const stats = healthService.getStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting stats', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = HealthController;
