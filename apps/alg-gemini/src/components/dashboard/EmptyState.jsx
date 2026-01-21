import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * Empty state types:
 *
 * Type 1: NEEDS_MORE_SCANS - User needs to run more scans to unlock this insight
 * Type 2: NEEDS_BROADER_BEHAVIOR - User needs to scan across more platforms or creators
 * Type 3: FUTURE_FEATURE - This feature isn't available yet
 * Type 4: INSUFFICIENT_DATA - Quality gating triggered (low sample, missing fields, etc.)
 *
 * PHASE 11: Added INSUFFICIENT_DATA for chart quality gating.
 * @see apps/alg-gemini/docs/chart_quality_system.md
 */
export const EMPTY_STATE_TYPES = {
  NEEDS_MORE_SCANS: 'needs_more_scans',
  NEEDS_BROADER_BEHAVIOR: 'needs_broader_behavior',
  FUTURE_FEATURE: 'future_feature',
  INSUFFICIENT_DATA: 'insufficient_data',
};

/**
 * EmptyState component for dashboard views that don't have data yet.
 * Shows contextual messages based on why data is missing.
 *
 * PHASE 11: Enhanced to support chart quality gating with specific quality reasons.
 *
 * @param {string} emptyStateType - One of EMPTY_STATE_TYPES
 * @param {string} missing - Optional specific message about what data is missing
 * @param {Object} chartQuality - Optional chart quality metadata (from dataHelpers)
 */
