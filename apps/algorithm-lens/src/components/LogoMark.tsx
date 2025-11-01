/**
 * LogoMark component
 *
 * Magnifying glass SVG that scales cleanly from 16px to 128px+
 * Features:
 * - Outer circle stroke in brand teal
 * - Handle at ~45° NE direction
 * - Inner radial fill for subtle depth
 * - Optional pulse highlight (respects prefers-reduced-motion)
 * - Reusable for header, hero, and favicon
 */

import React from "react";

interface LogoMarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export default function LogoMark({ size = 64, animated = true, className = "" }: LogoMarkProps) {
  const s = Math.max(16, size);
  const stroke = "#01B1C0";
  const fillLight = "#E6F8F9";

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id="lensFill" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={fillLight} />
        </radialGradient>
      </defs>

      {/* Lens circle */}
      <circle
        cx="28"
        cy="28"
        r="18"
        fill="url(#lensFill)"
        stroke={stroke}
        strokeWidth="2"
      />

      {/* Handle at ~45° (NE direction) */}
      <line
        x1="39"
        y1="39"
        x2="56"
        y2="56"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Gentle glare/pulse highlight */}
      {animated && (
        <circle
          cx="22"
          cy="22"
          r="5"
          fill="#ffffff"
          style={{
            opacity: 0.35,
            transformOrigin: "22px 22px"
          }}
          className="al-lens-pulse"
        />
      )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .al-lens-pulse {
            animation: none !important;
          }
        }
        .al-lens-pulse {
          animation: alPulse 6s ease-in-out infinite;
        }
        @keyframes alPulse {
          0% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
          100% { opacity: 0.15; transform: scale(1); }
        }
      `}</style>
    </svg>
  );
}
