import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ScatterPlotProps {
  data: Array<{
    x: number;
    y: number;
    category: string;
    percentage: number;
    brands: string[];
    color: string;
  }>;
  className?: string;
}

export function ScatterPlot({ data, className = '' }: ScatterPlotProps) {
  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Frequency"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Frequency', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Intensity"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-neutral-900">{data.category}</p>
                    <p className="text-sm text-neutral-600">{data.percentage}% of ads</p>
                    <p className="text-xs text-neutral-500">
                      Brands: {data.brands.join(', ')}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter dataKey="y" fill="#3B82F6">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}










