import { motion } from 'motion/react';

interface MiniChartProps {
  value: number;
  type?: 'progress' | 'donut' | 'bar';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MiniChart({ value, type = 'progress', color = '#14b8a6', size = 'md' }: MiniChartProps) {
  const sizes = {
    sm: { width: 48, height: 48, stroke: 4 },
    md: { width: 64, height: 64, stroke: 5 },
    lg: { width: 80, height: 80, stroke: 6 },
  };

  const { width, height, stroke } = sizes[size];

  if (type === 'donut') {
    const radius = (width - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <svg width={width} height={height} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <motion.circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
    );
  }

  if (type === 'bar') {
    return (
      <div className="flex items-end gap-1" style={{ height: height }}>
        {[...Array(5)].map((_, i) => {
          const barHeight = ((i + 1) / 5) * value;
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-t"
              style={{ backgroundColor: color, opacity: 0.7 + (i * 0.06) }}
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            />
          );
        })}
      </div>
    );
  }

  // Default: progress bar
  return (
    <div className="w-full bg-secondary rounded-full h-2">
      <motion.div
        className="h-2 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}










