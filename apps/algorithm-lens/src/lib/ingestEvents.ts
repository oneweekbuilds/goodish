import type { EventRow } from "./api";

const LS_DATASET = "alg_dataset";

export type IngestSummary = {
  accountId: string;
  added: number;
  skipped: number;
  totalForAccount: number;
};

type DatasetStore = {
  [accountId: string]: {
    events: EventRow[];
    sessions: {
      [sessionId: string]: number; // count of ingested events per session
    };
  };
};

function loadStore(): DatasetStore {
  try {
    const raw = localStorage.getItem(LS_DATASET);
    if (!raw) return {};
    return JSON.parse(raw) as DatasetStore;
  } catch {
    return {};
  }
}

function saveStore(store: DatasetStore) {
  localStorage.setItem(LS_DATASET, JSON.stringify(store));
}

export function ingestEvents(accountId: string, events: EventRow[]): IngestSummary {
  const store = loadStore();
  if (!store[accountId]) {
    store[accountId] = { events: [], sessions: {} };
  }

  const existing = store[accountId].events;
  const byId = new Map<string, EventRow>(existing.map(e => [e.id, e]));

  let added = 0;
  for (const ev of events) {
    if (!byId.has(ev.id)) {
      byId.set(ev.id, ev);
      added += 1;
      // per-session counts
      const sessionId = ev.sessionId || 'unknown';
      store[accountId].sessions[sessionId] = (store[accountId].sessions[sessionId] || 0) + 1;
    }
  }

  const merged = Array.from(byId.values()).sort((a, b) => a.ts - b.ts);
  store[accountId].events = merged;

  saveStore(store);

  const summary: IngestSummary = {
    accountId,
    added,
    skipped: events.length - added,
    totalForAccount: merged.length,
  };

  // eslint-disable-next-line no-console
  console.log("[ingestEvents] summary:", summary);
  return summary;
}
