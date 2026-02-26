import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared Button Components (#12)
 *
 * Consistent button styling with automatic Link/button switching.
 * If `to` is provided, renders as a React Router Link.
 * Otherwise renders as a native <button>.
 *
 * Usage:
 *   <ButtonPrimary to="/start">Get Started</ButtonPrimary>
 *   <ButtonSecondary onClick={handleClick}>Cancel</ButtonSecondary>
 *   <ButtonGhost to="/history">View History</ButtonGhost>
 */

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const SIZE_CLASSES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const VARIANT_CLASSES = {
  primary:
    'bg-primary-blue text-white hover:bg-primary-blue/90 focus-visible:ring-primary-blue/60 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]',
  secondary:
    'bg-white text-primary-blue border-2 border-primary-blue hover:bg-primary-blue/5 focus-visible:ring-primary-blue/60',
  ghost:
    'text-text-muted hover:text-text-main hover:bg-primary-blue/5 focus-visible:ring-primary-blue/60',
  success:
    'bg-accent-green text-white hover:bg-accent-green/90 focus-visible:ring-accent-green/60 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]',
};

function ButtonInner({ variant = 'primary', size = 'md', to, className = '', disabled, children, ...props }) {
  const classes = `${BASE_CLASSES} ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export const ButtonPrimary = (props) => <ButtonInner variant="primary" {...props} />;
export const ButtonSecondary = (props) => <ButtonInner variant="secondary" {...props} />;
export const ButtonGhost = (props) => <ButtonInner variant="ghost" {...props} />;
export const ButtonSuccess = (props) => <ButtonInner variant="success" {...props} />;

export default ButtonInner;
