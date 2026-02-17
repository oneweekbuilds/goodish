import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * SurpriseInsightSplash - Full-screen "aha moment" shown before scan results
 *
 * Picks the single most notable stat from displayData and presents it
 * as a provocative finding. Dismisses to reveal the full results page.
 *
 * All copy follows epistemic restraint: describes observations only.
 *
 * Props:
 * - displayData: parsed scan data from getDisplayData()
 * - onDismiss: callback when user clicks "See Your Full Results"
 */

/**
 * Pick the single most interesting insight from scan data.
 * Returns { bigNumber, unit, sentence } for display.
 */
function pickInsight(displayData) {
  if (!displayData) {
    return null;
  }

  const candidates = [];

  // Candidate 1: High ad percentage
  if (displayData.adPercentage > 0) {
    candidates.push({
      score: displayData.adPercentage,
      bigNumber: `${displayData.adPercentage}%`,
      unit: 'of posts',
      sentence: 'in this scan were ads or sponsored content.',
      minScore: 5,
    });
  }

  // Candidate 2: Suggested vs followed ratio (from feedItems)
  if (displayData.feedItems && displayData.feedItems.length > 0) {
    const totalItems = displayData.feedItems.length;
    // Count items with no creator or with "suggested" badges as algorithmic
    // This is approximate — the real ratio is on the dashboard
    const suggestedCount = displayData.feedItems.filter(
      item => item.badges && item.badges.length === 0 && !item.creator
    ).length;
    // Use adPercentage as proxy if suggested data isn't clean
    if (displayData.adPercentage >= 20) {
      candidates.push({
        score: displayData.adPercentage + 10,
        bigNumber: `${displayData.adsCount}`,
        unit: `of ${displayData.totalPosts} posts`,
        sentence: 'were commercial content — ads, promotions, or sponsored posts.',
        minScore: 15,
      });
    }
  }

  // Candidate 3: Political content percentage
  if (displayData.politicalPercentage !== null && displayData.politicalPercentage > 5) {
    const politicalPct = Math.round(displayData.politicalPercentage);
    candidates.push({
      score: politicalPct * 1.5, // Political content is more surprising
      bigNumber: `${politicalPct}%`,
      unit: 'of posts',
      sentence: 'contained political or civic content.',
      minScore: 5,
    });
  }

  // Candidate 4: Source concentration (top topic dominance)
  if (displayData.topTopics && displayData.topTopics.length > 0) {
    const topTopic = displayData.topTopics[0];
    if (topTopic.percentage > 25) {
      candidates.push({
        score: topTopic.percentage * 0.8,
        bigNumber: `${Math.round(topTopic.percentage)}%`,
        unit: 'of your feed',
        sentence: `was about ${topTopic.topic.toLowerCase()}.`,
        minScore: 20,
      });
    }
  }

  // Candidate 5: Negative tone dominance
  if (displayData.toneBreakdown && displayData.toneBreakdown.hasData) {
    const negativePct = Math.round(displayData.toneBreakdown.negative * 100);
    if (negativePct > 20) {
      candidates.push({
        score: negativePct * 1.2,
        bigNumber: `${negativePct}%`,
        unit: 'of posts',
        sentence: 'had a negative emotional tone.',
        minScore: 15,
      });
    }
  }

  // Candidate 6: Total posts scanned (always available fallback)
  if (displayData.totalPosts > 0) {
    candidates.push({
      score: 1, // Lowest priority — fallback only
      bigNumber: `${displayData.totalPosts}`,
      unit: 'posts',
      sentence: `were analyzed from your ${displayData.platform} feed.`,
      minScore: 0,
    });
  }

  // Filter to candidates that meet their minimum score threshold
  const viable = candidates.filter(c => c.score >= c.minScore);

  if (viable.length === 0) {
    // Use the fallback (total posts)
    const fallback = candidates.find(c => c.minScore === 0);
    return fallback || null;
  }

  // Pick the highest-scoring candidate
  viable.sort((a, b) => b.score - a.score);
  return viable[0];
}

const SurpriseInsightSplash = ({ displayData, onDismiss }) => {
  const insight = pickInsight(displayData);

  if (!insight) {
    // No insight available — skip splash entirely
    if (onDismiss) onDismiss();
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-page">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Platform context */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-sm font-medium text-primary-blue mb-8 tracking-wide uppercase"
        >
          Your {displayData.platform} scan is ready
        </motion.p>

        {/* Big number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
          className="mb-3"
        >
          <span className="text-7xl sm:text-8xl font-bold text-text-main tracking-tight">
            {insight.bigNumber}
          </span>
        </motion.div>

        {/* Unit + sentence */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-xl sm:text-2xl text-text-muted leading-relaxed mb-12"
        >
          <span className="text-text-main font-medium">{insight.unit}</span>{' '}
          {insight.sentence}
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          onClick={onDismiss}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
        >
          See Your Full Results
          <ArrowRight size={20} />
        </motion.button>

        {/* Subtle context */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mt-8 text-xs text-slate-400"
        >
          Based on {displayData.totalPosts} posts analyzed just now
        </motion.p>
      </div>
    </div>
  );
};

export default SurpriseInsightSplash;
