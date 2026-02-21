const fs = require('fs');
const path = require('path');
const logger = require('../services/logger');

class FileSystemIntegration {
  async readFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      logger.info('File read successfully', { filePath });
      return { success: true, content };
    } catch (error) {
      logger.error('Failed to read file', { filePath, error: error.message });
      throw error;
    }
  }

  async writeFile(filePath, content) {
    try {
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, 'utf8');
      logger.info('File written successfully', { filePath });
      return { success: true, filePath };
    } catch (error) {
      logger.error('Failed to write file', { filePath, error: error.message });
      throw error;
    }
  }

  async appendFile(filePath, content) {
    try {
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(filePath, content, 'utf8');
      logger.info('File appended successfully', { filePath });
      return { success: true, filePath };
    } catch (error) {
      logger.error('Failed to append to file', { filePath, error: error.message });
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      fs.unlinkSync(filePath);
      logger.info('File deleted successfully', { filePath });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete file', { filePath, error: error.message });
      throw error;
    }
  }

  async listFiles(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }

      const files = fs.readdirSync(dirPath);
      const fileList = files.map(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          isDirectory: stat.isDirectory(),
          size: stat.size,
          modified: stat.mtime,
        };
      });

      logger.info('Files listed successfully', { dirPath, count: fileList.length });
      return { success: true, files: fileList };
    } catch (error) {
      logger.error('Failed to list files', { dirPath, error: error.message });
      throw error;
    }
  }

  async createDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      logger.info('Directory created successfully', { dirPath });
      return { success: true, dirPath };
    } catch (error) {
      logger.error('Failed to create directory', { dirPath, error: error.message });
      throw error;
    }
  }

  async deleteDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }

      fs.rmSync(dirPath, { recursive: true, force: true });
      logger.info('Directory deleted successfully', { dirPath });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete directory', { dirPath, error: error.message });
      throw error;
    }
  }

  async fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  async getFileStats(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stat = fs.statSync(filePath);
      return {
        success: true,
        stats: {
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime,
          isDirectory: stat.isDirectory(),
          isFile: stat.isFile(),
        },
      };
    } catch (error) {
      logger.error('Failed to get file stats', { filePath, error: error.message });
      throw error;
    }
  }
}

module.exports = new FileSystemIntegration();
