# 🛠️ Web Testing Tool - Setup Guide

A flexible, modular tool for checking scripts and tracking dataLayer events across multiple website URLs.

---

## 📋 Quick Start

### 1. **Initial Setup**

```bash
# Install dependencies
npm install

# Create your config file
cp config.template.json config.json
```

### 2. **Configure Your Tests**

Edit `config.json` with your:
- ✅ Website URLs to test
- ✅ Script snippets to verify
- ✅ DataLayer events to track

### 3. **Run Tests**

```bash
npm start
# or
node test-runner.js
```

---

## 🎯 Configuration Guide

### Basic Config Structure

```json
{
  "testName": "My Product Tests",
  "description": "Testing my product website",
  "urls": [
    "https://example.com/page1",
    "https://example.com/page2"
  ],
  "scripts": [
    {
      "name": "Google Tag Manager",
      "snippet": "GTM-XXXXX",
      "description": "Main tracking container"
    }
  ],
  "events": [
    {
      "name": "page_view",
      "description": "User viewed a page",
      "required": true
    }
  ],
  "timeout": {
    "script": 25000,
    "navigation": 25000,
    "pageWait": 3000,
    "total": 720000
  }
}
```

### Field Descriptions

#### `testName` (string)
Human-readable name for your test suite. Used in reports.

#### `description` (string)
Brief description of what these tests do.

#### `urls` (array of strings)
List of website URLs to test. Include the full path if testing specific pages.

```json
"urls": [
  "https://www.example.com/search-results",
  "https://www.example.com/product-detail",
  "https://www.example.com/checkout"
]
```

#### `scripts` (array of objects or strings)

Scripts to verify are loaded on the page.

**Simple format:**
```json
"scripts": ["GTM-XXXXX", "sdk.privacy", "app.analytics"]
```

**Detailed format (recommended):**
```json
"scripts": [
  {
    "name": "Google Tag Manager",
    "snippet": "GTM-XXXXX",
    "description": "Primary tracking container"
  },
  {
    "name": "Consent Manager",
    "snippet": "sdk.privacy-center",
    "description": "User consent management"
  }
]
```

#### `events` (array of objects or strings)

DataLayer events to track.

**Simple format:**
```json
"events": ["page_view", "user_signup", "add_to_cart"]
```

**Detailed format (recommended):**
```json
"events": [
  {
    "name": "page_view",
    "description": "User viewed a page",
    "required": true
  },
  {
    "name": "add_to_cart",
    "description": "Product added to cart",
    "required": false
  }
]
```

#### `timeout` (object)

Control timing for different operations.

| Field | Default | Description |
|-------|---------|-------------|
| `script` | 25000 | Page load timeout (ms) |
| `navigation` | 25000 | Navigation timeout (ms) |
| `pageWait` | 3000 | Wait time after page load (ms) |
| `total` | 720000 | Total script timeout (ms) |

---

## 📊 Reports

After tests complete, two files are generated for each phase:

### Script Check Reports
- `report_scripts_YYYY-MM-DD.json` - Detailed JSON data
- `report_scripts_YYYY-MM-DD.md` - Markdown table for easy viewing

### Event Check Reports
- `report_events_YYYY-MM-DD.json` - Detailed JSON data
- `report_events_YYYY-MM-DD.md` - Markdown table for easy viewing

### Report Format

```
| URL | Status | Missing Scripts | Error |
| --- | ------ | --------------- | ----- |
| https://example.com | ✅ | None | |
| https://example.com/page | ⚠️ | `GTM-XXX` | |
| https://example.com/other | ❌ | | Timeout |
```

**Status Indicators:**
- ✅ All checks passed
- ⚠️ Some issues found
- ❌ Error occurred

---

## 🔧 Common Use Cases

### Use Case 1: Testing GTM Implementation

```json
{
  "testName": "GTM Implementation",
  "urls": [
    "https://website.com/",
    "https://website.com/products",
    "https://website.com/checkout"
  ],
  "scripts": [
    { "name": "GTM Container", "snippet": "GTM-ABC123" }
  ],
  "events": [
    { "name": "page_view", "description": "Page viewed" },
    { "name": "view_item_list", "description": "Product list viewed" },
    { "name": "purchase", "description": "Purchase completed" }
  ]
}
```

### Use Case 2: Consent Management Testing

```json
{
  "testName": "Consent Manager",
  "urls": ["https://website.com/"],
  "scripts": [
    { "name": "Privacy Center", "snippet": "sdk.privacy-center" },
    { "name": "Consent API", "snippet": "didomi" }
  ],
  "events": [
    { "name": "didomi-ready", "description": "SDK initialized" },
    { "name": "didomi-consent", "description": "User gave consent" }
  ]
}
```

### Use Case 3: Multi-Region Testing

```json
{
  "testName": "Global Website Check",
  "urls": [
    "https://us.website.com/",
    "https://uk.website.com/",
    "https://de.website.com/",
    "https://fr.website.com/"
  ],
  "scripts": [
    { "snippet": "GTM-MAIN" },
    { "snippet": "analytics.js" }
  ],
  "events": [
    { "name": "page_view" },
    { "name": "page_error" }
  ]
}
```

---

## 🐛 Troubleshooting

### "Config file not found"
```bash
cp config.template.json config.json
```
Then edit `config.json` with your settings.

### "Script exceeded timeout"
Increase the `timeout.total` value in config:
```json
"timeout": {
  "total": 1200000
}
```

### "No events detected"
- Check that events are firing by opening the page in browser DevTools
- Look at the Network tab and Console for errors
- Verify event names exactly match what's in dataLayer
- Increase `timeout.pageWait` to allow more time for events

### "Script not found, but I see it on the page"
- The tool searches for script snippets in page source
- External scripts might not be in source if loaded dynamically
- Try using a unique identifier from the script URL instead

---

## 📁 Project Structure

```
├── test-runner.js              # Main entry point
├── config.template.json        # Config template (COPY THIS)
├── config.json                 # Your config (gitignored)
├── SETUP_GUIDE.md             # This file
├── lib/
│   ├── script-checker.js      # Script verification logic
│   ├── event-checker.js       # Event tracking logic
│   └── reporter.js            # Report generation
├── report_scripts_*.json       # Generated reports
├── report_scripts_*.md         # Generated reports
├── report_events_*.json        # Generated reports
└── report_events_*.md          # Generated reports
```

---

## ✅ Next Steps

1. **Create your config file:**
   ```bash
   cp config.template.json config.json
   ```

2. **Add your URLs, scripts, and events**

3. **Test it:**
   ```bash
   npm start
   ```

4. **Review the generated reports**

5. **Share `config.json` with your team** (keep template updated)

---

**Happy Testing! 🎉**