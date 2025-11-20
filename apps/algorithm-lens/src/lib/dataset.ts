import type { EventRow } from "./api";

const LS_DATASET = "alg_dataset";

export type AccountDataset = {
  events: EventRow[];
  sessions: { [sessionId: string]: number };
};

type Store = {
  [accountId: string]: AccountDataset;
};

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(LS_DATASET);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

export function saveStore(store: Store) {
  localStorage.setItem(LS_DATASET, JSON.stringify(store));
}

export function getAccountDataset(accountId: string): AccountDataset | null {
  const store = loadStore();
  return store[accountId] || null;
}

export function clearAccountDataset(accountId: string) {
  const store = loadStore();
  if (store[accountId]) {
    delete store[accountId];
    saveStore(store);
  }
}

export function toJSONBlob(data: unknown): Blob {
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
}

export function toCSVBlob(events: EventRow[]): Blob {
  const headers = ["id","sessionId","accountId","ts","type"];
  const lines = [headers.join(",")];
  for (const e of events) {
    const row = [
      e.id,
      e.sessionId,
      e.accountId,
      String(e.ts),
      e.type ?? ""
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(row.join(","));
  }
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}
