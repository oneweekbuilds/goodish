import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TopicDonutProps {
  data: Array<{ name: string; value: number; color: string }>;
  title?: string;
}

export function TopicDonut({ data, title }: TopicDonutProps) {
  return (
    <div>
      {title && (
        <h4 className="text-center mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `${value}%`}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e5e5e5',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => `${value}: ${entry.payload.value}%`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
