import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#01B1C0","#725cfd","#ff7a59","#2ec27e","#f2c94c","#eb5757","#56ccf2","#bb6bd9"];

export function TopicDonut({data}:{data:{topic:string;pct:number;n:number}[]}){
  if(!data.length){
    return (
      <div className="rounded-2xl border border-line bg-panel shadow-e1 p-6" role="region" aria-label="Topic mix donut chart">
        <h3 className="text-lg font-semibold mb-4">Topic Mix</h3>
        <div className="h-64 flex items-center justify-center text-inkMuted">
          No insights yet. Connect your data or try sample files.
        </div>
      </div>
    );
  }

  const total = data.reduce((acc,d)=>acc+d.n,0);
  const chartData = data.map((d,i)=>({name:d.topic,value:d.n,pct:d.pct,color:COLORS[i%COLORS.length]}));

  return (
    <div className="rounded-2xl border border-line bg-panel shadow-e1 p-6" role="region" aria-label="Topic mix donut chart">
      <h3 className="text-lg font-semibold mb-4">Topic Mix</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} label={(e)=>`${e.pct.toFixed(1)}%`}>
            {chartData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
          </Pie>
          <Tooltip formatter={(v:number)=>[`${v} items`,""]} contentStyle={{background:"#fff",border:"1px solid #e9e5dc",borderRadius:"8px"}}/>
          <Legend verticalAlign="bottom" height={36} formatter={(value)=>value.charAt(0).toUpperCase()+value.slice(1)}/>
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2 text-sm text-inkMuted">{total.toLocaleString()} total items</div>
    </div>
  );
}
