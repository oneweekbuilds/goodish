import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireDeviceToken } from '../auth';
import { validateEventBatchRequest, normalizeTimestamp } from '../validation';
import { log, logError, extractEventType } from '../utils';
import type { EventBatchResponse, NormalizedEvent } from '../types';

export function createEventsRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * POST /v1/events/batch
   * Batch insert events (idempotent on eventId)
   */
  router.post('/batch', requireDeviceToken(db), (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = validateEventBatchRequest(req.body);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { accountId, deviceId, sessionId, events } = validation.data;

      // Verify device token belongs to the account
      const device = (req as any).device;
      if (device.accountId !== accountId) {
        res.status(401).json({ error: 'Device token does not belong to the specified account' });
        return;
      }

      // Verify deviceId matches
      if (device.deviceId !== deviceId) {
        res.status(400).json({ error: 'Device ID does not match the authenticated device' });
        return;
      }

      // Verify session exists and belongs to the account
      const sessionCheck = db.prepare(`
        SELECT sessionId FROM Sessions
        WHERE sessionId = ? AND accountId = ? AND deviceId = ?
      `);
      const session = sessionCheck.get(sessionId, accountId, deviceId);
      if (!session) {
        res.status(404).json({ error: 'Session not found or does not belong to this account' });
        return;
      }

      const now = Date.now();
      let accepted = 0;
      let skipped = 0;

      // Normalize and prepare events
      const normalizedEvents: NormalizedEvent[] = [];
      for (const event of events) {
        try {
          const ts = normalizeTimestamp(event.seenAt);
          const type = extractEventType(event.payload);

          normalizedEvents.push({
            eventId: event.id,
            accountId,
            deviceId,
            sessionId,
            ts,
            type,
            payload: event.payload,
          });
        } catch (error) {
          log('Skipping event with invalid timestamp', { eventId: event.id, error });
          skipped++;
        }
      }

      // Sort events by timestamp for consistent ordering
      normalizedEvents.sort((a, b) => a.ts - b.ts);

      // Use a transaction for batch insert
      const insertStmt = db.prepare(`
        INSERT INTO Events (eventId, accountId, deviceId, sessionId, seenAt, payload, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(eventId) DO NOTHING
      `);

      const transaction = db.transaction((evts: NormalizedEvent[]) => {
        let acc = 0;
        let skp = 0;

        for (const event of evts) {
          try {
            const payloadJson = JSON.stringify(event.payload);
            const result = insertStmt.run(
              event.eventId,
              event.accountId,
              event.deviceId,
              event.sessionId,
              event.ts,
              payloadJson,
              now
            );

            if (result.changes > 0) {
              acc++;
            } else {
              skp++;
            }
          } catch (error) {
            log('Error inserting event', { eventId: event.eventId, error });
            skp++;
          }
        }

        return { accepted: acc, skipped: skp };
      });

      const result = transaction(normalizedEvents);
      accepted = result.accepted;
      skipped = result.skipped + skipped; // Include events skipped during normalization

      log('Events batch processed', {
        sessionId,
        accountId,
        total: events.length,
        accepted,
        skipped,
      });

      const response: EventBatchResponse = {
        accepted,
        skipped,
      };

      res.status(200).json(response);
    } catch (error) {
      logError('Error processing event batch', error);
      res.status(500).json({ error: 'Failed to process event batch' });
    }
  });

  return router;
}
