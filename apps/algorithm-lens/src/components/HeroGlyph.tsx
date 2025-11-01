import React from 'react';
/**
 * HeroGlyph component
 *
 * Animated logo illustration for the hero section.
 * Respects prefers-reduced-motion for accessibility.
 * Animations are subtle and use CSS transitions.
 */
export function HeroGlyph() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hero-glyph"
      style={{ maxWidth: '100%', height: 'auto' }}
      aria-label="Algorithm Lens logo - magnifying glass with data visualization"
    >
      {/* Outer circle gradient background */}
      <defs>
        <linearGradient id="heroGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="heroGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="80" cy="80" r="75" fill="url(#heroGrad1)" />

      {/* Lens circle (outer ring) */}
      <circle
        cx="80"
        cy="80"
        r="50"
        stroke="url(#heroGrad2)"
        strokeWidth="3"
        fill="none"
        opacity="0.8"
      />

      {/* Inner magnifying glass lens */}
      <circle cx="80" cy="80" r="35" fill="white" fillOpacity="0.05" />

      {/* Data streams (lines flowing into lens) */}
      <g opacity="0.6">
        <path
          d="M 20 30 Q 40 50, 55 65"
          stroke="url(#heroGrad2)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="4 4"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="8"
            to="0"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M 140 30 Q 120 50, 105 65"
          stroke="url(#heroGrad2)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="4 4"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="8"
            to="0"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M 30 130 Q 50 110, 60 95"
          stroke="url(#heroGrad2)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="4 4"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="8"
            to="0"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Chart bars inside lens (data visualization) */}
      <g opacity="0.7" filter="url(#glow)">
        <rect x="65" y="90" width="6" height="15" rx="2" fill="var(--brand)" />
        <rect x="74" y="82" width="6" height="23" rx="2" fill="var(--accent)" />
        <rect x="83" y="75" width="6" height="30" rx="2" fill="var(--pos)" />
        <rect x="92" y="85" width="6" height="20" rx="2" fill="var(--brand)" />
      </g>

      {/* Sparkles for premium feel */}
      <g opacity="0.8">
        <circle cx="35" cy="50" r="2" fill="var(--brand)">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="125" cy="60" r="2" fill="var(--accent)">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="45" cy="115" r="2" fill="var(--pos)">
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Lock icon at bottom (privacy) */}
      <g transform="translate(75, 120)" opacity="0.6">
        <rect x="0" y="3" width="10" height="8" rx="1" fill="var(--brand)" />
        <path
          d="M 2 3 L 2 0 A 3 3 0 0 1 8 0 L 8 3"
          stroke="var(--brand)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
