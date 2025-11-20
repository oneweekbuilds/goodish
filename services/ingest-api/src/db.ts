import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Initialize SQLite database with schema migrations
 */
export function initDatabase(dbPath: string): Database.Database {
  // Extract directory from DATABASE_URL and ensure it exists
  const parsedPath = dbPath.replace('file:', '');
  const dir = path.dirname(parsedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(parsedPath, { verbose: console.log });

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  runMigrations(db);

  return db;
}

/**
 * Create tables if they don't exist
 */
function runMigrations(db: Database.Database): void {
  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Events (
      eventId TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      deviceId TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      seenAt INTEGER NOT NULL,
      payload TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // Index for querying events by session
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_events_session
    ON Events(accountId, sessionId, seenAt DESC);
  `);

  // Index for querying events by account
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_events_account
    ON Events(accountId, createdAt DESC);
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Sessions (
      sessionId TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      deviceId TEXT NOT NULL,
      startedAt INTEGER NOT NULL,
      finishedAt INTEGER
    );
  `);

  // Index for querying sessions by account
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_account
    ON Sessions(accountId, startedAt DESC);
  `);

  // Devices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Devices (
      deviceId TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      deviceToken TEXT NOT NULL UNIQUE,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // Index for looking up device by token
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_devices_token
    ON Devices(deviceToken);
  `);

  console.log('✓ Database schema ready');
}

export default initDatabase;
