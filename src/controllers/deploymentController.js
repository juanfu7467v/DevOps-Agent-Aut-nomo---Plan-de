const deploymentService = require('../services/deploymentService');
const logger = require('../services/logger');

class DeploymentController {
  static async createDeployment(req, res, next) {
    try {
      const { id, config } = req.body;

      if (!id || !config) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: id, config',
        });
      }

      const result = await deploymentService.createDeployment(id, config);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async executeDeployment(req, res, next) {
    try {
      const { deploymentId } = req.params;

      const result = await deploymentService.executeDeployment(deploymentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static getDeployment(req, res) {
    try {
      const { deploymentId } = req.params;
      const deployment = deploymentService.getDeployment(deploymentId);

      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found',
        });
      }

      res.status(200).json({
        success: true,
        data: deployment,
      });
    } catch (error) {
      logger.error('Error getting deployment', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static getAllDeployments(req, res) {
    try {
      const deployments = deploymentService.getAllDeployments();
      res.status(200).json({
        success: true,
        data: deployments,
      });
    } catch (error) {
      logger.error('Error getting deployments', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static getDeploymentHistory(req, res) {
    try {
      const { limit = 100 } = req.query;
      const history = deploymentService.getDeploymentHistory(parseInt(limit));
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error getting deployment history', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static getDeploymentLogs(req, res) {
    try {
      const { deploymentId } = req.params;
      const logs = deploymentService.getDeploymentLogs(deploymentId);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      logger.error('Error getting deployment logs', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async cancelDeployment(req, res, next) {
    try {
      const { deploymentId } = req.params;
      const result = await deploymentService.cancelDeployment(deploymentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DeploymentController;
