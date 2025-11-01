import React from 'react';
import { useDataStore } from "../lib/db";

export function ImportLog(){
  const imports = useDataStore((state) => state.imports);
  const logs = imports.slice(0, 10); // Get last 10 imports
  if(!logs?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-panel shadow-e1 p-4">
      <div className="text-lg font-semibold mb-2">Recent Imports</div>
      <div className="divide-y divide-line">
        {logs.map(l=>(
          <div key={l.id} className="py-2 flex justify-between text-sm gap-4">
            <div className="truncate flex-1">{l.label}</div>
            <div className="text-inkMuted capitalize">{l.platform}</div>
            <div className="text-pos">+{l.itemsAdded}</div>
            <div className="text-inkMuted">skip {l.itemsSkipped}</div>
            <div className="text-inkMuted">{(l.ms/1000).toFixed(2)}s</div>
          </div>
        ))}
      </div>
    </div>
  );
}
