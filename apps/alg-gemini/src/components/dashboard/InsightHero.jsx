import React from 'react';

/**
 * InsightHero - Data-grounded hero card for dashboard tabs
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
 */
const InsightHero = ({ title, meaning, whyCare, meta }) => {
  return (
    <section>
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        {/* Title: Large, bold, data-grounded */}
        <h2 className="text-2xl font-bold text-slate-900">
          {title}
        </h2>

        {/* Meaning: Normal body text, explains what it means */}
        <p className="text-base text-slate-700 leading-relaxed">
          {meaning}
        </p>

        {/* WhyCare: Smaller, muted, explains why it matters */}
        {whyCare && (
          <p className="text-sm text-slate-600 leading-relaxed">
            {whyCare}
          </p>
        )}

        {/* Meta: Tiny muted line at bottom */}
        {meta && (
          <p className="text-xs text-slate-500 pt-1">
            {meta}
          </p>
        )}
      </div>
    </section>
  );
};

export default InsightHero;
