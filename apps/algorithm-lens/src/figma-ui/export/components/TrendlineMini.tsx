import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendlineMiniProps {
  data: number[];
  label: string;
  change?: number;
}

export function TrendlineMini({ data, label, change }: TrendlineMiniProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const getTrendIcon = () => {
    if (!change) return <Minus size={14} />;
    if (change > 0) return <TrendingUp size={14} />;
    return <TrendingDown size={14} />;
  };

  const getTrendColor = () => {
    if (!change) return 'var(--foreground-muted)';
    if (change > 0) return '#14b8a6';
    return '#ef4444';
  };

  return (
    <div className="flex items-center gap-3">
      <svg width="80" height="32" className="flex-shrink-0">
        <motion.polyline
          points={points}
          fill="none"
          stroke="url(#miniGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--foreground-tertiary)' }}>{label}</span>
        {change !== undefined && (
          <span 
            className="flex items-center gap-1 text-xs" 
            style={{ color: getTrendColor(), fontWeight: 600 }}
          >
            {getTrendIcon()}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}










