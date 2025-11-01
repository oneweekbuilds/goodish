import { motion } from 'motion/react';

interface SentimentSliderProps {
  value: number; // -100 to 100
  label: string;
}

export function SentimentSlider({ value, label }: SentimentSliderProps) {
  // Convert -100 to 100 range to 0 to 100 for positioning
  const position = ((value + 100) / 200) * 100;

  const getGradient = () => {
    return 'linear-gradient(to right, #ef4444 0%, #f59e0b 25%, #fbbf24 50%, #14b8a6 75%, #8b5cf6 100%)';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>{label}</span>
        <span className="text-sm" style={{ fontWeight: 600, color: 'var(--foreground)' }}>
          {value > 0 ? '+' : ''}{value}
        </span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: getGradient() }}>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-foreground shadow-lg"
          style={{ left: `calc(${position}% - 12px)` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Negative</span>
        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Neutral</span>
        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Positive</span>
      </div>
    </div>
  );
}
