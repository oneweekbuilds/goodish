import React from 'react';
export function RadialTile({label,value,color}:{label:string;value:number;color:string}){
  const r = 45, c = 2*Math.PI*r, pct = Math.max(0, Math.min(100, value));
  const off = c*(1-pct/100);
  return (
    <div className="rounded-2xl border border-[#e9e5dc] bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center" role="group" aria-label={label}>
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <circle cx="60" cy="60" r={r} stroke="#efe7d9" strokeWidth="10" fill="none"/>
        <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 60 60)">
          <animate attributeName="stroke-dashoffset" from={c} to={off} dur="0.45s" fill="freeze"/>
        </circle>
        <text x="50%" y="50%" dy="8" textAnchor="middle" className="text-xl font-semibold fill-[#0e0f11]">{pct}%</text>
      </svg>
      <div className="mt-2 text-sm text-[#5b5f6a] text-center">{label}</div>
    </div>
  );
}
