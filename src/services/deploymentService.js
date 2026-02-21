const logger = require('./logger');
const githubIntegration = require('../integrations/githubIntegration');
const httpIntegration = require('../integrations/httpIntegration');

class DeploymentService {
  constructor() {
    this.deployments = new Map();
    this.deploymentHistory = [];
    this.activeDeployments = 0;
    this.maxConcurrent = 3;
  }

  async createDeployment(id, config) {
    try {
      if (this.deployments.has(id)) {
        throw new Error(`Deployment already exists: ${id}`);
      }

      const deployment = {
        id,
        config,
        status: 'pending',
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        logs: [],
        error: null,
      };

      this.deployments.set(id, deployment);
      logger.info('Deployment created', { id, config });
      return { success: true, deployment };
    } catch (error) {
      logger.error('Failed to create deployment', { id, error: error.message });
      throw error;
    }
  }

  async executeDeployment(id) {
    try {
      const deployment = this.deployments.get(id);
      if (!deployment) {
        throw new Error(`Deployment not found: ${id}`);
      }

      if (this.activeDeployments >= this.maxConcurrent) {
        throw new Error('Max concurrent deployments reached');
      }

      deployment.status = 'running';
      deployment.startedAt = new Date().toISOString();
      this.activeDeployments++;

      try {
        const { type, target, branch = 'main', steps = [] } = deployment.config;

        this.addLog(id, `Starting ${type} deployment to ${target}`);

        if (type === 'github') {
          await this.deployGitHub(id, deployment, target, branch);
        } else if (type === 'webhook') {
          await this.deployWebhook(id, deployment, target);
        } else if (type === 'custom') {
          await this.executeCustomSteps(id, deployment, steps);
        }

        deployment.status = 'completed';
        this.addLog(id, 'Deployment completed successfully');
      } catch (error) {
        deployment.status = 'failed';
        deployment.error = error.message;
        this.addLog(id, `Deployment failed: ${error.message}`);
        throw error;
      } finally {
        deployment.completedAt = new Date().toISOString();
        this.activeDeployments--;
        this.deploymentHistory.push({
          deploymentId: id,
          status: deployment.status,
          duration: new Date(deployment.completedAt) - new Date(deployment.startedAt),
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, deployment };
    } catch (error) {
      logger.error('Failed to execute deployment', { id, error: error.message });
      throw error;
    }
  }

  async deployGitHub(id, deployment, target, branch) {
    try {
      const [owner, repo] = target.split('/');
      this.addLog(id, `Cloning repository ${owner}/${repo}`);
      await githubIntegration.cloneRepo(owner, repo, branch);

      this.addLog(id, 'Repository cloned successfully');
      this.addLog(id, 'Running deployment scripts');

      // Simulate deployment steps
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.addLog(id, 'Deployment scripts completed');
    } catch (error) {
      throw error;
    }
  }

  async deployWebhook(id, deployment, webhookUrl) {
    try {
      this.addLog(id, `Calling webhook: ${webhookUrl}`);

      const payload = {
        deploymentId: id,
        timestamp: new Date().toISOString(),
        type: 'deployment',
      };

      await httpIntegration.callWebhook(webhookUrl, payload);
      this.addLog(id, 'Webhook called successfully');
    } catch (error) {
      throw error;
    }
  }

  async executeCustomSteps(id, deployment, steps) {
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        this.addLog(id, `Executing step ${i + 1}: ${step.name}`);

        if (step.type === 'http') {
          await httpIntegration.request(
            step.method || 'POST',
            step.url,
            step.data,
            step.headers
          );
        } else if (step.type === 'wait') {
          await new Promise(resolve => setTimeout(resolve, step.duration || 1000));
        }

        this.addLog(id, `Step ${i + 1} completed`);
      }
    } catch (error) {
      throw error;
    }
  }

  addLog(id, message) {
    const deployment = this.deployments.get(id);
    if (deployment) {
      deployment.logs.push({
        timestamp: new Date().toISOString(),
        message,
      });
    }
  }

  getDeployment(id) {
    return this.deployments.get(id);
  }

  getAllDeployments() {
    return Array.from(this.deployments.values());
  }

  getDeploymentHistory(limit = 100) {
    return this.deploymentHistory.slice(-limit);
  }

  getDeploymentLogs(id) {
    const deployment = this.deployments.get(id);
    if (!deployment) {
      throw new Error(`Deployment not found: ${id}`);
    }
    return deployment.logs;
  }

  cancelDeployment(id) {
    try {
      const deployment = this.deployments.get(id);
      if (!deployment) {
        throw new Error(`Deployment not found: ${id}`);
      }

      if (deployment.status === 'running') {
        deployment.status = 'cancelled';
        deployment.completedAt = new Date().toISOString();
        this.activeDeployments--;
        logger.info('Deployment cancelled', { id });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to cancel deployment', { id, error: error.message });
      throw error;
    }
  }
}

module.exports = new DeploymentService();
