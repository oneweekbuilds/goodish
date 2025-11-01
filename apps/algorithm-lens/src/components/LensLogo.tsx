import React from 'react';
/**
 * LensLogo component
 *
 * Modern, flat lens icon with subtle depth and pulse animation.
 * Features:
 * - Flat circular outline in brand teal (#01B1C0)
 * - Inner ring gradient for subtle depth
 * - Center dot pulse animation (respects prefers-reduced-motion)
 * - Reusable for hero, nav, and favicon
 */

interface LensLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function LensLogo({ size = 160, animated = true, className = '' }: LensLogoProps) {
  const id = `lens-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
      aria-label="Algorithm Lens logo"
      role="img"
    >
      <defs>
        {/* Inner ring gradient for subtle depth */}
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E6F8F9" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </radialGradient>

        {/* Pulse animation for center dot */}
        {animated && (
          <style>
            {`
              @media (prefers-reduced-motion: no-preference) {
                .lens-pulse {
                  animation: lens-pulse-anim 4s ease-in-out infinite;
                }
              }

              @keyframes lens-pulse-anim {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
              }
            `}
          </style>
        )}
      </defs>

      {/* Outer circle - flat outline in brand teal */}
      <circle
        cx="80"
        cy="80"
        r="70"
        stroke="#01B1C0"
        strokeWidth="2"
        fill="none"
        opacity="0.9"
      />

      {/* Inner ring - gradient fill for depth */}
      <circle
        cx="80"
        cy="80"
        r="50"
        fill={`url(#${id})`}
        opacity="0.6"
      />

      {/* Data visualization bars */}
      <g opacity="0.8">
        <rect x="60" y="95" width="8" height="20" rx="2" fill="#01B1C0" />
        <rect x="72" y="85" width="8" height="30" rx="2" fill="#01B1C0" />
        <rect x="84" y="90" width="8" height="25" rx="2" fill="#01B1C0" />
        <rect x="96" y="80" width="8" height="35" rx="2" fill="#01B1C0" />
      </g>

      {/* Center pulse dot */}
      <circle
        cx="80"
        cy="80"
        r="6"
        fill="#01B1C0"
        className={animated ? "lens-pulse" : ""}
      />
    </svg>
  );
}
