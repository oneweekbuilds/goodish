# Observability Setup Guide (#44)

This guide covers setting up error tracking and performance monitoring for AlgorithmLens.

## Sentry Error Tracking

Sentry provides real-time error tracking and performance monitoring.

### Setup

1. Create a Sentry account at https://sentry.io/
2. Create a new Sentry project for your frontend
3. Copy your Sentry DSN

### Frontend Configuration

Add to `.env.local`:
```
VITE_SENTRY_DSN=https://your-key@sentry.io/your-project-id
VITE_SENTRY_ENVIRONMENT=development
```

### Initialize Sentry in src/main.jsx:

```javascript
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### Wrap your app:
```javascript
const App = () => {
  // Your app code
};

export default Sentry.withProfiler(App);
```

## Backend Error Tracking

For the Python backend, add Sentry SDK:

```bash
pip install sentry-sdk
```

Add to backend/app.py:
```python
import sentry_sdk
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "development"),
    integrations=[
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=1.0,
)

app = FastAPI()
app = SentryAsgiMiddleware(app)
```

## Web Vitals Monitoring

Web Vitals track user experience metrics. See src/lib/analytics/webVitals.js for implementation.

### Key Metrics

- **LCP** (Largest Contentful Paint): How long until the largest element renders
- **FID** (First Input Delay): How responsive the site is to user input
- **CLS** (Cumulative Layout Shift): Visual stability during loading
- **TTFB** (Time to First Byte): Server response time
- **FCP** (First Contentful Paint): When first content appears

### Monitoring

Once Web Vitals are enabled, you can:
- Collect metrics in analytics.js
- Send to external services (Google Analytics, Mixpanel, etc.)
- Monitor trends over time

## Analytics Events

The app tracks important user events in src/lib/analytics/events.js:

```javascript
import { track, EVENTS } from '../lib/analytics';

// Track scan completion
track(EVENTS.SCAN_COMPLETE, {
  scanId: '123',
  duration: 45000,
  platform: 'instagram',
});
```

See src/lib/analytics/index.js for available event types and how to add new ones.

## Performance Monitoring

### React DevTools Profiler

1. Install React DevTools extension
2. Open DevTools → "Profiler" tab
3. Click Record and interact with the app
4. Analyze render times and component hierarchies

### Network Monitoring

1. Open DevTools → "Network" tab
2. Monitor API calls and asset loading
3. Look for slow requests or large bundles
4. Use "Throttling" to simulate slow networks

## Logging Best Practices

### Development

```javascript
console.log('[ComponentName] Action', data);
console.error('[ComponentName] Error:', error);
console.warn('[ComponentName] Warning:', message);
```

### Production

- Log errors to Sentry (not console)
- Use analytics for user actions
- Avoid logging PII (personally identifiable information)
- Use structured logging when possible

## Monitoring Dashboards

### Recommended Services

1. **Sentry**: Error tracking, performance, replays
2. **Google Analytics 4**: User behavior, conversion tracking
3. **Vercel Analytics**: Core Web Vitals, performance by page
4. **Mixpanel**: Event tracking, funnels, cohort analysis

### Key Metrics to Monitor

- Error rate
- Average response time
- User engagement (active users, session duration)
- Core Web Vitals scores
- Conversion funnels
- Platform-specific metrics (TikTok scans vs Instagram, etc.)

## Incident Response

When an error is detected:

1. Check Sentry for error details and stack trace
2. Review affected users and browser/OS
3. Check recent deployments
4. Review server logs
5. If critical, roll back and create incident post-mortem
6. Add test case to prevent regression

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Web Vitals](https://web.dev/vitals/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Google Analytics 4](https://analytics.google.com/)
