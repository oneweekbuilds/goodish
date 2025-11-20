import { motion } from 'motion/react';

interface ComparisonMetricProps {
  label: string;
  yourValue: number;
  avgValue: number;
  unit?: string;
  showComparison?: boolean;
}

export function ComparisonMetric({ 
  label, 
  yourValue, 
  avgValue, 
  unit = '%',
  showComparison = true 
}: ComparisonMetricProps) {
  const difference = yourValue - avgValue;
  const isHigher = difference > 0;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50">
      <span className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>{label}</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-2xl" style={{ fontWeight: 700, fontFamily: 'var(--font-headline)' }}>
            {yourValue}{unit}
          </p>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>You</p>
        </div>
        {showComparison && (
          <>
            <div className="w-px h-8 bg-border" />
            <div className="text-right">
              <p className="text-lg" style={{ color: 'var(--foreground-tertiary)' }}>
                {avgValue}{unit}
              </p>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Average</p>
            </div>
            <div className="text-right min-w-[60px]">
              <p 
                className="text-sm" 
                style={{ 
                  fontWeight: 600,
                  color: isHigher ? '#14b8a6' : '#ef4444' 
                }}
              >
                {isHigher ? '+' : ''}{difference}{unit}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}










