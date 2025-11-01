import React from 'react';

interface CalloutProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  className?: string;
}

export function Callout({
  children,
  variant = 'default',
  icon,
  className = ''
}: CalloutProps) {
  const baseStyles = 'rounded-card p-6 border';
  
  const variantStyles = {
    default: 'bg-neutral-50 border-neutral-200 text-neutral-700',
    success: 'bg-success/5 border-success/20 text-success-700',
    warning: 'bg-warning/5 border-warning/20 text-warning-700',
    error: 'bg-error/5 border-error/20 text-error-700',
    info: 'bg-info/5 border-info/20 text-info-700'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}