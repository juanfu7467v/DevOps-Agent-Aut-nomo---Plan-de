const axios = require('axios');
const config = require('../config/config');
const logger = require('../services/logger');

class HttpIntegration {
  constructor() {
    this.timeout = config.externalApis.timeout;
    this.retries = config.externalApis.retries;
  }

  async request(method, url, data = null, headers = {}, retries = this.retries) {
    try {
      const options = {
        method,
        url,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (data) {
        options.data = data;
      }

      const response = await axios(options);
      
      logger.info('HTTP request successful', { method, url, status: response.status });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      if (retries > 0 && error.response?.status >= 500) {
        logger.warn('HTTP request failed, retrying', { method, url, retries: retries - 1 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(method, url, data, headers, retries - 1);
      }

      logger.error('HTTP request failed', {
        method,
        url,
        status: error.response?.status,
        error: error.message,
      });

      throw error;
    }
  }

  async get(url, headers = {}) {
    return this.request('GET', url, null, headers);
  }

  async post(url, data, headers = {}) {
    return this.request('POST', url, data, headers);
  }

  async put(url, data, headers = {}) {
    return this.request('PUT', url, data, headers);
  }

  async patch(url, data, headers = {}) {
    return this.request('PATCH', url, data, headers);
  }

  async delete(url, headers = {}) {
    return this.request('DELETE', url, null, headers);
  }

  async callWebhook(url, payload, retries = this.retries) {
    try {
      const response = await axios.post(url, payload, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' },
      });

      logger.info('Webhook called successfully', { url, status: response.status });
      return { success: true, status: response.status };
    } catch (error) {
      if (retries > 0 && error.response?.status >= 500) {
        logger.warn('Webhook call failed, retrying', { url, retries: retries - 1 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.callWebhook(url, payload, retries - 1);
      }

      logger.error('Webhook call failed', { url, error: error.message });
      throw error;
    }
  }

  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new HttpIntegration();
