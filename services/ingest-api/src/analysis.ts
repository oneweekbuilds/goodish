import Database from 'better-sqlite3';

export interface AccountAnalysis {
  accountId: string;
  totalEvents: number;
  totalSessions: number;
  platforms: Record<string, number>;
  oldestEvent: number | null;
  newestEvent: number | null;
}

/**
 * Analyze account data: events, sessions, platforms, and time range
 */
export function getAccountAnalysis(db: Database.Database, accountId: string): AccountAnalysis {
  // Count total events
  const eventCountStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM Events
    WHERE accountId = ?
  `);
  const eventCount = (eventCountStmt.get(accountId) as { count: number }).count;

  // Count total sessions
  const sessionCountStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM Sessions
    WHERE accountId = ?
  `);
  const sessionCount = (sessionCountStmt.get(accountId) as { count: number }).count;

  // Get time range
  const timeRangeStmt = db.prepare(`
    SELECT MIN(seenAt) as oldest, MAX(seenAt) as newest
    FROM Events
    WHERE accountId = ?
  `);
  const timeRange = timeRangeStmt.get(accountId) as { oldest: number | null; newest: number | null };

  // Extract platforms from event payloads
  const eventsStmt = db.prepare(`
    SELECT payload
    FROM Events
    WHERE accountId = ?
  `);
  const eventRows = eventsStmt.all(accountId) as Array<{ payload: string }>;

  const platforms: Record<string, number> = {};
  for (const row of eventRows) {
    try {
      const payload = JSON.parse(row.payload) as Record<string, unknown>;
      const platform = typeof payload.platformGuess === 'string' 
        ? payload.platformGuess.trim() 
        : 'unknown';
      
      if (platform.length > 0) {
        platforms[platform] = (platforms[platform] || 0) + 1;
      }
    } catch {
      // Skip invalid payloads
    }
  }

  return {
    accountId,
    totalEvents: eventCount,
    totalSessions: sessionCount,
    platforms,
    oldestEvent: timeRange.oldest,
    newestEvent: timeRange.newest,
  };
}




