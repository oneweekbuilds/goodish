import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#01B1C0","#725cfd","#ff7a59","#2ec27e","#f2c94c","#eb5757","#56ccf2","#bb6bd9"];

export function TopCreators({data}:{data:{creator:string;count:number}[]}){
  if(!data.length){
    return (
      <div className="rounded-2xl border border-line bg-panel shadow-e1 p-6" role="region" aria-label="Top creators chart">
        <h3 className="text-lg font-semibold mb-4">Top Creators</h3>
        <div className="h-64 flex items-center justify-center text-inkMuted">
          No insights yet. Connect your data or try sample files.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-panel shadow-e1 p-6" role="region" aria-label="Top creators chart">
      <h3 className="text-lg font-semibold mb-4">Top Creators</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#efe7d9"/>
          <XAxis type="number" tick={{fontSize:12}} stroke="#5b5f6a"/>
          <YAxis type="category" dataKey="creator" tick={{fontSize:12}} stroke="#5b5f6a" width={100}/>
          <Tooltip contentStyle={{background:"#fff",border:"1px solid #e9e5dc",borderRadius:"8px"}}/>
          <Bar dataKey="count" name="Items">
            {data.map((entry,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
