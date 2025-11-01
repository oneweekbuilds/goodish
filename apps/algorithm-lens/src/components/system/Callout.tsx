import React from 'react';

export interface CalloutProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

/**
 * Callout component for highlighted information blocks
 * - Info, success, warning, danger variants
 * - Optional icon
 */
export function Callout({ children, variant = 'info', icon }: CalloutProps) {
  const variantStyles = {
    info: 'bg-brandLight border-brand text-ink',
    success: 'bg-posLight border-pos text-ink',
    warning: 'bg-color-warning-light border-color-warning text-ink',
    danger: 'bg-negLight border-neg text-ink',
  };

  return (
    <div
      className={`
        flex items-start gap-3
        p-4 rounded-lg
        border-l-4
        ${variantStyles[variant]}
      `.replace(/\s+/g, ' ').trim()}
      role="note"
    >
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
