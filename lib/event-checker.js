const puppeteer = require('puppeteer');

class EventChecker {
  constructor(timeout = 25000, pageWaitTime = 3000) {
    this.timeout = timeout;
    this.pageWaitTime = pageWaitTime;
  }

  async checkURL(page, url, eventNames) {
    const result = {
      url,
      checkedAt: new Date().toISOString(),
      error: null
    };

    // Initialize all events as false
    for (const eventName of eventNames) {
      result[eventName] = false;
    }

    try {
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

      // Merge results
      for (const eventName of eventNames) {
        result[eventName] = result[eventName] || dataLayerEvents[eventName];
      }

      const found = eventNames.filter(e => result[e]).length;
      console.log(`✅ Checked: ${url} - Found ${found}/${eventNames.length} events`);
    } catch (e) {
      result.error = e.message;
      console.log(`❌ Error on ${url}: ${e.message}`);
    }

    return result;
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

      for (const url of urls) {
        let page;
        try {
          page = await browser.newPage();
          page.setDefaultTimeout(this.timeout);
          page.setDefaultNavigationTimeout(this.timeout);

          const result = await this.checkURL(page, url, eventNames);
          results.push(result);
        } catch (pageError) {
          console.log(`❌ Failed to process ${url}: ${pageError.message}`);
          const failResult = {
            url,
            error: pageError.message,
            checkedAt: new Date().toISOString()
          };
          for (const eventName of eventNames) {
            failResult[eventName] = false;
          }
          results.push(failResult);
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
}

module.exports = EventChecker;