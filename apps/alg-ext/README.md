# AlgorithmLens Chrome Extension

A privacy-respecting Chrome extension that captures visible content from social media feeds for algorithmic analysis. Built with Manifest V3, TypeScript, and Vite.

## Features

- **Multi-platform support**: Captures content from Reddit, YouTube, Instagram, X (Twitter), and Facebook
- **Privacy-first**: Only captures visible text content, no images or authentication data
- **Intelligent parsing**: Extracts author, timestamps, metrics, links, and hashtags
- **Idempotent events**: Duplicate detection prevents re-capturing the same content
- **Batch uploads**: Efficient queuing and uploading every 3 seconds
- **Local storage**: Uses IndexedDB for offline queueing
- **Visual indicator**: On-page indicator shows capture status and allows quick pause/resume
- **Session management**: Start/stop capture sessions with full API integration

## Tech Stack

- **Manifest V3**: Modern Chrome extension architecture
- **TypeScript**: Full type safety throughout
- **Vite**: Fast build tooling with hot reload
- **Preact**: Lightweight UI for popup and options pages
- **IndexedDB**: Client-side event queue storage
- **better-sqlite3**: (via API) Server-side persistence

## Installation

### 1. Install Dependencies

```bash
cd apps/alg-ext
npm install
```

### 2. Build the Extension

```bash
# Development build (watch mode)
npm run dev

# Production build
npm run build
```

The extension will be built to `apps/alg-ext/dist/`

### 3. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `apps/alg-ext/dist` folder
5. The AlgorithmLens extension should now appear in your extensions

## Configuration

### First-Time Setup

1. Click the extension icon in Chrome toolbar
2. Click "Settings" to open the options page
3. Configure:
   - **Account ID**: Your unique identifier (e.g., `user_123`)
   - **API Base URL**: The ingest API endpoint (default: `http://localhost:5050`)
   - **Enabled Sites**: Toggle which platforms to capture from

### Starting a Capture Session

1. Ensure the ingest API is running at `http://localhost:5050` (see `services/ingest-api`)
2. Click the extension icon
3. Click "Start Session"
4. Navigate to any supported social media site
5. Scroll through your feed - content will be captured automatically
6. A small indicator will appear in the bottom-left corner showing capture status

### Stopping a Session

1. Click the extension icon
2. Click "Stop Session"
3. Or click the on-page indicator to pause/resume

## How It Works

### Content Capture Flow

1. **Detection**: Content scripts use IntersectionObserver to detect visible posts
2. **Parsing**: Platform-specific parsers extract text, author, metrics, etc.
3. **Event Creation**: Each post becomes a `LensEvent` with idempotent ID
4. **Queueing**: Events are stored in IndexedDB queue
5. **Upload**: Background worker uploads batches every 3 seconds
6. **Deduplication**: API skips duplicate events based on event ID

### Event ID Format

```
${sessionId}:${platform}:${hashOfText}:${seenAt}
```

This ensures the same content isn't captured twice in the same session.

### Event Schema

```typescript
{
  id: string;
  sessionId: string;
  platformGuess: 'reddit' | 'youtube' | 'instagram' | 'x' | 'facebook';
  seenAt: number;
  block: {
    text: string;
    lines: { t: string; conf: number }[];
    lang?: string;
  };
  features: {
    author?: string;
    ageHint?: string;
    metrics?: { likes?, comments?, reposts?, views? };
    links?: string[];
    hashtags?: string[];
  };
  quality: {
    frameQuality: 'high' | 'med' | 'low';
  };
  source: 'dom_capture';
  schema: 2;
}
```

## Platform-Specific Notes

### Adjusting Selectors

Each platform has its own content script with CSS selectors tuned for that site. If selectors break due to site updates, edit the corresponding file:

#### Reddit (`src/content/reddit.ts`)
- **Posts**: `shreddit-post`
- **Author**: `faceplate-tracker[noun="user"]` or `author` attribute
- **Text**: `div[slot="text-body"]`, `h1`, `[slot="title"]`
- **Time**: `faceplate-timeago`
- **Upvotes**: `upvoteCount` or `score` attribute
- **Comments**: `[aria-label*="comment"]`

#### YouTube (`src/content/youtube.ts`)
- **Videos**: `ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-grid-video-renderer`
- **Title**: `#video-title`, `#video-title-link`
- **Channel**: `#channel-name a`, `ytd-channel-name a`
- **Metadata**: `#metadata-line span` (views, time)
- **Comments**: `ytd-comment-renderer`
- **Author**: `#author-text`
- **Text**: `#content-text`

