import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricPreviewCardProps {
  title: string;
  pill: string;
  subtitle: string;
  description: string;
  icon?: LucideIcon;
  pillColor: string;
  scale?: string;
  onLearnMore?: () => void;
}

export function MetricPreviewCard({
  title,
  pill,
  subtitle,
  description,
  icon: Icon,
  pillColor,
  scale,
  onLearnMore
}: MetricPreviewCardProps) {
  return (
    <div className="group bg-surface-1 rounded-xl p-5 shadow-card border border-stroke hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-tone-green/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {Icon ? (
            <Icon className="w-6 h-6 text-tone-green" />
          ) : (
            <span className="font-bold text-lg">{pill}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="text-xs text-ink-3">{subtitle}</p>
        </div>
      </div>

      <p className="text-sm text-ink-2 leading-relaxed mb-3">
        {description}
      </p>

      {scale && (
        <p className="text-xs text-ink-3 mt-2 pt-2 border-t border-stroke">
          {scale}
        </p>
      )}
    </div>
  );
}
