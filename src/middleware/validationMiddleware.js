const logger = require('../services/logger');

class ValidationMiddleware {
  static validateJSON(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!req.is('application/json')) {
        logger.warn('Invalid Content-Type', { contentType: req.get('content-type') });
        return res.status(400).json({
          success: false,
          error: 'Content-Type must be application/json',
        });
      }
    }
    next();
  }

  static validateRequired(fields) {
    return (req, res, next) => {
      const missing = [];

      for (const field of fields) {
        if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
          missing.push(field);
        }
      }

      if (missing.length > 0) {
        logger.warn('Missing required fields', { fields: missing });
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missing,
        });
      }

      next();
    };
  }

  static validateUrl(fieldName) {
    return (req, res, next) => {
      const url = req.body[fieldName];

      if (!url) {
        return next();
      }

      try {
        new URL(url);
        next();
      } catch {
        logger.warn('Invalid URL', { field: fieldName, value: url });
        return res.status(400).json({
          success: false,
          error: `Invalid URL in field: ${fieldName}`,
        });
      }
    };
  }

  static validateEmail(fieldName) {
    return (req, res, next) => {
      const email = req.body[fieldName];

      if (!email) {
        return next();
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        logger.warn('Invalid email', { field: fieldName, value: email });
        return res.status(400).json({
          success: false,
          error: `Invalid email in field: ${fieldName}`,
        });
      }

      next();
    };
  }

  static sanitizeInput(req, res, next) {
    const sanitize = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .trim()
            .replace(/[<>]/g, '')
            .substring(0, 10000);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    if (req.body) {
      sanitize(req.body);
    }

    next();
  }

  static validateEnum(fieldName, allowedValues) {
    return (req, res, next) => {
      const value = req.body[fieldName];

      if (!value) {
        return next();
      }

      if (!allowedValues.includes(value)) {
        logger.warn('Invalid enum value', { field: fieldName, value, allowed: allowedValues });
        return res.status(400).json({
          success: false,
          error: `Invalid value for ${fieldName}. Allowed: ${allowedValues.join(', ')}`,
        });
      }

      next();
    };
  }

  static validateNumber(fieldName, min = null, max = null) {
    return (req, res, next) => {
      const value = req.body[fieldName];

      if (value === undefined || value === null) {
        return next();
      }

      const num = Number(value);

      if (isNaN(num)) {
        logger.warn('Invalid number', { field: fieldName, value });
        return res.status(400).json({
          success: false,
          error: `${fieldName} must be a number`,
        });
      }

      if (min !== null && num < min) {
        return res.status(400).json({
          success: false,
          error: `${fieldName} must be at least ${min}`,
        });
      }

      if (max !== null && num > max) {
        return res.status(400).json({
          success: false,
          error: `${fieldName} must be at most ${max}`,
        });
      }

      next();
    };
  }
}

module.exports = ValidationMiddleware;
