const puppeteer = require('puppeteer');
const logger = require('../services/logger');

class BrowserIntegration {
  constructor() {
    this.browser = null;
    this.pages = new Map();
  }

  async initialize() {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        logger.info('Browser initialized successfully');
      }
      return this.browser;
    } catch (error) {
      logger.error('Failed to initialize browser', { error: error.message });
      throw error;
    }
  }

  async createPage(pageId) {
    try {
      const browser = await this.initialize();
      const page = await browser.newPage();
      this.pages.set(pageId, page);
      logger.info('Page created successfully', { pageId });
      return page;
    } catch (error) {
      logger.error('Failed to create page', { pageId, error: error.message });
      throw error;
    }
  }

  async navigateTo(pageId, url) {
    try {
      let page = this.pages.get(pageId);
      if (!page) {
        page = await this.createPage(pageId);
      }

      await page.goto(url, { waitUntil: 'networkidle2' });
      logger.info('Page navigated successfully', { pageId, url });
      return { success: true, url };
    } catch (error) {
      logger.error('Failed to navigate to page', { pageId, url, error: error.message });
      throw error;
    }
  }

  async screenshot(pageId, filePath) {
    try {
      const page = this.pages.get(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      await page.screenshot({ path: filePath });
      logger.info('Screenshot taken successfully', { pageId, filePath });
      return { success: true, filePath };
    } catch (error) {
      logger.error('Failed to take screenshot', { pageId, error: error.message });
      throw error;
    }
  }

  async getPageContent(pageId) {
    try {
      const page = this.pages.get(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      const content = await page.content();
      logger.info('Page content retrieved successfully', { pageId });
      return { success: true, content };
    } catch (error) {
      logger.error('Failed to get page content', { pageId, error: error.message });
      throw error;
    }
  }

  async click(pageId, selector) {
    try {
      const page = this.pages.get(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      await page.click(selector);
      logger.info('Element clicked successfully', { pageId, selector });
      return { success: true };
    } catch (error) {
      logger.error('Failed to click element', { pageId, selector, error: error.message });
      throw error;
    }
  }

  async type(pageId, selector, text) {
    try {
      const page = this.pages.get(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      await page.type(selector, text);
      logger.info('Text typed successfully', { pageId, selector });
      return { success: true };
    } catch (error) {
      logger.error('Failed to type text', { pageId, selector, error: error.message });
      throw error;
    }
  }

  async fillForm(pageId, formData) {
    try {
      const page = this.pages.get(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      for (const [selector, value] of Object.entries(formData)) {
        await page.type(selector, value);
      }

      logger.info('Form filled successfully', { pageId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to fill form', { pageId, error: error.message });
      throw error;
    }
  }

  async submit(pageId, selector) {
    try {
      const page = this.pages.get(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      await page.click(selector);
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      logger.info('Form submitted successfully', { pageId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to submit form', { pageId, error: error.message });
      throw error;
    }
  }

  async closePage(pageId) {
    try {
      const page = this.pages.get(pageId);
      if (page) {
        await page.close();
        this.pages.delete(pageId);
        logger.info('Page closed successfully', { pageId });
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to close page', { pageId, error: error.message });
      throw error;
    }
  }

  async closeBrowser() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.pages.clear();
        logger.info('Browser closed successfully');
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to close browser', { error: error.message });
      throw error;
    }
  }
}

module.exports = new BrowserIntegration();
