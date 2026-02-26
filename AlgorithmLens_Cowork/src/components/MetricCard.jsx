import React from 'react';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  className = ''
}) => {
  const trendColors = {
    up: 'text-status-success bg-status-success/5',
    down: 'text-slate-500 bg-slate-100',
    neutral: 'text-text-muted bg-primary-blue/5',
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border border-border-light p-6 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-text-muted uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 bg-primary-blue/5 rounded-lg">
            <Icon size={18} className="text-primary-blue" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-text-main">{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendColors[trendDirection]}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default MetricCard;






