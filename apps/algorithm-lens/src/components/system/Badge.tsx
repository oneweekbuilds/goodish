import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

/**
 * Badge component for status indicators and tags
 */
export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-neuLight text-ink',
    success: 'bg-posLight text-pos',
    warning: 'bg-color-warning-light text-color-warning',
    danger: 'bg-negLight text-neg',
    info: 'bg-brandLight text-brand',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `.replace(/\s+/g, ' ').trim()}
    >
      {children}
    </span>
  );
}
