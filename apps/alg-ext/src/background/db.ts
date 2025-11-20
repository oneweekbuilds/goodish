import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { QueuedEvent } from '../types';

/**
 * IndexedDB schema
 */
interface LensDB extends DBSchema {
  queue: {
    key: string;
    value: QueuedEvent;
    indexes: {
      'by-session': string;
      'by-created': number;
    };
  };
}

let dbInstance: IDBPDatabase<LensDB> | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<LensDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<LensDB>('lens-queue', 1, {
    upgrade(db) {
      // Create queue store
      const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
      queueStore.createIndex('by-session', 'sessionId');
      queueStore.createIndex('by-created', 'createdAt');
    }
  });

  return dbInstance;
}

/**
 * Add event to queue
 */
export async function queueEvent(event: QueuedEvent): Promise<void> {
  const db = await initDB();
  await db.add('queue', event);
}

/**
 * Get queued events (up to limit)
 */
export async function getQueuedEvents(limit: number = 200): Promise<QueuedEvent[]> {
  const db = await initDB();
  const tx = db.transaction('queue', 'readonly');
  const index = tx.store.index('by-created');

  const events: QueuedEvent[] = [];
  let cursor = await index.openCursor();

  while (cursor && events.length < limit) {
    events.push(cursor.value);
    cursor = await cursor.continue();
  }

  return events;
}

/**
 * Delete events by IDs
 */
export async function deleteEvents(ids: string[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('queue', 'readwrite');

  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
}

/**
 * Get queue size
 */
export async function getQueueSize(): Promise<number> {
  const db = await initDB();
  return await db.count('queue');
}

/**
 * Clear entire queue (for testing)
 */
export async function clearQueue(): Promise<void> {
  const db = await initDB();
  await db.clear('queue');
}
