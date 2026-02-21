const crypto = require('crypto');
const config = require('../config/config');
const logger = require('./logger');

class WebhookService {
  constructor() {
    this.webhooks = new Map();
    this.secret = config.webhooks.secret;
  }

  registerWebhook(id, url, events = [], active = true) {
    try {
      const webhook = {
        id,
        url,
        events,
        active,
        createdAt: new Date().toISOString(),
        lastTriggered: null,
        triggerCount: 0,
      };

      this.webhooks.set(id, webhook);
      logger.info('Webhook registered successfully', { id, url, events });
      return { success: true, webhook };
    } catch (error) {
      logger.error('Failed to register webhook', { id, error: error.message });
      throw error;
    }
  }

  unregisterWebhook(id) {
    try {
      if (!this.webhooks.has(id)) {
        throw new Error(`Webhook not found: ${id}`);
      }

      this.webhooks.delete(id);
      logger.info('Webhook unregistered successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to unregister webhook', { id, error: error.message });
      throw error;
    }
  }

  getWebhook(id) {
    return this.webhooks.get(id);
  }

  getAllWebhooks() {
    return Array.from(this.webhooks.values());
  }

  updateWebhook(id, updates) {
    try {
      const webhook = this.webhooks.get(id);
      if (!webhook) {
        throw new Error(`Webhook not found: ${id}`);
      }

      const updated = { ...webhook, ...updates, id, createdAt: webhook.createdAt };
      this.webhooks.set(id, updated);
      logger.info('Webhook updated successfully', { id });
      return { success: true, webhook: updated };
    } catch (error) {
      logger.error('Failed to update webhook', { id, error: error.message });
      throw error;
    }
  }

  verifySignature(payload, signature) {
    try {
      const hash = crypto
        .createHmac('sha256', this.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return hash === signature;
    } catch (error) {
      logger.error('Failed to verify signature', { error: error.message });
      return false;
    }
  }

  generateSignature(payload) {
    try {
      return crypto
        .createHmac('sha256', this.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    } catch (error) {
      logger.error('Failed to generate signature', { error: error.message });
      throw error;
    }
  }

  async triggerWebhooks(event, data) {
    try {
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(payload);
      const webhooksToTrigger = Array.from(this.webhooks.values()).filter(
        webhook => webhook.active && webhook.events.includes(event)
      );

      logger.info('Triggering webhooks', { event, count: webhooksToTrigger.length });

      for (const webhook of webhooksToTrigger) {
        try {
          // This would be called by the HTTP integration
          webhook.lastTriggered = new Date().toISOString();
          webhook.triggerCount++;
          this.webhooks.set(webhook.id, webhook);
        } catch (error) {
          logger.error('Failed to trigger webhook', { webhookId: webhook.id, error: error.message });
        }
      }

      return { success: true, triggered: webhooksToTrigger.length, signature };
    } catch (error) {
      logger.error('Failed to trigger webhooks', { event, error: error.message });
      throw error;
    }
  }
}

module.exports = new WebhookService();
