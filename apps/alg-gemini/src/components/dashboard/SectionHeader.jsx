import React from 'react';
import { themeTokens } from '../../lib/theme/tokens';

/**
 * SectionHeader - Consistent themed header for dashboard sections
 *
 * Props:
 * - children: string (required) - The header text
 * - level: 'h2' | 'h3' (optional) - Heading level, default 'h2'
 */
const SectionHeader = ({ children, level = 'h2' }) => {
  const Tag = level;
  const isH2 = level === 'h2';

  return (
    <div className="flex items-center gap-2 mb-3">
      {/* Left accent bar */}
      <div
        style={{
          width: '3px',
          height: isH2 ? '20px' : '16px',
          backgroundColor: themeTokens.brandPrimary,
          borderRadius: '2px',
        }}
      />

      {/* Header text */}
      <Tag
        className={isH2 ? 'text-lg font-semibold text-slate-800' : 'text-sm font-semibold text-slate-700'}
      >
        {children}
      </Tag>
    </div>
  );
};

export default SectionHeader;
