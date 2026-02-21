const config = require('../config/config');
const logger = require('../services/logger');

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = config.security.rateLimit.windowMs;
    this.maxRequests = config.security.rateLimit.maxRequests;
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();

      if (!this.requests.has(key)) {
        this.requests.set(key, []);
      }

      const timestamps = this.requests.get(key);
      const recentRequests = timestamps.filter(timestamp => now - timestamp < this.windowMs);

      if (recentRequests.length >= this.maxRequests) {
        logger.warn('Rate limit exceeded', { ip: key, requests: recentRequests.length });
        return res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later',
          retryAfter: Math.ceil(this.windowMs / 1000),
        });
      }

      recentRequests.push(now);
      this.requests.set(key, recentRequests);

      res.set('X-RateLimit-Limit', this.maxRequests);
      res.set('X-RateLimit-Remaining', this.maxRequests - recentRequests.length);
      res.set('X-RateLimit-Reset', new Date(now + this.windowMs).toISOString());

      next();
    };
  }

  getStats(ip) {
    const now = Date.now();
    const timestamps = this.requests.get(ip) || [];
    const recentRequests = timestamps.filter(timestamp => now - timestamp < this.windowMs);
    return {
      requests: recentRequests.length,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - recentRequests.length),
      resetTime: new Date(now + this.windowMs).toISOString(),
    };
  }

  reset(ip) {
    this.requests.delete(ip);
  }

  resetAll() {
    this.requests.clear();
  }
}

module.exports = new RateLimiter();
