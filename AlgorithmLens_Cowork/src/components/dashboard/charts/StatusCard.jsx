import React from 'react';

/**
 * Status card component showing a status with icon.
 *
 * @param {string} status - Status text (e.g., "Balanced", "Skewed", "Narrow")
 * @param {string} variant - 'positive' | 'warning' | 'negative' | 'neutral'
 * @param {string} description - Optional description below status
 */
const StatusCard = ({ status, variant = 'neutral', description }) => {
  const variants = {
    positive: {
      bg: 'bg-status-success/5',
      border: 'border-status-success/20',
      text: 'text-status-success',
      icon: (
        <svg className="w-6 h-6 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      icon: (
        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    negative: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      icon: (
        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    neutral: {
      bg: 'bg-primary-blue/5',
      border: 'border-primary-blue/20',
      text: 'text-text-main',
      icon: (
        <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const v = variants[variant] || variants.neutral;

  return (
    <div className={`rounded-xl p-5 ${v.bg} border ${v.border}`}>
      <div className="flex items-center gap-3 mb-2">
        {v.icon}
        <span className={`text-xl font-bold ${v.text}`}>{status}</span>
      </div>
      {description && (
        <p className={`text-sm ${v.text} opacity-80`}>{description}</p>
      )}
    </div>
  );
};

export default StatusCard;
