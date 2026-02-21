const logger = require('../services/logger');

class AuthMiddleware {
  static verifyApiKey(req, res, next) {
    const apiKey = req.get('Authorization')?.replace('Bearer ', '');
    const expectedKey = process.env.API_KEY;

    if (!apiKey || !expectedKey) {
      logger.warn('Missing API key');
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid API key',
      });
    }

    if (apiKey !== expectedKey) {
      logger.warn('Invalid API key', { apiKey: apiKey.substring(0, 10) });
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    next();
  }

  static verifyWebhookSignature(secret) {
    return (req, res, next) => {
      const signature = req.get('X-Webhook-Signature');

      if (!signature) {
        logger.warn('Missing webhook signature');
        return res.status(401).json({
          success: false,
          error: 'Missing webhook signature',
        });
      }

      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== signature) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
        });
      }

      next();
    };
  }

  static optional(req, res, next) {
    const apiKey = req.get('Authorization')?.replace('Bearer ', '');
    const expectedKey = process.env.API_KEY;

    if (apiKey && expectedKey && apiKey === expectedKey) {
      req.authenticated = true;
    } else {
      req.authenticated = false;
    }

    next();
  }
}

module.exports = AuthMiddleware;
