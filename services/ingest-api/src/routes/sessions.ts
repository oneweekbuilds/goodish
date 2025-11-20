import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireDeviceToken, validateDeviceToken } from '../auth';
import { validateSessionStartRequest, validateSessionFinishRequest } from '../validation';
import { log, logError } from '../utils';
import type { SessionStartResponse, SessionFinishResponse } from '../types';

export function createSessionsRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * POST /v1/sessions/start
   * Start a new capture session
   */
  router.post('/start', requireDeviceToken(db), (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = validateSessionStartRequest(req.body);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { accountId, deviceId, sessionId } = validation.data;

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

      const now = Date.now();

      // Insert session if it doesn't already exist (idempotent)
      const stmt = db.prepare(`
        INSERT INTO Sessions (sessionId, accountId, deviceId, startedAt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(sessionId) DO NOTHING
      `);

      const result = stmt.run(sessionId, accountId, deviceId, now);

      log('Session started', { sessionId, accountId, deviceId, inserted: result.changes > 0 });

      const response: SessionStartResponse = {
        success: true,
      };

      res.status(200).json(response);
    } catch (error) {
      logError('Error starting session', error);
      res.status(500).json({ error: 'Failed to start session' });
    }
  });

  /**
   * POST /v1/sessions/finish
   * Mark a session as finished
   */
  router.post('/finish', requireDeviceToken(db), (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = validateSessionFinishRequest(req.body);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { accountId, deviceId, sessionId } = validation.data;

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

      const now = Date.now();

      // Update finishedAt if session exists and belongs to the account
      const stmt = db.prepare(`
        UPDATE Sessions
        SET finishedAt = ?
        WHERE sessionId = ? AND accountId = ? AND deviceId = ?
      `);

      const result = stmt.run(now, sessionId, accountId, deviceId);

      if (result.changes === 0) {
        res.status(404).json({ error: 'Session not found or does not belong to this account' });
        return;
      }

      log('Session finished', { sessionId, accountId, deviceId });

      const response: SessionFinishResponse = {
        success: true,
      };

      res.status(200).json(response);
    } catch (error) {
      logError('Error finishing session', error);
      res.status(500).json({ error: 'Failed to finish session' });
    }
  });

  return router;
}
