import React, { useRef } from 'react';
import { Share2, Camera } from 'lucide-react';

/**
 * FeedFingerprint - Shareable visual summary card
 *
 * Shows 4 key stats from the scan in a card designed for screenshotting.
 * Styled with clean typography, branded footer, and a "share" prompt.
 *
 * Props:
 * - displayData: object from getDisplayData()
 *   { adPercentage, topTopics, toneBreakdown, totalPosts, platform, timestamp }
 *
 * All copy follows epistemic restraint: observations only, no inferred intent.
 */

/**
 * Compute the 4 fingerprint stats from displayData.
 * Returns null if there isn't enough data for a meaningful card.
 */
function computeFingerprint(displayData) {
  if (!displayData || !displayData.totalPosts || displayData.totalPosts === 0) {
    return null;
  }

  const stats = [];

  // 1. Ad content percentage
  if (displayData.adPercentage != null && displayData.adPercentage > 0) {
    stats.push({
      label: 'Ad content',
      value: `${displayData.adPercentage}%`,
      detail: `${displayData.adsCount || 0} of ${displayData.totalPosts} posts`,
    });
  } else {
    stats.push({
      label: 'Ad content',
      value: '0%',
      detail: 'No ads detected',
    });
  }

  // 2. Top content category
  if (displayData.topTopics && displayData.topTopics.length > 0) {
    const top = displayData.topTopics[0];
    stats.push({
      label: 'Top category',
      value: top.topic,
      detail: `${Math.round(top.percentage)}% of posts`,
    });
  } else {
    stats.push({
      label: 'Top category',
      value: 'Mixed',
      detail: 'No dominant category',
    });
  }

  // 3. Tone summary
  if (displayData.toneBreakdown && displayData.toneBreakdown.hasData) {
    const { positive, neutral, negative } = displayData.toneBreakdown;
    let dominantTone = 'Balanced';
    let dominantPercent = 0;

    if (positive >= neutral && positive >= negative) {
      dominantTone = 'Positive';
      dominantPercent = Math.round(positive * 100);
    } else if (negative >= positive && negative >= neutral) {
      dominantTone = 'Negative';
      dominantPercent = Math.round(negative * 100);
    } else {
      dominantTone = 'Neutral';
      dominantPercent = Math.round(neutral * 100);
    }

    stats.push({
      label: 'Dominant tone',
      value: dominantTone,
      detail: `${dominantPercent}% of posts`,
    });
  } else {
    stats.push({
      label: 'Dominant tone',
      value: '—',
      detail: 'Not enough data',
    });
  }

  // 4. Total posts scanned
  stats.push({
    label: 'Posts scanned',
    value: displayData.totalPosts.toLocaleString('en-US'),
    detail: displayData.platform || 'Social media',
  });

  return stats;
}

const FeedFingerprint = ({ displayData }) => {
  const cardRef = useRef(null);
  const stats = computeFingerprint(displayData);

  if (!stats) return null;

  const scanDate = displayData.timestamp
    ? new Date(displayData.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent scan';

  return (
    <div className="mb-8">
      {/* Card header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Camera size={14} />
          Your Feed Fingerprint
        </h2>
        <span className="text-xs text-slate-500">Screenshot to share</span>
      </div>

      {/* The actual card — optimized for screenshotting */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden relative"
      >
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Feed Fingerprint
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{scanDate}</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
              <Share2 size={12} className="text-slate-300" />
              <span className="text-xs font-medium text-slate-300">Share</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Branded footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">AL</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">AlgorithmLens</span>
            </div>
            <span className="text-[10px] text-slate-500">algorithmlens.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedFingerprint;
