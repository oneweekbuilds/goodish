import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HorizontalStackedBarProps {
  data: Array<{
    name: string;
    left: number;
    neutral: number;
    right: number;
  }>;
  className?: string;
}

export function HorizontalStackedBar({ data, className = '' }: HorizontalStackedBarProps) {
  const colors = {
    left: '#3B82F6',    // Blue
    neutral: '#6B7280', // Gray
    right: '#EF4444'    // Red
  };

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-neutral-900">{label}</p>
                    {payload.map((entry, index) => (
                      <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}%
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="left" stackId="a" fill={colors.left} name="Left" />
          <Bar dataKey="neutral" stackId="a" fill={colors.neutral} name="Neutral" />
          <Bar dataKey="right" stackId="a" fill={colors.right} name="Right" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}



















