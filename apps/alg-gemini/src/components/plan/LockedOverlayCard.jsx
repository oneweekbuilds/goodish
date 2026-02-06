import React from 'react';
import { Lock } from 'lucide-react';
import UpgradeCTA from './UpgradeCTA';

/**
 * LockedOverlayCard - Wrapper that shows locked overlay for free users
 *
 * Props:
 * - locked: boolean (when false, no overlay)
 * - title: overlay title (default: "Trends over time")
 * - body: overlay description (default: calm framing text)
 * - ctaLabel: CTA button text (default: "Start Plus free trial")
 * - onUpgrade: callback when CTA clicked
 * - children: content to wrap (remains visible when locked)
 */
const LockedOverlayCard = ({
  locked = false,
  title = 'Trends over time',
  body = 'Your snapshot is free. Plus adds trends, changes, and explanations across scans.',
  ctaLabel = 'Start Plus free trial',
  onUpgrade,
  children,
}) => {
  if (!locked) {
    // No overlay, render children as-is
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Base content (blurred when locked) */}
      <div className="filter blur-sm pointer-events-none">{children}</div>

      {/* Locked overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200">
        <div className="max-w-md text-center px-6 py-8 space-y-4">
          {/* Lock icon */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Lock size={24} className="text-slate-500" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>

          {/* Body text */}
          <p className="text-sm text-slate-600 leading-relaxed">{body}</p>

          {/* CTA button */}
          {onUpgrade && (
            <div className="pt-2">
              <UpgradeCTA onClick={onUpgrade} label={ctaLabel} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockedOverlayCard;
