const fs = require('fs');
const path = require('path');

class Reporter {
  constructor(testName) {
    this.testName = testName;
    this.timestamp = new Date().toISOString().split('T')[0];
  }

  generateScriptReport(results, config) {
    const fileName = `report_scripts_${this.timestamp}.json`;
    fs.writeFileSync(fileName, JSON.stringify(results, null, 2));

    let markdown = `# Script Check Report - ${this.testName}\n\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    markdown += `| URL | Status | Missing Scripts | Error |\n`;
    markdown += `| --- | ------ | --------------- | ----- |\n`;

    for (const res of results) {
      const status = res.error ? '❌' : (res.missing.length === 0 ? '✅' : '⚠️');
      markdown += `| [${res.url}](${res.url}) | ${status} | ${
        res.missing.length ? res.missing.map(m => `\`${m}\``).join(', ') : 'None'
      } | ${res.error ? `\`${res.error}\`` : ''} |\n`;
    }

    const mdFileName = `report_scripts_${this.timestamp}.md`;
    fs.writeFileSync(mdFileName, markdown);

    console.log('\n==== Script Check Results ====');
    console.log(markdown);

    return { json: fileName, markdown: mdFileName };
  }

  generateEventReport(results, config) {
    const fileName = `report_events_${this.timestamp}.json`;
    fs.writeFileSync(fileName, JSON.stringify(results, null, 2));

    let markdown = `# DataLayer Event Report - ${this.testName}\n\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    markdown += `| URL | Events Found | Missing Events | Error |\n`;
    markdown += `| --- | ------------ | -------------- | ----- |\n`;

    for (const res of results) {
      const eventNames = config.events.map(e => e.name || e);
      const found = eventNames.filter(e => res[e]).length;
      const missing = eventNames.filter(e => !res[e]);
      const status = res.error ? '❌' : (missing.length === 0 ? '✅' : '⚠️');

      markdown += `| [${res.url}](${res.url}) | ${found}/${eventNames.length} | ${
        missing.length ? missing.map(m => `\`${m}\``).join(', ') : 'None'
      } | ${res.error ? `\`${res.error}\`` : ''} |\n`;
    }

    const mdFileName = `report_events_${this.timestamp}.md`;
    fs.writeFileSync(mdFileName, markdown);

    console.log('\n==== DataLayer Event Results ====');
    console.log(markdown);

    return { json: fileName, markdown: mdFileName };
  }

  generateSummary(scriptResults, eventResults, config) {
    const scriptsPassed = scriptResults.filter(r => !r.error && r.missing.length === 0).length;
    const eventsFound = eventResults.map(r => {
      const eventNames = config.events.map(e => e.name || e);
      return eventNames.filter(e => r[e]).length / eventNames.length;
    });
    const avgEventSuccess = (eventsFound.reduce((a, b) => a + b, 0) / eventsFound.length * 100).toFixed(2);

    console.log('\n📊 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Test Name: ${this.testName}`);
    console.log(`Total URLs: ${scriptResults.length}`);
    console.log(`✅ Script Compliance: ${scriptsPassed}/${scriptResults.length}`);
    console.log(`✅ Event Success Rate: ${avgEventSuccess}%`);
    console.log('═'.repeat(50));
  }
}

module.exports = Reporter;