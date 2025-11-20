import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { requireDeviceToken } from '../auth';
import { validateAccountEraseRequest } from '../validation';
import { log, logError } from '../utils';
import type { AccountEraseResponse } from '../types';

export function createAccountRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * POST /v1/account/erase
   * Erase all data for an account
   */
  router.post('/erase', requireDeviceToken(db), (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = validateAccountEraseRequest(req.body);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { accountId } = validation.data;

      // Verify device token belongs to the account
      const device = (req as any).device;
      if (device.accountId !== accountId) {
        res.status(401).json({ error: 'Device token does not belong to the specified account' });
        return;
      }

      // Delete events and sessions in a transaction
      const deleteEvents = db.prepare('DELETE FROM Events WHERE accountId = ?');
      const deleteSessions = db.prepare('DELETE FROM Sessions WHERE accountId = ?');

      const transaction = db.transaction((accId: string) => {
        const eventsResult = deleteEvents.run(accId);
        const sessionsResult = deleteSessions.run(accId);
        return {
          erasedEvents: eventsResult.changes,
          erasedSessions: sessionsResult.changes,
        };
      });

      const result = transaction(accountId);

      log('Account data erased', { accountId, ...result });

      const response: AccountEraseResponse = {
        erasedEvents: result.erasedEvents,
        erasedSessions: result.erasedSessions,
      };

      res.status(200).json(response);
    } catch (error) {
      logError('Error erasing account data', error);
      res.status(500).json({ error: 'Failed to erase account data' });
    }
  });

  return router;
}
