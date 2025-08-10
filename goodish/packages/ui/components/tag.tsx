import React from 'react';
import { cn } from '@goodish/lib';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'nonprofit' | 'percent-donated' | 'impact-first';
  className?: string;
}

export function Tag({ children, variant = 'default', className }: TagProps) {
  const variants = {
    default: 'bg-goodish-gray text-goodish-charcoal',
    nonprofit: 'bg-green-100 text-green-800',
    'percent-donated': 'bg-blue-100 text-blue-800',
    'impact-first': 'bg-purple-100 text-purple-800'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
