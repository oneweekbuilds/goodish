# AlgorithmLens Chrome Extension

Chrome extension for scanning desktop social media feeds and analyzing what algorithms show you.

## Status

**Step 11A Complete** - Extension scaffold ready  
**Step 11B Pending** - Feed capture logic not yet implemented

## Supported Platforms

- TikTok (www.tiktok.com)
- Instagram (www.instagram.com)
- YouTube (www.youtube.com)
- Facebook (www.facebook.com)

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
cd apps/alg-gemini-extension
npm install
```

### Build

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist` folder from this extension directory

### Testing

1. After loading the extension, navigate to TikTok, Instagram, YouTube, or Facebook
2. Click the extension icon (puzzle piece) in the Chrome toolbar
3. The popup should show "Ready to scan [Platform]"
4. Click "Start Desktop Scan" to test the message flow

## Project Structure

```
apps/alg-gemini-extension/
├── manifest.json          # Chrome extension manifest (v3)
├── package.json           # Node dependencies and scripts
├── vite.config.js         # Vite build configuration
├── README.md              # This file
├── src/
│   ├── content.js         # Injected into supported pages
│   ├── background.js      # Service worker
│   └── popup/
│       ├── index.html     # Popup UI
│       └── popup.js       # Popup logic
└── dist/                  # Build output (git-ignored)
```

## Manifest V3 Features

- Uses service worker instead of background page
- Declarative content scripts
- Action API for browser toolbar button
- Modern permissions model

## Next Steps (Step 11B)

1. Implement DOM scraping for each platform's feed
2. Extract post metadata (text, hashtags, engagement)
3. Detect ads and sponsored content
4. Send captured data to AlgorithmLens backend for analysis
5. Display results in popup or redirect to web dashboard

## License

Private - Part of the Goodish monorepo



