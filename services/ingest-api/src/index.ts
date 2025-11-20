import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import initDatabase from './db';
import { requireApiKey } from './auth';
import { createDevicesRouter } from './routes/devices';
import { createSessionsRouter } from './routes/sessions';
import { createEventsRouter } from './routes/events';
import { createAccountRouter } from './routes/account';
import { log, logError, logInfo } from './utils';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5050;
const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/ingest.sqlite';

// Initialize database
const db = initDatabase(DATABASE_URL);

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Apply API key middleware to all /v1/* routes
app.use('/v1', requireApiKey);

// Mount routers
app.use('/v1/devices', createDevicesRouter(db));
app.use('/v1/sessions', createSessionsRouter(db));
app.use('/v1/events', createEventsRouter(db));
app.use('/v1/account', createAccountRouter(db));

/**
 * GET /v1/sessions?accountId=acc_123
 * List sessions for an account (for dashboard)
 */
app.get('/v1/sessions', requireApiKey, (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;

    if (!accountId || typeof accountId !== 'string' || accountId.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid accountId query parameter' });
      return;
    }

    const trimmedAccountId = accountId.trim();

    // Query sessions with event counts
    const stmt = db.prepare(`
      SELECT
        s.sessionId,
        s.deviceId,
        s.startedAt,
        s.finishedAt,
        COUNT(e.eventId) as events
      FROM Sessions s
      LEFT JOIN Events e ON s.sessionId = e.sessionId AND s.accountId = e.accountId
      WHERE s.accountId = ?
      GROUP BY s.sessionId
      ORDER BY s.startedAt DESC
    `);

    const sessions = stmt.all(trimmedAccountId) as Array<{
      sessionId: string;
      deviceId: string;
      startedAt: number;
      finishedAt: number | null;
      events: number;
    }>;

    log('Sessions queried', { accountId: trimmedAccountId, count: sessions.length });

    res.status(200).json({ sessions });
  } catch (error) {
    logError('Error querying sessions', error);
    res.status(500).json({ error: 'Failed to query sessions' });
  }
});

/**
 * GET /v1/events?accountId=acc_123&sessionId=S-...&limit=1000&offset=0
 * List events for a session (paginated)
 */
app.get('/v1/events', requireApiKey, (req: Request, res: Response) => {
  try {
    const { accountId, sessionId, limit, offset } = req.query;

    if (!accountId || typeof accountId !== 'string' || accountId.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid accountId query parameter' });
      return;
    }

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid sessionId query parameter' });
      return;
    }

    const trimmedAccountId = accountId.trim();
    const trimmedSessionId = sessionId.trim();

    // Verify session exists and belongs to account
    const sessionCheck = db.prepare(`
      SELECT sessionId FROM Sessions
      WHERE sessionId = ? AND accountId = ?
    `);
    const session = sessionCheck.get(trimmedSessionId, trimmedAccountId);
    if (!session) {
      res.status(404).json({ error: 'Session not found or does not belong to this account' });
      return;
    }

    const limitNum = parseInt(limit as string || '1000', 10);
    const offsetNum = parseInt(offset as string || '0', 10);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 10000) {
      res.status(400).json({ error: 'Invalid limit (must be between 1 and 10000)' });
      return;
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      res.status(400).json({ error: 'Invalid offset (must be >= 0)' });
      return;
    }

    // Query events with pagination
    const stmt = db.prepare(`
      SELECT eventId, seenAt, payload
      FROM Events
      WHERE accountId = ? AND sessionId = ?
      ORDER BY seenAt ASC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(trimmedAccountId, trimmedSessionId, limitNum, offsetNum) as Array<{
      eventId: string;
      seenAt: number;
      payload: string;
    }>;

    // Parse JSON payloads
    const events = rows.map(row => {
      try {
        return {
          eventId: row.eventId,
          seenAt: row.seenAt,
          payload: JSON.parse(row.payload),
        };
      } catch (error) {
        log('Error parsing event payload', { eventId: row.eventId, error });
        return {
          eventId: row.eventId,
          seenAt: row.seenAt,
          payload: null,
        };
      }
    });

    const nextOffset = events.length === limitNum ? offsetNum + limitNum : null;

    log('Events queried', {
      accountId: trimmedAccountId,
      sessionId: trimmedSessionId,
      count: events.length,
      nextOffset,
    });

    res.status(200).json({
      events,
      nextOffset,
    });
  } catch (error) {
    logError('Error querying events', error);
    res.status(500).json({ error: 'Failed to query events' });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logError('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logInfo(`Ingest API listening on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, closing database...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logInfo('SIGINT received, closing database...');
  db.close();
  process.exit(0);
});
