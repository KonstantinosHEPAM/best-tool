const puppeteer = require('puppeteer');

class ScriptChecker {
  constructor(timeout = 25000, maxRetries = 2, concurrency = 3) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.concurrency = concurrency;
    this.cache = new Map();
  }

  getCacheKey(url, snippet) {
    return `${url}:${snippet}`;
  }

  async checkURL(page, url, scriptSnippets) {
    const result = {
      url,
      found: {},
      missing: [],
      error: null,
      checkedAt: new Date().toISOString(),
      cached: false
    };

    try {
      const startTime = Date.now();
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: this.timeout 
      });
      
      await page.waitForTimeout(2000);

      const scripts = await page.$$eval('script', els =>
        els.map(e => e.src ? e.src : e.innerHTML)
      );

      // Check each script snippet
      for (const scriptObj of scriptSnippets) {
        const snippet = typeof scriptObj === 'string' ? scriptObj : scriptObj.snippet;
        const cacheKey = this.getCacheKey(url, snippet);
        const found = scripts.some(s => s && s.includes(snippet));
        result.found[snippet] = found;
        if (!found) result.missing.push(snippet);
        this.cache.set(cacheKey, found);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Checked: ${url} - Found ${Object.keys(result.found).length - result.missing.length}/${Object.keys(result.found).length} scripts (${duration}ms)`);
    } catch (e) {
      result.error = e.message;
      console.log(`❌ Error on ${url}: ${e.message}`);
    }

    return result;
  }

  async processURLWithRetry(browser, url, scriptSnippets) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      let page;
      try {
        page = await browser.newPage();
        page.setDefaultTimeout(this.timeout);
        page.setDefaultNavigationTimeout(this.timeout);

        return await this.checkURL(page, url, scriptSnippets);
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

    return {
      url,
      found: {},
      missing: [],
      error: lastError?.message || 'Unknown error',
      checkedAt: new Date().toISOString()
    };
  }

  async checkAllURLs(urls, scriptSnippets, launchOptions = {}) {
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
          this.processURLWithRetry(browser, url, scriptSnippets)
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

module.exports = ScriptChecker;