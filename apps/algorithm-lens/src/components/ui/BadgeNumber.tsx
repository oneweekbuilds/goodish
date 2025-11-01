import React from 'react';

interface BadgeNumberProps {
  value: number | string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeNumber({
  value,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeNumberProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full transition-colors';
  
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white'
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {value}
    </span>
  );
}