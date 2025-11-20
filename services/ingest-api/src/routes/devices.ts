import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { generateUUID, generateDeviceToken } from '../auth';
import { validateDeviceRegisterRequest } from '../validation';
import { log, logError } from '../utils';
import type { DeviceRegisterResponse } from '../types';

export function createDevicesRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * POST /v1/devices/register
   * Register a new device and get credentials
   */
  router.post('/register', (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = validateDeviceRegisterRequest(req.body);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { accountId } = validation.data;

      // Generate device credentials
      const deviceId = generateUUID();
      const deviceToken = generateDeviceToken();
      const now = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now

      // Insert device
      const stmt = db.prepare(`
        INSERT INTO Devices (deviceId, accountId, deviceToken, expiresAt, createdAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(deviceId) DO UPDATE SET
          deviceToken = excluded.deviceToken,
          expiresAt = excluded.expiresAt
      `);

      stmt.run(deviceId, accountId, deviceToken, expiresAt, now);

      log('Device registered', { deviceId, accountId });

      const response: DeviceRegisterResponse = {
        deviceId,
        deviceToken,
        expiresAt,
      };

      res.status(200).json(response);
    } catch (error) {
      logError('Error registering device', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  });

  return router;
}
