import React from 'react';
interface BrandProps {
  onClick?: () => void;
  className?: string;
}

export function Brand({ onClick, className = '' }: BrandProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 ${onClick ? 'group focus-visible:outline focus-visible:outline-2 outline-accent rounded-lg p-2 -m-2 cursor-pointer' : ''} ${className}`}
      aria-label="AlgorithmLens home"
    >
      <img
        src="/logo.png"
        alt="AlgorithmLens logo"
        className="h-10 w-auto group-hover:scale-105 transition-transform duration-200"
      />
      <span className="text-xl font-semibold text-ink tracking-normal group-hover:text-accent transition-colors duration-200 leading-none">
        AlgorithmLens
      </span>
    </Component>
  );
}