#### Instagram (`src/content/instagram.ts`)
- **Posts**: `article[role="presentation"]`, `article`
- **Author**: `header a[role="link"]`
- **Caption**: `h1`, `span[dir="auto"]`
- **Time**: `time` element
- **Likes**: `section button`, `section span`
- **Comments**: `a` containing "comment"

#### X/Twitter (`src/content/x.ts`)
- **Tweets**: `article[data-testid="tweet"]`
- **Author**: `div[data-testid="User-Name"] a`
- **Text**: `div[data-testid="tweetText"]`
- **Time**: `time` element
- **Replies**: `[data-testid="reply"]`
- **Retweets**: `[data-testid="retweet"]`
- **Likes**: `[data-testid="like"]`

#### Facebook (`src/content/facebook.ts`)
- **Posts**: `div[role="article"]`
- **Author**: `h2 a`, `h3 a`, `h4 a`
- **Text**: `div[data-ad-preview="message"]`, `div[dir="auto"]`
- **Time**: `time` element
- **Reactions**: `span[aria-label*="reaction"]`
- **Comments**: spans containing "comment"
- **Shares**: spans containing "share"

## Project Structure

```
apps/alg-ext/
├── manifest.json           # Extension manifest
├── package.json
├── tsconfig.json
├── vite.config.ts         # Build configuration
├── src/
│   ├── types.ts           # TypeScript types
│   ├── utils.ts           # Utility functions
│   ├── background/        # Service worker
│   │   ├── worker.ts      # Main background script
│   │   ├── db.ts          # IndexedDB operations
│   │   ├── auth.ts        # Device registration
│   │   ├── uploader.ts    # Batch upload logic
│   │   └── messaging.ts   # Cross-component messaging
│   ├── content/           # Content scripts
│   │   ├── common.ts      # Shared parsing logic
│   │   ├── reddit.ts      # Reddit parser
│   │   ├── youtube.ts     # YouTube parser
│   │   ├── instagram.ts   # Instagram parser
│   │   ├── x.ts           # X/Twitter parser
│   │   ├── facebook.ts    # Facebook parser
│   │   └── indicator.ts   # On-page indicator
│   └── pages/             # UI pages
│       ├── popup.tsx      # Extension popup
│       ├── popup.html
│       ├── options.tsx    # Settings page
│       └── options.html
├── public/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── dist/                  # Build output (gitignored)
```

## Development

### Watch Mode

```bash
npm run dev
```

This will rebuild the extension whenever you change source files. You'll need to click "Reload" in Chrome's extension page to see changes.

### Type Checking

```bash
npm run type-check
```

### Debugging

- **Background worker**: `chrome://extensions/` → Click "service worker" under your extension
- **Content scripts**: Open DevTools on any supported site, check Console
- **Popup**: Right-click extension icon → "Inspect popup"
- **Options page**: Open DevTools on the options page

### Testing Locally

1. Start the ingest API: `cd services/ingest-api && npm run dev`
2. Build the extension: `cd apps/alg-ext && npm run dev`
3. Load unpacked in Chrome
4. Open options, ensure API URL is `http://localhost:5050`
5. Click "Start Session" in popup
6. Visit Reddit, YouTube, Instagram, X, or Facebook
7. Scroll through feed
8. Check popup for queue size and upload status
9. Check API logs for incoming events

## Privacy & Security

- **No authentication data**: The extension never captures cookies, tokens, or passwords
- **Text only**: Only visible text content is captured, no images or videos
- **User control**: Capture only happens during active sessions
- **Local-first**: Events are queued locally and uploaded to your own API
- **No external tracking**: No analytics or third-party services

## Troubleshooting

### Extension won't load
- Ensure you built with `npm run build` or `npm run dev`
- Check that `dist/` folder contains `manifest.json`
- Look for errors in `chrome://extensions/`

### Content not being captured
- Check that the site is enabled in Settings
- Ensure a session is started (check popup)
- Open DevTools Console on the page and look for content script logs
- Verify the ingest API is running and reachable

### Upload failing
- Check that API URL is correct in Settings
- Ensure ingest API is running at that URL
- Check service worker logs for errors
- Verify device token hasn't expired

### Selectors not working
- Social media sites change their HTML frequently
- Check browser console for parsing errors
- Update selectors in the relevant `src/content/*.ts` file
- See "Adjusting Selectors" section above

## Building for Production

1. Update version in `manifest.json`
2. Run `npm run build`
3. The `dist/` folder contains the complete extension
4. Zip the `dist/` folder for distribution
5. Upload to Chrome Web Store (if desired)

## License

MIT