const EmptyState = ({ emptyStateType, missing, chartQuality }) => {
  // Get configuration based on empty state type
  // Phase 3A: Standardized structure - Title, Why, How to unlock
  const getConfig = () => {
    switch (emptyStateType) {
      case EMPTY_STATE_TYPES.NEEDS_MORE_SCANS:
        return {
          icon: 'scan',
          title: 'More scans needed',
          why: 'This insight appears after you run multiple scans.',
          howToUnlock: [
            'Run 2-3 scans this week',
            'Scan the same platform multiple times',
          ],
          cta: { label: 'Start a Scan', to: '/start' },
        };

      case EMPTY_STATE_TYPES.NEEDS_BROADER_BEHAVIOR:
        return {
          icon: 'platforms',
          title: 'Broader data needed',
          why: 'This insight appears when you scan across multiple platforms.',
          howToUnlock: [
            'Scan at least 2 different platforms',
            'Compare patterns across platforms',
          ],
          cta: { label: 'Scan Another Platform', to: '/start' },
        };

      case EMPTY_STATE_TYPES.FUTURE_FEATURE:
        return {
          icon: 'future',
          title: 'Coming soon',
          why: 'This insight requires a feature that isn\'t available yet.',
          howToUnlock: [],
          cta: null,
          footer: 'Available in a future update.',
        };

      case EMPTY_STATE_TYPES.INSUFFICIENT_DATA:
        // FIX PA2: Make empty state calmer and more helpful
        // Phase 3A: Surface threshold information from quality_reason if available
        const qualityReason = chartQuality?.quality_reason || missing || 'Not enough data for a reliable analysis.';
        const hasThreshold = qualityReason.includes('at least') || qualityReason.includes('requires');
        
        // Make the "why" message calmer - explain threshold purpose
        let calmWhy = qualityReason;
        if (hasThreshold) {
          // Extract the threshold number if present
          const match = qualityReason.match(/(\d+)\s+(posts|items|scans)/i);
          if (match) {
            const threshold = match[1];
            const unit = match[2];
            calmWhy = `We need at least ${threshold} ${unit} to show meaningful patterns. Below that, individual items have too much influence on the results.`;
          }
        }
        
        return {
          icon: 'quality',
          title: 'Not enough data yet',
          why: calmWhy,
          howToUnlock: hasThreshold 
            ? ['Run a few more scans to reach the threshold'] // Simpler instruction
            : [
                'Run more scans to increase sample size',
                'Ensure scans capture enough posts',
              ],
          cta: { label: 'Run Another Scan', to: '/start' },
          footer: chartQuality?.n_items > 0
            ? `Currently: ${chartQuality.n_items} item${chartQuality.n_items !== 1 ? 's' : ''} analyzed`
            : null,
        };

      default:
        // Fallback: try to infer from missing text
        return inferFromMissing(missing);
    }
  };

  // Infer empty state type from the missing message (backward compatibility)
  // Phase 3A: Updated to use standardized structure
  const inferFromMissing = (msg) => {
    if (!msg) {
      return {
        icon: 'scan',
        title: 'More data needed',
        why: 'Run more scans to populate this view.',
        howToUnlock: [
          'Run 2-3 scans this week',
          'Scan the same platform multiple times',
        ],
        cta: { label: 'Start a Scan', to: '/start' },
      };
    }

    const lower = msg.toLowerCase();

    // Quality gating indicators
    if (lower.includes('insufficient') ||
        lower.includes('low sample') ||
        lower.includes('reliable') ||
        lower.includes('threshold') ||
        lower.includes('at least') && lower.includes('posts')) {
      const hasThreshold = lower.includes('at least');
      return {
        icon: 'quality',
        title: 'Insufficient data',
        why: msg,
        howToUnlock: hasThreshold 
          ? [] // Threshold already in why message
          : [
              'Run more scans to increase sample size',
              'Ensure scans capture enough posts',
            ],
        cta: { label: 'Run More Scans', to: '/start' },
      };
    }

    // Future feature indicators
    if (lower.includes('not available yet') ||
        lower.includes('doesn\'t exist') ||
        lower.includes('requires a reference') ||
        lower.includes('not available')) {
      return {
        icon: 'future',
        title: 'Coming soon',
        why: 'This insight requires a feature that isn\'t available yet.',
        howToUnlock: [],
        cta: null,
        footer: 'Available in a future update.',
      };
    }

    // Cross-platform indicators
    if (lower.includes('2 platforms') ||
        lower.includes('at least 2') ||
        lower.includes('cross-platform') ||
        lower.includes('broader')) {
      return {
        icon: 'platforms',
        title: 'Broader data needed',
        why: 'This insight appears when you scan across multiple platforms.',
        howToUnlock: [
          'Scan at least 2 different platforms',
          'Compare patterns across platforms',
        ],
        cta: { label: 'Scan Another Platform', to: '/start' },
      };
    }

    // Default to needs more scans
    return {
      icon: 'scan',
      title: 'More scans needed',
      why: 'This insight appears after you run multiple scans.',
      howToUnlock: [
        'Run 2-3 scans this week',
        'Scan the same platform multiple times',
      ],
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

    if (config.icon === 'quality') {
      return (
        <AlertTriangle className="w-6 h-6 text-amber-500" />
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
      <div className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center ${
        config.icon === 'quality' ? 'bg-amber-50' : 'bg-slate-100'
      }`}>
        {renderIcon()}
      </div>

      {/* Title */}
      <h4 className={`text-sm font-semibold mb-2 ${
        config.icon === 'quality' ? 'text-amber-700' : 'text-slate-600'
      }`}>
        {config.title}
      </h4>

      {/* Why you're seeing this */}
      <p className="text-sm text-slate-500 max-w-xs mb-3">
        {config.why}
      </p>

      {/* How to unlock - actionable bullet list */}
      {config.howToUnlock && config.howToUnlock.length > 0 && (
        <div className="text-xs text-slate-500 max-w-xs mb-4 text-left">
          <p className="font-medium mb-1.5 text-slate-600">To unlock this:</p>
          <ul className="list-disc list-inside space-y-1">
            {config.howToUnlock.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA link if available */}
      {config.cta && (
        <Link
          to={config.cta.to}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-blue hover:underline"
        >
          {config.cta.label}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* Footer text for metadata */}
      {config.footer && (
        <p className="text-xs text-slate-400 mt-2 italic">
          {config.footer}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
