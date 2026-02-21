const logger = require('../services/logger');
const healthService = require('../services/healthService');

module.exports = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  healthService.incrementRequestCount();

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    if (statusCode >= 400) {
      healthService.incrementErrorCount();
    }

    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.send = originalSend;
    return res.send(data);
  };

  next();
};
