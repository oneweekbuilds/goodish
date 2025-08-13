import React from 'react';
import { cn } from '@goodish/lib';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden';

  const variants = {
    primary: 'bg-goodish-amber hover:bg-goodish-amber/90 active:bg-goodish-amber/80 text-goodish-charcoal shadow-sm hover:shadow-md focus-visible:ring-goodish-amber hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
    secondary: 'border-2 border-goodish-teal text-goodish-teal hover:bg-goodish-teal hover:text-white active:bg-goodish-teal/90 focus-visible:ring-goodish-teal hover:-translate-y-0.5',
    ghost: 'text-goodish-charcoal hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-300 hover:-translate-y-0.5'
  } as const;

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg'
  } as const;

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
