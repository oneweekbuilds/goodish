import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#01B1C0","#725cfd","#ff7a59","#2ec27e","#f2c94c","#eb5757","#56ccf2","#bb6bd9"];

export function TrendComparison({data}:{data:any[]}){
  if(!data?.length) {
    return (
      <div className="rounded-2xl border border-[#e9e5dc] bg-white shadow-sm p-6" role="region" aria-label="Topic trends chart">
        <h3 className="text-lg font-semibold mb-4">Topic Trends</h3>
        <div className="h-64 flex items-center justify-center text-[#5b5f6a]">
          You'll see trends once you import data again.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e9e5dc] bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6" role="region" aria-label="Topic trends chart">
      <h3 className="text-lg font-semibold mb-4">Topic Trends</h3>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#efe7d9"/>
            <XAxis dataKey="date" stroke="#5b5f6a" tick={{fontSize:12}} label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#5b5f6a' } }}/>
            <YAxis stroke="#5b5f6a" tick={{fontSize:12}} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#5b5f6a' } }}/>
            <Tooltip contentStyle={{background:"#fff",border:"1px solid #e9e5dc",borderRadius:"8px",fontSize:"14px"}}/>
            <Legend verticalAlign="top" height={36}/>
            <Area type="monotone" dataKey="fitness" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.25} strokeWidth={2} isAnimationActive name="Fitness"/>
            <Area type="monotone" dataKey="politics" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.18} strokeWidth={2} isAnimationActive name="Politics"/>
            <Area type="monotone" dataKey="finance" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.18} strokeWidth={2} isAnimationActive name="Finance"/>
            <Area type="monotone" dataKey="entertainment" stroke={COLORS[6]} fill={COLORS[6]} fillOpacity={0.18} strokeWidth={2} isAnimationActive name="Entertainment"/>
            <Area type="monotone" dataKey="tech" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.12} strokeWidth={2} isAnimationActive name="Tech"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
