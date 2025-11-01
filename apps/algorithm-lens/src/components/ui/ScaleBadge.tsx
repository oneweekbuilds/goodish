import React from 'react';

interface ScaleBadgeProps {
  label: string;
  range: string;
  className?: string;
}

export function ScaleBadge({ label, range, className = '' }: ScaleBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs ${className}`}>
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{range}</span>
    </div>
  );
}
