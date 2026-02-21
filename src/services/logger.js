const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Logger {
  constructor() {
    this.logDir = config.logging.dir;
    this.level = config.logging.level;
    this.format = config.logging.format;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    this.levelNames = {
      0: 'ERROR',
      1: 'WARN',
      2: 'INFO',
      3: 'DEBUG',
    };

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const levelName = this.levelNames[this.levels[level]];

    if (this.format === 'json') {
      return JSON.stringify({
        timestamp,
        level: levelName,
        message,
        ...data,
      });
    }

    return `[${timestamp}] [${levelName}] ${message} ${Object.keys(data).length ? JSON.stringify(data) : ''}`;
  }

  writeLog(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, data);
    const timestamp = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${level}-${timestamp}.log`);

    // Console output
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](formatted);

    // File output
    fs.appendFileSync(logFile, formatted + '\n', 'utf8');
  }

  error(message, data = {}) {
    this.writeLog('error', message, data);
  }

  warn(message, data = {}) {
    this.writeLog('warn', message, data);
  }

  info(message, data = {}) {
    this.writeLog('info', message, data);
  }

  debug(message, data = {}) {
    this.writeLog('debug', message, data);
  }

  getLogs(type = 'info', limit = 100) {
    const timestamp = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${type}-${timestamp}.log`);

    if (!fs.existsSync(logFile)) {
      return [];
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    return lines.slice(-limit).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line, timestamp: new Date().toISOString() };
      }
    });
  }
}

module.exports = new Logger();
