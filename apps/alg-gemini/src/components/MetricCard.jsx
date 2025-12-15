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
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border border-slate-100 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon size={18} className="text-blue-600" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendColors[trendDirection]}`}>
            {trend}
          </span>
        )}
      </div>
      
      {subtitle && (
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default MetricCard;





