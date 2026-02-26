import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * BigNumber - PREMIER QUALITY
 * Big number display with optional radial gauge for percentages.
 * Features: richer gauge, tighter tracking on numbers, refined typography.
 *
 * @param {string|number} value - The main value to display
 * @param {string} label - Label below the number
 * @param {string} color - Tailwind text color class
 * @param {boolean} deemphasize - Make number secondary
 * @param {string} benchmark - Optional benchmark text (e.g., "Typical: 40-60%")
 */
const BigNumber = ({ value, label, color = 'text-text-main', className = '', deemphasize = false, benchmark }) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Detect if value is a percentage for gauge rendering
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPercentage = typeof value === 'string' && value.includes('%');
  const showGauge = isPercentage && !deemphasize && numericValue >= 0 && numericValue <= 100;

  // Count-up animation effect
  useEffect(() => {
    if (isNaN(numericValue)) {
      return;
    }

    const animationDuration = 900;
    let startTime;
    let animationFrameId;

    const animate = (currentTime) => {
      if (!startTime) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      // Ease-out cubic for smoother deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = eased * numericValue;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [numericValue]);

  // Format the display value to match the original format
  const formatDisplayValue = () => {
    if (isNaN(numericValue)) {
      return value;
    }

    let decimalPlaces = 0;
    if (typeof value === 'string') {
      const withoutPercent = value.replace('%', '');
      const parts = withoutPercent.split('.');
      if (parts.length > 1) {
        decimalPlaces = parts[1].length;
      }
    } else if (typeof value === 'number') {
      const stringValue = value.toString();
      const parts = stringValue.split('.');
      if (parts.length > 1) {
        decimalPlaces = parts[1].length;
      }
    }

    const formattedNumber = displayValue.toFixed(decimalPlaces);
    return isPercentage ? `${formattedNumber}%` : formattedNumber;
  };

  const gaugeRadius = 54;
  const gaugeStroke = 8;
  const circumference = 2 * Math.PI * gaugeRadius;
  const progress = showGauge ? (numericValue / 100) * circumference : 0;

  // Create aria-label with final value for screen readers
  const finalValueDisplay = (() => {
    if (isNaN(numericValue)) {
      return value;
    }
    const decimalPlaces = typeof value === 'string' ? (value.replace('%', '').split('.')[1]?.length || 0) : 0;
    const formattedNumber = numericValue.toFixed(decimalPlaces);
    return isPercentage ? `${formattedNumber}%` : formattedNumber;
  })();

  const ariaLabelText = label ? `${finalValueDisplay} ${label}` : finalValueDisplay;

  return (
    <motion.div
      className="text-center py-3"
      role="status"
      aria-label={ariaLabelText}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {showGauge ? (
        <div className="relative inline-flex items-center justify-center" style={{ width: 128, height: 128 }}>
          <svg width="128" height="128" viewBox="0 0 128 128" className="absolute">
            {/* Background circle */}
            <circle
              cx="64" cy="64" r={gaugeRadius}
              fill="none"
              stroke="rgba(37, 99, 235, 0.08)"
              strokeWidth={gaugeStroke}
            />
            {/* Progress arc */}
            <motion.circle
              cx="64" cy="64" r={gaugeRadius} fill="none"
              stroke="url(#gaugeGradient)" strokeWidth={gaugeStroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              transform="rotate(-90 64 64)"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className={`font-bold ${color} ${className}`}
            style={{
              fontSize: '1.875rem',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {formatDisplayValue()}
          </div>
        </div>
      ) : (
        <div
          className={`font-bold ${color} mb-1 ${deemphasize ? 'opacity-60' : ''} ${className}`}
          style={{
            fontSize: deemphasize ? 'clamp(1.25rem, 3vw, 1.5rem)' : 'clamp(1.75rem, 5vw, 2.5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {formatDisplayValue()}
        </div>
      )}
      {label && (
        <p className="text-sm text-text-muted mt-2 font-medium">{label}</p>
      )}
      {benchmark && (
        <p className="text-xs text-text-muted mt-1.5 italic" style={{ letterSpacing: '0.01em' }}>{benchmark}</p>
      )}
    </motion.div>
  );
};

export default BigNumber;
