import { db, NormalizedItem, Platform } from "./db";
import { parseAnyFile } from "./parse";
import { classify } from "./classify";

export async function importFile(name:string, bytes:Uint8Array, platformHint?:Platform|"unknown"){
  const t0 = performance.now();
  const parsed: NormalizedItem[] = await parseAnyFile(name, bytes);
  const enriched = classify(parsed);
  const keys = await db.items.where("id").anyOf(enriched.map(x=>x.id)).primaryKeys();
  const existing = new Set(keys as string[]);
  const fresh = enriched.filter(x=>!existing.has(x.id));
  if (fresh.length) await db.items.bulkPut(fresh);
  await db.imports.add({
    platform: platformHint ?? (fresh[0]?.platform ?? "unknown"),
    addedAt: Date.now(),
    label: name,
    itemsAdded: fresh.length,
    itemsSkipped: enriched.length - fresh.length,
    ms: Math.round(performance.now() - t0),
  });
  return { added: fresh.length, skipped: enriched.length - fresh.length };
}
