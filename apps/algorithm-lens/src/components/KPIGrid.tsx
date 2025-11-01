import React from 'react';
export function KPIGrid({items,platformCount,topicCount}:{items:number;platformCount:number;topicCount:number;}){
  const Tile=({label,value}:{label:string;value:string|number})=>(
    <div className="rounded-2xl border border-line bg-panel shadow-e1 p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-inkMuted">{label}</div>
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Tile label="Items analyzed" value={items.toLocaleString()}/>
      <Tile label="Platforms" value={platformCount}/>
      <Tile label="Topics detected" value={topicCount}/>
    </div>
  );
}
