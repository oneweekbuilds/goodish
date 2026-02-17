import React from 'react';
import { Sparkles } from 'lucide-react';
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
  title = 'Deeper analysis available',
  body = 'Your snapshot shows the headlines. Plus reveals the full picture — evidence-based analysis, AI-powered Q&A, and trend tracking.',
  ctaLabel = 'Try free for 14 days',
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
            <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center">
              <Sparkles size={24} className="text-primary-blue" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>

          {/* Body text */}
          <p className="text-sm text-slate-600 leading-relaxed">{body}</p>

          {/* CTA button */}
          {onUpgrade && (
            <div className="pt-2 space-y-2">
              <UpgradeCTA onClick={onUpgrade} label={ctaLabel} />
              <p className="text-xs text-slate-400">No charge for 14 days. Cancel anytime.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockedOverlayCard;
