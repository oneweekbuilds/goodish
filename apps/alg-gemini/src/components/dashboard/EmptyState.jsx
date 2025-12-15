import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Empty state types:
 *
 * Type 1: NEEDS_MORE_SCANS - User needs to run more scans to unlock this insight
 * Type 2: NEEDS_BROADER_BEHAVIOR - User needs to scan across more platforms or creators
 * Type 3: FUTURE_FEATURE - This feature isn't available yet
 */
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
};

/**
 * EmptyState component for dashboard views that don't have data yet.
 * Shows contextual messages based on why data is missing.
 *
 * @param {string} emptyStateType - One of EMPTY_STATE_TYPES
 * @param {string} missing - Optional specific message about what data is missing
 */
const EmptyState = ({ emptyStateType, missing }) => {
  // Get configuration based on empty state type
  const getConfig = () => {
    switch (emptyStateType) {
      case EMPTY_STATE_TYPES.NEEDS_MORE_SCANS:
        return {
          icon: 'scan',
          title: 'Needs More Scans',
          message: 'This insight unlocks after you run more scans.',
          cta: { label: 'Start a Scan', to: '/start' },
        };

      case EMPTY_STATE_TYPES.NEEDS_BROADER_BEHAVIOR:
        return {
          icon: 'platforms',
          title: 'Needs Broader Data',
          message: 'This insight appears when you scan across more platforms or creators.',
          cta: { label: 'Scan Another Platform', to: '/start' },
        };

      case EMPTY_STATE_TYPES.FUTURE_FEATURE:
        return {
          icon: 'future',
          title: 'Coming Soon',
          message: 'This insight requires a feature that isn\'t available yet.',
          cta: null,
          footer: 'Coming later.',
        };

      default:
        // Fallback: try to infer from missing text
        return inferFromMissing(missing);
    }
  };

  // Infer empty state type from the missing message (backward compatibility)
  const inferFromMissing = (msg) => {
    if (!msg) {
      return {
        icon: 'scan',
        title: 'Needs More Data',
        message: 'Run more scans to populate this view.',
        cta: { label: 'Start a Scan', to: '/start' },
      };
    }

    const lower = msg.toLowerCase();

    // Future feature indicators
    if (lower.includes('not available yet') ||
        lower.includes('doesn\'t exist') ||
        lower.includes('requires a reference') ||
        lower.includes('not available')) {
      return {
        icon: 'future',
        title: 'Coming Soon',
        message: 'This insight requires a feature that isn\'t available yet.',
        cta: null,
        footer: 'Coming later.',
      };
    }

    // Cross-platform indicators
    if (lower.includes('2 platforms') ||
        lower.includes('at least 2') ||
        lower.includes('cross-platform') ||
        lower.includes('broader')) {
      return {
        icon: 'platforms',
        title: 'Needs Broader Data',
        message: 'This insight appears when you scan across more platforms or creators.',
        cta: { label: 'Scan Another Platform', to: '/start' },
      };
    }

    // Default to needs more scans
    return {
      icon: 'scan',
      title: 'Needs More Scans',
      message: 'This insight unlocks after you run more scans.',
      cta: { label: 'Start a Scan', to: '/start' },
    };
  };

  const config = getConfig();

  // Render icon based on type
  const renderIcon = () => {
    if (config.icon === 'platforms') {
      return (
        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    if (config.icon === 'future') {
      return (
        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    // Default: scan icon
    return (
      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* Icon */}
      <div className="w-12 h-12 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        {renderIcon()}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-600 mb-2">
        {config.title}
      </h4>

      {/* Message */}
      <p className="text-sm text-slate-500 max-w-xs mb-4">
        {config.message}
      </p>

      {/* CTA link if available */}
      {config.cta && (
        <Link
          to={config.cta.to}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-blue hover:underline"
        >
          {config.cta.label}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* Footer text for future features */}
      {config.footer && (
        <p className="text-xs text-slate-400 mt-2 italic">
          {config.footer}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
