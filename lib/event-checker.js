const puppeteer = require('puppeteer');

class EventChecker {
  constructor(timeout = 25000, pageWaitTime = 3000, maxRetries = 2, concurrency = 3) {
    this.timeout = timeout;
    this.pageWaitTime = pageWaitTime;
    this.maxRetries = maxRetries;
    this.concurrency = concurrency;
    this.cache = new Map();
  }

  getCacheKey(url, eventName) {
    return `${url}:${eventName}`;
  }

  async checkURL(page, url, eventNames) {
    const result = {
      url,
      checkedAt: new Date().toISOString(),
      error: null,
      cached: false
    };

    // Initialize all events as false
    for (const eventName of eventNames) {
      result[eventName] = false;
    }

    try {
      const startTime = Date.now();
      
      // Expose function to detect events
      await page.exposeFunction('eventDetected', (eventName) => {
        if (eventNames.includes(eventName)) {
          result[eventName] = true;
        }
      });

      // Intercept dataLayer.push before page loads
      await page.evaluateOnNewDocument((events) => {
        window.dataLayer = window.dataLayer || [];
        const originalPush = window.dataLayer.push;
        
        window.dataLayer.push = function () {
          for (const arg of arguments) {
            if (arg && arg.event) {
              if (typeof window.eventDetected === 'function') {
                window.eventDetected(arg.event);
              }
            }
          }
          return originalPush.apply(this, arguments);
        };
      }, eventNames);

      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: this.timeout 
      });

      // Wait for events to fire
      await page.waitForTimeout(this.pageWaitTime);

      // Check for events in existing dataLayer
      const dataLayerEvents = await page.evaluate((events) => {
        const detected = {};
        for (const eventName of events) {
          detected[eventName] = false;
        }
        
        if (Array.isArray(window.dataLayer)) {
          for (const obj of window.dataLayer) {
            if (obj && obj.event && events.includes(obj.event)) {
              detected[obj.event] = true;
            }
          }
        }
        return detected;
      }, eventNames);

      // Merge results and cache
      for (const eventName of eventNames) {
        result[eventName] = result[eventName] || dataLayerEvents[eventName];
        this.cache.set(this.getCacheKey(url, eventName), result[eventName]);
      }

      const found = eventNames.filter(e => result[e]).length;
      const duration = Date.now() - startTime;
      console.log(`✅ Checked: ${url} - Found ${found}/${eventNames.length} events (${duration}ms)`);
    } catch (e) {
      result.error = e.message;
      console.log(`❌ Error on ${url}: ${e.message}`);
    }

    return result;
  }

  async processURLWithRetry(browser, url, eventNames) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      let page;
      try {
        page = await browser.newPage();
        page.setDefaultTimeout(this.timeout);
        page.setDefaultNavigationTimeout(this.timeout);

        return await this.checkURL(page, url, eventNames);
      } catch (e) {
        lastError = e;
        console.log(`⚠️  Attempt ${attempt}/${this.maxRetries} failed for ${url}: ${e.message}`);
        if (attempt < this.maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (e) {
            console.warn(`Warning: Could not close page: ${e.message}`);
          }
        }
      }
    }

    const failResult = {
      url,
      error: lastError?.message || 'Unknown error',
      checkedAt: new Date().toISOString()
    };
    for (const eventName of eventNames) {
      failResult[eventName] = false;
    }
    return failResult;
  }

  async checkAllURLs(urls, eventNames, launchOptions = {}) {
    let browser;
    const results = [];

    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 30000,
        ...launchOptions
      });

      // Process URLs with concurrency control
      for (let i = 0; i < urls.length; i += this.concurrency) {
        const batch = urls.slice(i, i + this.concurrency);
        const batchPromises = batch.map(url => 
          this.processURLWithRetry(browser, url, eventNames)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Force garbage collection between batches
        if (global.gc) global.gc();
      }
    } catch (e) {
      console.error('❌ Fatal error in browser setup:', e.message);
      throw e;
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('Warning: Could not close browser:', e.message);
        }
      }
    }

    return results;
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHits: Array.from(this.cache.values()).filter(v => v).length
    };
  }
}

module.exports = EventChecker;