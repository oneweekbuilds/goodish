import React from 'react';
import { motion } from 'framer-motion';

/**
 * InsightHero - Data-grounded hero card for dashboard tabs
 * PREMIER QUALITY: Elevated design with layered depth, rich typography, and blue/green accents.
 *
 * NON-NEGOTIABLE RULES FOR HERO COPY:
 * 1. Title must state a clear takeaway that includes the real computed value
 * 2. Meaning must explain what it means in plain English (not restating the chart)
 * 3. WhyCare must explain why the user should care (behavioral/exposure/persuasion implications)
 * 4. NO vague adjectives like "mixed", "some", "moderate", "includes"
 * 5. NO generic "social media is..." filler. Must be about "your feed" and this scan window.
 * 6. NO moralizing or telling users what to do. That belongs in "What you can do" sections.
 * 7. NO em dashes anywhere in hero copy.
 *
 * Props:
 * - title: string (required) - Data-grounded takeaway headline with actual values
 * - meaning: string (required) - What this finding means in plain English
 * - whyCare: string | null (optional) - Why this matters for the user
 * - meta: string | null (optional) - Small supporting line (e.g., "Based on 160 posts across 2 platforms")
 * - accent: string (optional) - Hex color for tab-specific theming (defaults to '#2563EB')
 */
const InsightHero = ({ title, meaning, whyCare, meta, accent = '#2563EB' }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${accent}08 0%, ${accent}04 50%, #FFFFFF 100%)`,
          border: `1px solid ${accent}18`,
          boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 8px 32px ${accent}0A`,
        }}
      >
        {/* Left accent border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
          style={{
            background: `linear-gradient(180deg, ${accent} 0%, ${accent}80 100%)`,
          }}
        />

        {/* Subtle top-right decorative gradient */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none rounded-full opacity-[0.04]"
          style={{
            background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          }}
        />

        <div className="relative pl-6 pr-5 py-5 sm:pl-8 sm:pr-6 sm:py-6 space-y-3">
          {/* Label chip */}
          <div className="inline-flex items-center">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                color: accent,
                backgroundColor: `${accent}0D`,
                border: `1px solid ${accent}1A`,
                letterSpacing: '0.08em',
              }}
            >
              Key Takeaway
            </span>
          </div>

          {/* Title */}
          <h2
            className="text-text-main leading-tight"
            style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.625rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>

          {/* Meaning */}
          <p className="text-[15px] text-text-main leading-relaxed" style={{ maxWidth: '640px' }}>
            {meaning}
          </p>

          {/* WhyCare */}
          {whyCare && (
            <p className="text-sm text-text-muted leading-relaxed" style={{ maxWidth: '640px' }}>
              {whyCare}
            </p>
          )}

          {/* Meta */}
          {meta && (
            <p className="text-xs text-text-muted pt-1 font-medium" style={{ letterSpacing: '0.01em' }}>
              {meta}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default InsightHero;
