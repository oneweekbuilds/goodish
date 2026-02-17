import React from 'react';

/**
 * SectionHeader - PREMIER QUALITY
 * Consistent themed header for dashboard sections.
 * Features: gradient accent bar, refined spacing, optional label & subtext.
 *
 * Props:
 * - children: string (required if no title) - The header text (simple usage)
 * - title: string (optional) - The header text (advanced usage with label/subtext)
 * - label: string (optional) - Uppercase kicker label above title
 * - subtext: string (optional) - Supporting text below title
 * - level: 'h2' | 'h3' (optional) - Heading level, default 'h2'
 * - accent: string (optional) - Hex color for tab-specific theming (defaults to '#2563EB')
 */
const SectionHeader = ({ children, title, label, subtext, level = 'h2', accent = '#2563EB' }) => {
  const Tag = level;
  const isH2 = level === 'h2';
  const headingText = title || children;

  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        {/* Gradient accent bar */}
        <div
          className="flex-shrink-0 rounded-full mt-1"
          style={{
            width: '4px',
            height: isH2 ? '22px' : '18px',
            background: `linear-gradient(180deg, ${accent} 0%, ${accent}80 100%)`,
          }}
        />
        <div className="space-y-1">
          {/* Optional kicker label */}
          {label && (
            <span
              className="text-[11px] font-bold uppercase block"
              style={{
                color: accent,
                letterSpacing: '0.08em',
              }}
            >
              {label}
            </span>
          )}
          {/* Heading */}
          <Tag
            style={{
              fontSize: isH2 ? '1.125rem' : '0.9375rem',
              fontWeight: 600,
              color: '#1E293B',
              letterSpacing: '-0.01em',
              lineHeight: 1.4,
            }}
          >
            {headingText}
          </Tag>
          {/* Optional subtext */}
          {subtext && (
            <p className="text-sm text-text-muted leading-relaxed" style={{ maxWidth: '560px' }}>
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;
