import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { log, logError } from './utils';

/**
 * Generate a secure random token (32 bytes = 64 hex chars)
 */
export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Middleware: verify API key if API_KEY_MODE=enabled
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const mode = process.env.API_KEY_MODE || 'disabled';

  if (mode === 'disabled') {
    return next();
  }

  const providedKey = req.headers['x-api-key'];
  const expectedKey = process.env.INGEST_API_KEY;

  if (!providedKey) {
    res.status(401).json({ error: 'Missing x-api-key header' });
    return;
  }

  if (providedKey !== expectedKey) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}

/**
 * Validate device token and verify it belongs to the specified account
 * Throws an error if validation fails
 */
export function validateDeviceToken(
  db: Database.Database,
  deviceToken: string,
  accountId: string
): { deviceId: string; accountId: string; expiresAt: number } {
  if (!deviceToken || typeof deviceToken !== 'string' || deviceToken.trim().length === 0) {
    throw new Error('Invalid device token');
  }

  const token = deviceToken.trim();

  // Look up device by token
  const stmt = db.prepare(`
    SELECT deviceId, accountId, expiresAt
    FROM Devices
    WHERE deviceToken = ?
  `);

  const device = stmt.get(token) as { deviceId: string; accountId: string; expiresAt: number } | undefined;

  if (!device) {
    throw new Error('Invalid device token');
  }

  // Check if token expired
  if (device.expiresAt < Date.now()) {
    throw new Error('Device token expired');
  }

  // Verify accountId matches
  if (device.accountId !== accountId) {
    log('Device token accountId mismatch', { tokenAccountId: device.accountId, requestAccountId: accountId });
    throw new Error('Device token does not belong to the specified account');
  }

  return device;
}

/**
 * Middleware: verify device token from Authorization header
 * Attaches device info to req.device
 */
export function requireDeviceToken(db: Database.Database) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header. Expected: Bearer <deviceToken>' });
        return;
      }

      const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix

      if (token.length === 0) {
        res.status(401).json({ error: 'Device token cannot be empty' });
        return;
      }

      // Look up device by token
      const stmt = db.prepare(`
        SELECT deviceId, accountId, expiresAt
        FROM Devices
        WHERE deviceToken = ?
      `);

      const device = stmt.get(token) as { deviceId: string; accountId: string; expiresAt: number } | undefined;

      if (!device) {
        res.status(401).json({ error: 'Invalid device token' });
        return;
      }

      // Check if token expired
      if (device.expiresAt < Date.now()) {
        res.status(401).json({ error: 'Device token expired' });
        return;
      }

      // Attach device info to request for downstream handlers
      (req as any).device = device;

      next();
    } catch (error) {
      logError('Error validating device token', error);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  };
}
