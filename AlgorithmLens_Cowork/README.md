# AlgorithmLens Frontend

> **The primary AlgorithmLens frontend application for analyzing algorithmic feed bias across social media platforms.**

## Quick Start

```bash
npm install
npm run dev
```

**App URL:** http://localhost:5173

**Dashboard URL:** http://localhost:5173/dashboard

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend API**: Python FastAPI (separate repository)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Magic Link (passwordless)
- **Payments**: Stripe
- **AI Analysis**: Google Gemini API

## Development

For detailed development setup and workflow, see [docs/developer-setup.md](docs/developer-setup.md).

```bash
# Start frontend dev server
npm run dev

# Start frontend + backend together
npm run dev:full

# Backend only (Python)
npm run backend

# Production build
npm run build

# Run linting on changed files
npm run lint:changed

# Run all lints
npm run lint:all

# Run smoke tests
npm run test:smoke
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── dashboard/      # Dashboard-specific components
│   ├── ui/             # UI primitives (buttons, inputs, etc.)
│   └── plan/           # Plan/paywall components
├── pages/              # Page components (routes)
├── lib/                # Utility functions and libraries
│   ├── api/            # API client functions
│   ├── auth/           # Authentication (Supabase)
│   ├── analytics/      # Analytics and event tracking
│   └── dashboard/      # Dashboard data processing
├── types/              # TypeScript type definitions
├── config/             # Configuration (platforms, etc.)
├── context/            # React Context (state management)
├── hooks/              # Custom React hooks
├── assets/             # Static assets (logos, images)
└── main.jsx            # Entry point
```

## Key Features

- **Scan Analysis**: Detect ads, political content, wellbeing themes
- **Multiple Platforms**: Support for TikTok, Instagram, YouTube, X/Twitter, Facebook
- **Two Capture Methods**:
  - Chrome Extension (desktop, real-time)
  - Video Upload (mobile, retrospective)
- **Dashboard**: Trend analysis, cross-scan comparisons, AI-powered insights
- **Subscription Plans**: Free tier with paid Plus tier for advanced features

## Configuration

See [.env.example](.env.example) for required environment variables.

Key vars:
- `VITE_ALG_API_BASE_URL`: Backend API URL (default: http://localhost:8000)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe public key for payments
- `VITE_COMING_SOON_MODE`: Toggle coming-soon page

## Observability

For setting up error tracking (Sentry), performance monitoring, and Web Vitals, see [docs/observability-setup.md](docs/observability-setup.md).

## Testing

See [docs/test-plan.md](docs/test-plan.md) for test strategy and running tests.

```bash
npm run test:smoke          # E2E smoke tests
npm run test:smoke:ui       # E2E tests with UI
```

## Performance

- **Code Splitting**: Vendor, animations, stripe, supabase split into separate chunks
- **Image Optimization**: See [docs/asset-optimization.md](docs/asset-optimization.md)
- **Web Vitals**: Monitored via src/lib/analytics/webVitals.js

## Contributing

1. See [docs/developer-setup.md](docs/developer-setup.md) for setup
2. Create feature branch: `git checkout -b feature/description`
3. Run linting: `npm run lint:changed`
4. Create pull request
5. Ensure CI/CD pipeline passes

## Documentation

- [Developer Setup](docs/developer-setup.md) - Local development guide
- [Observability Setup](docs/observability-setup.md) - Error tracking & monitoring
- [Asset Optimization](docs/asset-optimization.md) - Image and bundle optimization
- [Test Plan](docs/test-plan.md) - Testing strategy and recommendations

## License

Proprietary - AlgorithmLens
