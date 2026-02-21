const simpleGit = require('simple-git');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../services/logger');
const fs = require('fs');
const path = require('path');

class GitHubIntegration {
  constructor() {
    this.token = config.github.token;
    this.owner = config.github.owner;
    this.repo = config.github.repo;
    this.baseUrl = 'https://api.github.com';
    this.reposDir = path.join(process.cwd(), 'repos');
    
    if (!fs.existsSync(this.reposDir)) {
      fs.mkdirSync(this.reposDir, { recursive: true });
    }
  }

  getHeaders() {
    return {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  async cloneRepo(owner, repo, branch = 'main') {
    try {
      const repoPath = path.join(this.reposDir, repo);
      
      if (fs.existsSync(repoPath)) {
        logger.warn(`Repository already exists at ${repoPath}`);
        return { success: true, path: repoPath, message: 'Repository already exists' };
      }

      const url = `https://${this.token}@github.com/${owner}/${repo}.git`;
      const git = simpleGit();
      
      await git.clone(url, repoPath, ['--branch', branch]);
      
      logger.info('Repository cloned successfully', { owner, repo, branch, path: repoPath });
      return { success: true, path: repoPath };
    } catch (error) {
      logger.error('Failed to clone repository', { owner, repo, error: error.message });
      throw error;
    }
  }

  async pullRepo(repo) {
    try {
      const repoPath = path.join(this.reposDir, repo);
      
      if (!fs.existsSync(repoPath)) {
        throw new Error(`Repository not found at ${repoPath}`);
      }

      const git = simpleGit(repoPath);
      await git.pull();
      
      logger.info('Repository pulled successfully', { repo, path: repoPath });
      return { success: true, message: 'Repository pulled successfully' };
    } catch (error) {
      logger.error('Failed to pull repository', { repo, error: error.message });
      throw error;
    }
  }

  async createCommit(repo, message, files = []) {
    try {
      const repoPath = path.join(this.reposDir, repo);
      
      if (!fs.existsSync(repoPath)) {
        throw new Error(`Repository not found at ${repoPath}`);
      }

      const git = simpleGit(repoPath);
      
      if (files.length > 0) {
        await git.add(files);
      } else {
        await git.add('.');
      }
      
      const commit = await git.commit(message);
      
      logger.info('Commit created successfully', { repo, message, hash: commit.commit });
      return { success: true, commit: commit.commit, message };
    } catch (error) {
      logger.error('Failed to create commit', { repo, error: error.message });
      throw error;
    }
  }

  async pushRepo(repo, branch = 'main') {
    try {
      const repoPath = path.join(this.reposDir, repo);
      
      if (!fs.existsSync(repoPath)) {
        throw new Error(`Repository not found at ${repoPath}`);
      }

      const git = simpleGit(repoPath);
      await git.push('origin', branch);
      
      logger.info('Repository pushed successfully', { repo, branch });
      return { success: true, message: 'Repository pushed successfully' };
    } catch (error) {
      logger.error('Failed to push repository', { repo, error: error.message });
      throw error;
    }
  }

  async createPullRequest(owner, repo, title, head, base = 'main', body = '') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${owner}/${repo}/pulls`,
        { title, head, base, body },
        { headers: this.getHeaders() }
      );
      
      logger.info('Pull request created successfully', { owner, repo, title, pr: response.data.number });
      return { success: true, pr: response.data };
    } catch (error) {
      logger.error('Failed to create pull request', { owner, repo, error: error.message });
      throw error;
    }
  }

  async getRepoInfo(owner, repo) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}`,
        { headers: this.getHeaders() }
      );
      
      logger.info('Repository info retrieved', { owner, repo });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to get repository info', { owner, repo, error: error.message });
      throw error;
    }
  }

  async listBranches(owner, repo) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/branches`,
        { headers: this.getHeaders() }
      );
      
      logger.info('Branches listed successfully', { owner, repo, count: response.data.length });
      return { success: true, branches: response.data };
    } catch (error) {
      logger.error('Failed to list branches', { owner, repo, error: error.message });
      throw error;
    }
  }

  async triggerWorkflow(owner, repo, workflowId, ref = 'main', inputs = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
        { ref, inputs },
        { headers: this.getHeaders() }
      );
      
      logger.info('Workflow triggered successfully', { owner, repo, workflowId });
      return { success: true, message: 'Workflow triggered' };
    } catch (error) {
      logger.error('Failed to trigger workflow', { owner, repo, error: error.message });
      throw error;
    }
  }
}

module.exports = new GitHubIntegration();
