import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function SentimentTrend({data}:{data:{date:string;pos:number;neu:number;neg:number;total:number}[]}){
  if(!data.length){
    return (
      <div className="rounded-2xl border border-line bg-panel shadow-e1 p-6" role="region" aria-label="Sentiment trend chart">
        <h3 className="text-lg font-semibold mb-4">Sentiment Over Time</h3>
        <div className="h-64 flex items-center justify-center text-inkMuted">
          No insights yet. Connect your data or try sample files.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-panel shadow-e1 p-6" role="region" aria-label="Sentiment trend chart">
      <h3 className="text-lg font-semibold mb-4">Sentiment Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2ec27e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#2ec27e" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorNeu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c1c7d0" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#c1c7d0" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eb5757" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#eb5757" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#efe7d9"/>
          <XAxis dataKey="date" tick={{fontSize:12}} stroke="#5b5f6a" label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#5b5f6a' } }}/>
          <YAxis tick={{fontSize:12}} stroke="#5b5f6a" label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#5b5f6a' } }}/>
          <Tooltip contentStyle={{background:"#fff",border:"1px solid #e9e5dc",borderRadius:"8px"}}/>
          <Legend verticalAlign="top" height={36}/>
          <Area type="monotone" dataKey="pos" stackId="1" stroke="#2ec27e" fillOpacity={1} fill="url(#colorPos)" name="Positive"/>
          <Area type="monotone" dataKey="neu" stackId="1" stroke="#c1c7d0" fillOpacity={1} fill="url(#colorNeu)" name="Neutral"/>
          <Area type="monotone" dataKey="neg" stackId="1" stroke="#eb5757" fillOpacity={1} fill="url(#colorNeg)" name="Negative"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
