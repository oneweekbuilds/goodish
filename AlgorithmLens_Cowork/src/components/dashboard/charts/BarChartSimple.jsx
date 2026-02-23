import React from 'react';
import { motion } from 'framer-motion';

/**
 * Horizontal bar chart with entrance animations.
 * @param {Array} data - Array of { label: string, value: number, color?: string }
 * @param {string} valueLabel - Label for values (e.g., "%" or "posts")
 * @param {number} maxBars - Maximum bars to show (default 5)
 */
const BarChartSimple = ({ data = [], valueLabel = '', maxBars = 5 }) => {
  if (!data || data.length === 0) return null;

  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map(d => d.value), 1);

  // Create a descriptive aria-label for screen readers
  const ariaLabel = displayData.length > 0
    ? `Bar chart showing ${displayData.map(d => `${d.label}: ${d.value}${valueLabel}`).join(', ')}`
    : 'Bar chart';

  return (
    <div className="space-y-2.5 sm:space-y-3" role="img" aria-label={ariaLabel}>
      {displayData.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.06 }}
          className="space-y-1"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs sm:text-sm text-text-main font-medium truncate max-w-[50%] sm:max-w-[70%]" title={item.label}>
              {item.label}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-text-main tabular-nums flex-shrink-0">
              {typeof item.value === 'number' && item.value % 1 !== 0
                ? item.value.toFixed(1)
                : item.value}
              {valueLabel}
            </span>
          </div>
          <div className="h-[18px] sm:h-[22px] bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
              style={{
                backgroundColor: item.color || '#3B82F6',
                minWidth: item.value > 0 ? '8px' : '0',
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BarChartSimple;
