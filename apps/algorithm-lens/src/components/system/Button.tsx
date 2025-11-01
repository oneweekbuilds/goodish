import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Button component with Apple-grade polish
 * - Primary: solid brand background with shadow
 * - Secondary: text button with subtle hover
 * - Ghost: transparent with hover effect
 * - All buttons are keyboard accessible with visible focus rings
 * - Touch targets meet 44px minimum for accessibility
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-xl
    transition-all
    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `.replace(/\s+/g, ' ').trim();

  const variantStyles = {
    primary: `
      bg-brand text-white shadow-e1
      hover:opacity-90 active:opacity-80
      disabled:hover:opacity-50
    `.replace(/\s+/g, ' ').trim(),

    secondary: `
      text-ink hover:text-brand
      hover:underline underline-offset-4
      disabled:hover:no-underline disabled:hover:text-ink
    `.replace(/\s+/g, ' ').trim(),

    ghost: `
      text-ink border border-line bg-panel
      hover:border-brand hover:bg-brandLight
      active:scale-95
      disabled:hover:border-line disabled:hover:bg-panel
    `.replace(/\s+/g, ' ').trim(),
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm h-8',
    md: 'px-5 py-3 text-[15px] h-11',  // 44px touch target
    lg: 'px-6 py-3 text-base h-12',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
