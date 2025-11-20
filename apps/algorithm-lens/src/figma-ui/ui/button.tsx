import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { 
  variant?: 'default' | 'outline'; 
  size?: 'sm'|'md'|'lg'; 
}

export function Button({ className = '', variant = 'default', size = 'md', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:opacity-50 disabled:pointer-events-none';
  const v = variant === 'outline' ? 'border bg-transparent' : 'text-white';
  const s = size === 'lg' ? 'h-11 px-5' : size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4';
  return <button className={[base, v, s, className].join(' ')} {...props} />;
}
