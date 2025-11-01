import { motion } from 'motion/react';

interface DiversityGaugeProps {
  score: number; // 0-100
  label: string;
}

export function DiversityGauge({ score, label }: DiversityGaugeProps) {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score < 40) return '#f59e0b';
    if (score < 70) return '#14b8a6';
    return '#8b5cf6';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="mt-4 text-center">
        <p className="text-3xl mb-1" style={{ fontWeight: 700, fontFamily: 'var(--font-headline)', color: getColor(score) }}>
          {score}%
        </p>
        <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>{label}</p>
      </div>
    </div>
  );
}
