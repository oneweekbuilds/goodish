# AlgorithmLens Ingest API

A minimal, production-ready ingestion API for AlgorithmLens that receives rich text block events from clients (desktop extension, mobile apps), stores them in SQLite, and provides endpoints for session management and data retrieval.

## Features

- **Idempotent batch event ingestion** - duplicate events are automatically skipped
- **Session tracking** - start, finish, and query capture sessions
- **Device authentication** - token-based auth with 30-day expiration
- **Zero external dependencies** - uses SQLite with better-sqlite3
- **CORS enabled** - ready for local development
- **Account erasure** - GDPR-compliant data deletion
- **Production-ready** - includes proper indexing, transactions, and error handling

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: API key + device tokens

## Quick Start

### Installation

```bash
cd services/ingest-api
npm install
```

### Development

```bash
# Copy environment template
cp .env.example .env

# Start dev server (auto-reload on changes)
npm run dev
```

The API will start on `http://localhost:5050`

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5050
DATABASE_URL=file:./data/ingest.sqlite
API_KEY_MODE=disabled
INGEST_API_KEY=change-me
```

- `PORT`: HTTP port for the API server
- `DATABASE_URL`: SQLite database file path
- `API_KEY_MODE`: Set to `enabled` to require API key authentication
- `INGEST_API_KEY`: The API key (required when `API_KEY_MODE=enabled`)

## Authentication

Two authentication layers:

1. **API Key** (optional, for server-to-server): Set `API_KEY_MODE=enabled` and include `x-api-key` header
2. **Device Token** (required for most endpoints): Include `Authorization: Bearer <token>` header

## API Endpoints

### Device Registration

```bash
POST /v1/devices/register
Content-Type: application/json

{
  "accountId": "acc_123"
}

Response:
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceToken": "a1b2c3...",
  "expiresAt": 1731172951123
}
```

### Session Management

**Start Session**
```bash
POST /v1/sessions/start
Authorization: Bearer <deviceToken>

{
  "accountId": "acc_123",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "S-2025-11-09T16:40:00Z"
}
```

**Finish Session**
```bash
POST /v1/sessions/finish
Authorization: Bearer <deviceToken>

{
  "accountId": "acc_123",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "S-2025-11-09T16:40:00Z"
}
```

**List Sessions**
```bash
GET /v1/sessions?accountId=acc_123

Response:
{
  "sessions": [
    {
      "sessionId": "S-2025-11-09T16:40:00Z",
      "deviceId": "550e8400-e29b-41d4-a716-446655440000",
      "startedAt": 1731172800000,
      "finishedAt": 1731176400000,
      "events": 123
    }
  ]
}
```

### Event Ingestion

**Batch Insert**
```bash
POST /v1/events/batch
Authorization: Bearer <deviceToken>

{
  "accountId": "acc_123",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "S-2025-11-09T16:40:00Z",
  "events": [
    {
      "id": "E-2025-11-09T16:42:31.123Z-00042",
      "seenAt": 1731172951123,
      "payload": {
        "id": "E-2025-11-09T16:42:31.123Z-00042",
        "sessionId": "S-2025-11-09T16:40:00Z",
        "platformGuess": "instagram",
        "seenAt": 1731172951123,
        "block": {
          "text": "full OCR block...",
          "lines": [{"t": "...", "conf": 0.97}],
          "bbox": [24, 180, 1080, 860],
          "lang": "en"
        },
        "features": {
          "author": "username",
          "ageHint": "2h",
          "metrics": {"likes": 1204, "comments": 87},
          "links": ["http://link.com"],
          "hashtags": ["hashtag"]
        },
        "quality": {
          "ocrConfidenceAvg": 0.965,
          "frameQuality": "med",
          "dedupScore": 0.12
        },
        "source": "screen_broadcast",
        "schema": 2
      }
    }
  ]
}

Response:
{
  "accepted": 1,
  "skipped": 0
}
```

**List Events**
```bash
GET /v1/events?accountId=acc_123&sessionId=S-2025-11-09T16:40:00Z&limit=1000&offset=0

Response:
{
  "events": [...],
  "nextOffset": 1000
}
```

### Account Management

**Erase Account Data**
```bash
POST /v1/account/erase
Authorization: Bearer <deviceToken>

{
  "accountId": "acc_123"
}

Response:
{
  "erasedEvents": 543,
  "erasedSessions": 12
}
```

## Database Schema

### Events Table
- `eventId` (PK): Unique event identifier
- `accountId`: User account identifier
- `deviceId`: Device that captured the event
- `sessionId`: Capture session identifier
- `seenAt`: Unix timestamp (ms) when event was seen
- `payload`: JSON string of the rich event data
- `createdAt`: Unix timestamp (ms) when inserted

### Sessions Table
- `sessionId` (PK): Unique session identifier
- `accountId`: User account identifier
- `deviceId`: Device that started the session
- `startedAt`: Unix timestamp (ms) when session started
- `finishedAt`: Unix timestamp (ms) when session ended (nullable)

### Devices Table
- `deviceId` (PK): Unique device identifier
- `accountId`: User account identifier
- `deviceToken`: Authentication token for the device
- `expiresAt`: Unix timestamp (ms) when token expires
- `createdAt`: Unix timestamp (ms) when device was registered

## Project Structure

```
services/ingest-api/
├── src/
│   ├── index.ts           # Express server setup and main routes
│   ├── db.ts              # Database initialization and migrations
│   ├── auth.ts            # Authentication middleware
│   └── routes/
│       ├── devices.ts     # Device registration
│       ├── sessions.ts    # Session start/finish
│       ├── events.ts      # Event batch ingestion
│       └── account.ts     # Account erasure
├── data/
│   └── .gitkeep           # Database storage directory
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## License

MIT
