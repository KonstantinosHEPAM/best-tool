const puppeteer = require('puppeteer');

class ScriptChecker {
  constructor(timeout = 25000) {
    this.timeout = timeout;
  }

  async checkURL(page, url, scriptSnippets) {
    const result = {
      url,
      found: {},
      missing: [],
      error: null,
      checkedAt: new Date().toISOString()
    };

    try {
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
        const found = scripts.some(s => s && s.includes(snippet));
        result.found[snippet] = found;
        if (!found) {
          result.missing.push(snippet);
        }
      }

      console.log(`✅ Checked: ${url} - Found ${Object.keys(result.found).length - result.missing.length}/${Object.keys(result.found).length} scripts`);
    } catch (e) {
      result.error = e.message;
      console.log(`❌ Error on ${url}: ${e.message}`);
    }

    return result;
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

      for (const url of urls) {
        let page;
        try {
          page = await browser.newPage();
          page.setDefaultTimeout(this.timeout);
          page.setDefaultNavigationTimeout(this.timeout);

          const result = await this.checkURL(page, url, scriptSnippets);
          results.push(result);
        } catch (pageError) {
          console.log(`❌ Failed to process ${url}: ${pageError.message}`);
          results.push({
            url,
            found: {},
            missing: [],
            error: pageError.message,
            checkedAt: new Date().toISOString()
          });
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

module.exports = ScriptChecker;