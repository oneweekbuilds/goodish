import React from 'react';

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Pill({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: PillProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-pill transition-colors';
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs h-6',
    md: 'px-3 py-1.5 text-sm h-6'
  };

  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info'
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}