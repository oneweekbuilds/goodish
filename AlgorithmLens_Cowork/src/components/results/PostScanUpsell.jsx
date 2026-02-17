import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * PostScanUpsell - Contextual CTA shown after scan results to encourage Plus upgrade
 *
 * Generates a dynamic headline based on the scan data, making the upgrade feel
 * personal and relevant rather than generic. Includes a "come back" seed to
 * encourage repeat scanning.
 *
 * All copy follows epistemic restraint: describes observations, never infers intent.
 *
 * Props:
 * - displayData: parsed scan data from getDisplayData() (optional — falls back to generic)
 */

/**
 * Generate a contextual upsell message based on scan data.
 * Returns { headline, body } with the most relevant framing.
 */
function getContextualMessage(displayData) {
  if (!displayData) {
    return {
      headline: 'Understand the patterns behind your feed',
      body: 'AlgorithmLens Plus provides evidence-based analysis, AI-powered Q&A about your feed, and trend tracking across scans.',
    };
  }

  // Pick the most notable finding for the headline
  const adPct = displayData.adPercentage || 0;
  const politicalPct = displayData.politicalPercentage;
  const topTopic = displayData.topTopics?.[0];
  const negativePct = displayData.toneBreakdown?.hasData
    ? Math.round(displayData.toneBreakdown.negative * 100)
    : 0;

  // High ad content
  if (adPct >= 20) {
    return {
      headline: `Your feed was ${adPct}% ads. Plus shows the full picture.`,
      body: 'See which advertisers appeared most, what product categories dominated, and how your ad composition compares across scans.',
    };
  }

  // Notable political content
  if (politicalPct !== null && politicalPct > 10) {
    return {
      headline: `${Math.round(politicalPct)}% of your feed was political content.`,
      body: 'Plus breaks down the political content in your feed with detailed evidence and lets you track whether this changes over time.',
    };
  }

  // Dominant topic
  if (topTopic && topTopic.percentage > 30) {
    return {
      headline: `${Math.round(topTopic.percentage)}% of your feed was about ${topTopic.topic.toLowerCase()}.`,
      body: 'Plus explains how content categories are distributed across your feed and whether the pattern holds across multiple scans.',
    };
  }

  // High negative tone
  if (negativePct > 25) {
    return {
      headline: `${negativePct}% of posts had a negative tone.`,
      body: 'Plus provides evidence-based tone analysis across your feed and tracks how emotional patterns shift between scans.',
    };
  }

  // Generic fallback with total posts
  return {
    headline: `${displayData.totalPosts} posts analyzed. Plus reveals what the numbers mean.`,
    body: 'Get evidence-based analysis on every tab, ask AI-powered questions about your feed, and track changes across scans.',
  };
}

const PostScanUpsell = ({ displayData }) => {
  const { headline, body } = getContextualMessage(displayData);

  return (
    <div className="space-y-4">
      {/* Upsell card */}
      <div className="bg-gradient-to-r from-primary-blue/5 to-accent-green/5 rounded-2xl border border-primary-blue/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-accent-green/10 rounded-xl flex items-center justify-center">
              <Sparkles size={28} className="text-accent-green" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-main mb-1 flex items-center gap-2">
              {headline}
            </h3>
            <p className="text-text-muted text-sm">
              {body}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              to="/plus"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-green text-white rounded-xl font-semibold hover:bg-accent-green/90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Explore Plus
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Come-back seed */}
      <p className="text-center text-sm text-slate-400">
        Your next scan will show whether today was typical or unusual. Try again in a few days.
      </p>
    </div>
  );
};

export default PostScanUpsell;
