#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ScriptChecker = require('./lib/script-checker');
const EventChecker = require('./lib/event-checker');
const Reporter = require('./lib/reporter');

// Load configuration
function loadConfig(configPath = 'config.json') {
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    console.error('📋 Copy config.template.json to config.json and customize it.');
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Invalid JSON in ${configPath}:`, e.message);
    process.exit(1);
  }
}

// Validate configuration
function validateConfig(config) {
  const required = ['urls', 'scripts', 'events'];
  for (const field of required) {
    if (!config[field] || !Array.isArray(config[field]) || config[field].length === 0) {
      throw new Error(`Missing or empty required field: ${field}`);
    }
  }

  if (config.urls.length === 0) {
    throw new Error('No URLs configured');
  }

  if (config.scripts.length === 0) {
    throw new Error('No scripts configured');
  }

  if (config.events.length === 0) {
    throw new Error('No events configured');
  }
}

// Main test runner
async function runTests() {
  const config = loadConfig('config.json');

  try {
    validateConfig(config);
  } catch (e) {
    console.error(`❌ Configuration Error: ${e.message}`);
    process.exit(1);
  }

  const testName = config.testName || 'Web Tests';
  const reporter = new Reporter(testName);

  // Set timeouts
  const scriptTimeout = config.timeout?.script || 25000;
  const eventTimeout = config.timeout?.script || 25000;
  const pageWaitTime = config.timeout?.pageWait || 3000;
  const totalTimeout = config.timeout?.total || 720000;

  // Global timeout
  const timeoutHandle = setTimeout(() => {
    console.error('❌ TIMEOUT: Tests exceeded configured timeout - forcing exit');
    process.exit(1);
  }, totalTimeout);

  try {
    console.log(`\n🚀 Starting Tests: ${testName}`);
    console.log(`📍 URLs to check: ${config.urls.length}`);
    console.log(`🔍 Scripts to verify: ${config.scripts.length}`);
    console.log(`📊 Events to track: ${config.events.length}\n`);

    // Run script checks
    console.log('━'.repeat(50));
    console.log('Phase 1: Checking Scripts...');
    console.log('━'.repeat(50));

    const scriptChecker = new ScriptChecker(scriptTimeout);
    const scriptResults = await scriptChecker.checkAllURLs(
      config.urls,
      config.scripts
    );

    // Run event checks
    console.log('\n━'.repeat(50));
    console.log('Phase 2: Checking DataLayer Events...');
    console.log('━'.repeat(50));

    const eventNames = config.events.map(e => e.name || e);
    const eventChecker = new EventChecker(eventTimeout, pageWaitTime);
    const eventResults = await eventChecker.checkAllURLs(
      config.urls,
      eventNames
    );

    // Generate reports
    console.log('\n━'.repeat(50));
    console.log('Phase 3: Generating Reports...');
    console.log('━'.repeat(50));

    reporter.generateScriptReport(scriptResults, config);
    reporter.generateEventReport(eventResults, config);
    reporter.generateSummary(scriptResults, eventResults, config);

    console.log('\n✅ All tests completed successfully!');

  } catch (e) {
    console.error('\n❌ Fatal Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

// Run tests
runTests();