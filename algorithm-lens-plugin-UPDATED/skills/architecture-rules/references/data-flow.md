# AlgorithmLens Data Flow Reference

## Snapshot Lifecycle

```
User's Social Media Feed
        │
        ▼
┌─────────────────────┐
│  Chrome Extension    │  CAPTURE ONLY
│  - Reads feed DOM    │
│  - Structures data   │
│  - Transmits to API  │
└─────────┬───────────┘
          │ (HTTPS POST)
          ▼
┌─────────────────────┐
│  Backend (Python)    │  PROCESSING ONLY
│  - Validates input   │
│  - Categorizes posts │
│  - Computes metrics  │
│  - Stores snapshot   │
└─────────┬───────────┘
          │ (API Response)
          ▼
┌─────────────────────┐
│  Frontend (React)    │  RENDERING ONLY
│  - Fetches processed │
│    data via API      │
│  - Renders 6-tab     │
│    dashboard         │
│  - Gates premium     │
│    features via UI   │
└─────────────────────┘
```

## API Boundary Contract

The backend exposes endpoints that return processed, structured data. The frontend consumes these endpoints and renders them. The frontend never receives raw snapshot data — only processed results.

### Key Endpoints (expected pattern)
- `POST /api/snapshot` — receives raw snapshot from extension, returns processed result
- `GET /api/snapshot/:id` — returns a processed snapshot for dashboard rendering
- `GET /api/snapshots` — returns list of user's snapshots (metadata)
- `GET /api/trends` — returns longitudinal trend data (Plus users only)
- `POST /api/webhook/stripe` — receives Stripe webhook events

### Feature Gating Flow

Premium features (longitudinal trends) are gated at TWO layers:
1. **API layer**: Backend checks `is_user_plus` before returning trend data. Returns 403 if user is not Plus.
2. **UI layer**: Frontend checks subscription status and hides/disables premium UI elements for free users.

Both layers must be in sync. Never rely on UI gating alone — a determined user could bypass frontend checks.

## Database Schema Principles

- User records include `is_user_plus` boolean flag
- Snapshots are linked to user IDs
- Each snapshot stores processed category data, not raw HTML
- Subscription state changes are logged for auditability
- Trial start dates are stored to compute expiration
- Schema avoids premature optimization — clarity first

## Extension Communication

The Chrome extension communicates with the backend via authenticated HTTPS requests. The extension:
- Does NOT communicate with the frontend directly
- Does NOT store processed results
- Does NOT maintain persistent connections
- Sends structured data (not raw DOM) to the backend
- Must handle network failures gracefully (retry, offline queuing)

## Environment Separation

- Development: local backend, local database, Stripe test mode
- Staging: deployed backend, test database, Stripe test mode
- Production: deployed backend, production database, Stripe live mode

Environment variables control which mode is active. Secrets are never committed to source control.
