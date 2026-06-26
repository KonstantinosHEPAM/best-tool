# 🛠️ Best Tool - Web Testing Suite

A flexible, modular tool for checking scripts and tracking dataLayer events across multiple websites.

## ✨ Features

- ✅ **Script Verification** - Verify required scripts are loaded
- ✅ **Event Tracking** - Monitor dataLayer events firing
- ✅ **Multi-URL Testing** - Test unlimited website URLs
- ✅ **Custom Configuration** - Easy JSON-based configuration
- ✅ **Detailed Reports** - JSON + Markdown reports
- ✅ **Modular Design** - Reusable, maintainable code
- ✅ **Team-Friendly** - No coding knowledge needed

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/KonstantinosHEPAM/best-tool.git
cd best-tool

# Install dependencies
npm install
```

### 2. Configuration

```bash
# Create your config from template
cp config.template.json config.json
```

### 3. Customize

Edit `config.json` with your:
- Website URLs to test
- Script snippets to verify
- DataLayer events to track

### 4. Run Tests

```bash
npm start
```

## 📊 Output

After running tests, you'll get:

- `report_scripts_YYYY-MM-DD.json` - Detailed script check data
- `report_scripts_YYYY-MM-DD.md` - Readable script report
- `report_events_YYYY-MM-DD.json` - Detailed event tracking data
- `report_events_YYYY-MM-DD.md` - Readable event report

## 📖 Documentation

For detailed setup and configuration guide, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 🎯 Use Cases

### GTM Implementation Testing
```json
{
  "testName": "GTM Setup",
  "urls": ["https://website.com/"],
  "scripts": ["GTM-ABC123"],
  "events": ["page_view", "purchase"]
}
```

### Consent Management Verification
```json
{
  "testName": "Consent Manager",
  "urls": ["https://website.com/"],
  "scripts": ["sdk.privacy-center"],
  "events": ["didomi-ready", "didomi-consent"]
}
```

### Multi-Region Testing
```json
{
  "testName": "Global Check",
  "urls": [
    "https://us.website.com/",
    "https://uk.website.com/",
    "https://de.website.com/"
  ],
  "scripts": ["GTM-MAIN"],
  "events": ["page_view"]
}
```

## 🏗️ Project Structure

```
.
├── test-runner.js           # Main entry point
├── lib/
│   ├── script-checker.js   # Script verification logic
│   ├── event-checker.js    # Event tracking logic
│   └── reporter.js         # Report generation
├── config.template.json    # Configuration template
├── package.json           # Dependencies
├── SETUP_GUIDE.md         # Detailed setup guide
└── README.md              # This file
```

## 🔧 Configuration Options

### Basic Structure

```json
{
  "testName": "My Tests",
  "urls": ["https://example.com"],
  "scripts": ["GTM-XXX"],
  "events": ["page_view"],
  "timeout": {
    "script": 25000,
    "navigation": 25000,
    "pageWait": 3000,
    "total": 720000
  }
}
```

### Fields

- **testName** - Name for your test suite
- **urls** - Array of URLs to test
- **scripts** - Array of script snippets to verify
- **events** - Array of dataLayer events to track
- **timeout** - Timeout settings in milliseconds

## 📋 Requirements

- Node.js 14+
- npm or yarn
- Internet connection (for accessing URLs)

## 🐛 Troubleshooting

### Config not found
```bash
cp config.template.json config.json
```

### Timeout errors
Increase `timeout.total` in `config.json`

### Events not detected
- Verify event names match exactly
- Check browser DevTools Console for errors
- Increase `timeout.pageWait` value

## 📝 Example Configuration

```json
{
  "testName": "E-Commerce Site",
  "description": "Testing e-commerce platform",
  "urls": [
    "https://shop.example.com/",
    "https://shop.example.com/products",
    "https://shop.example.com/checkout"
  ],
  "scripts": [
    {
      "name": "GTM",
      "snippet": "GTM-ABC123"
    },
    {
      "name": "Analytics",
      "snippet": "ga4-tracking"
    }
  ],
  "events": [
    { "name": "page_view" },
    { "name": "view_item_list" },
    { "name": "add_to_cart" },
    { "name": "purchase" }
  ]
}
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT

---

**Happy Testing! 🎉**