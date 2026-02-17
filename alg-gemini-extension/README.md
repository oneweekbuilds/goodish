# AlgorithmLens Chrome Extension

Chrome extension for scanning desktop social media feeds and capturing what algorithms show you.

## Status

**Production-ready** — Session-based scanning with full backend integration.

## Supported Platforms

- TikTok (www.tiktok.com)
- Instagram (www.instagram.com) — including Reels
- YouTube (www.youtube.com) — including Shorts
- Facebook (www.facebook.com)
- Twitter/X (x.com, twitter.com)
- Reddit (www.reddit.com)

## Features

- **Session-based scanning**: Start/stop recording sessions to capture feed content over time
- **Per-platform DOM extraction**: Custom selectors for each social media platform
- **Ad/sponsored detection**: Identifies labeled ads and promotional content
- **Source type detection**: Distinguishes algorithmic suggestions from followed content
- **Rate limiting**: Prevents overwhelming collection (30 posts/sec normal, 50 burst)
- **Backend integration**: Sends captured data to AlgorithmLens backend for AI analysis
- **Retry logic**: Exponential backoff for failed backend submissions
- **AI consent toggle**: User controls whether data is analyzed by Gemini

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
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

1. After loading the extension, navigate to any supported platform
2. Click the extension icon in the Chrome toolbar
3. The popup shows platform detection and session controls
4. Click **Start Scanning** to begin a session
5. Browse the feed normally — posts are captured as you scroll
6. Click **Stop & Analyze** to send data to the backend
7. View results in the popup or click through to the full dashboard

## Project Structure

```
alg-gemini-extension/
├── manifest.json              # Chrome extension manifest (v3)
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite build configuration
├── src/
│   ├── content.js             # Injected into supported pages — manages observers and post collection
│   ├── background.js          # Service worker — session lifecycle, backend communication
│   ├── desktop_mapper.js      # Maps raw DOM posts to UnifiedScanResult schema
│   ├── popup/
│   │   ├── index.html         # Popup UI
│   │   └── popup.js           # Popup logic — session controls, results display, AI consent
│   ├── scanners/
│   │   ├── index.js           # Scanner router — dispatches to platform-specific extractors
│   │   ├── utils.js           # Shared utilities — DOM helpers, ID generation, ad indicators
│   │   ├── twitter.js         # Twitter/X feed scanner
│   │   ├── instagram.js       # Instagram feed + Reels scanner
│   │   ├── youtube.js         # YouTube feed + Shorts scanner
│   │   ├── facebook.js        # Facebook feed scanner
│   │   ├── reddit.js          # Reddit feed scanner
│   │   └── tiktok.js          # TikTok feed scanner
│   └── shared/
│       ├── debug.js           # Debug logging configuration
│       └── generate-scan-id.js # Scan ID generation
├── test/                      # Test utilities and snapshots
└── dist/                      # Build output (gitignored)
```

## Architecture

The extension follows a **capture-only** architecture:

- **Content script** (content.js): Observes DOM mutations and viewport intersections to detect new posts
- **Platform scanners** (scanners/*.js): Extract structured data from platform-specific DOM elements
- **Desktop mapper** (desktop_mapper.js): Transforms raw post data into the UnifiedScanResult schema
- **Background service worker** (background.js): Manages session state and communicates with the backend

The extension does **not** analyze, categorize, or process feed content — that happens on the backend.

## License

Proprietary — AlgorithmLens
