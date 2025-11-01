import React from 'react';
import { Brain, TrendingUp, Sparkles } from "lucide-react";

interface TopicInsight {
  topic: string;
  pct: number;
  count: number;
}

interface AlgorithmInsightProps {
  topics: TopicInsight[];
}

export function AlgorithmInsight({ topics }: AlgorithmInsightProps) {
  if (!topics || topics.length === 0) {
    return null;
  }

  // Get top 3 topics
  const topTopics = topics.slice(0, 3);
  const primaryTopic = topTopics[0];

  // Generate insight message based on top topic
  const getInsightMessage = () => {
    if (primaryTopic.pct > 40) {
      return {
        title: "Highly Focused Feed",
        message: `Your algorithm thinks you're **really** into ${primaryTopic.topic}. Over ${Math.round(primaryTopic.pct)}% of your content focuses on this topic.`,
        tone: "intense",
      };
    } else if (primaryTopic.pct > 25) {
      return {
        title: "Dominant Interest",
        message: `${primaryTopic.topic.charAt(0).toUpperCase() + primaryTopic.topic.slice(1)} is your algorithm's main focus, making up ${Math.round(primaryTopic.pct)}% of your feed.`,
        tone: "moderate",
      };
    } else {
      return {
        title: "Diverse Interests",
        message: `Your feed has variety! ${primaryTopic.topic.charAt(0).toUpperCase() + primaryTopic.topic.slice(1)} leads at ${Math.round(primaryTopic.pct)}%, but you see a healthy mix of topics.`,
        tone: "balanced",
      };
    }
  };

  const insight = getInsightMessage();

  const toneColors = {
    intense: "from-accent to-neg",
    moderate: "from-brand to-accent",
    balanced: "from-pos to-brand",
  };

  const toneIcons = {
    intense: "🎯",
    moderate: "📊",
    balanced: "🌈",
  };

  return (
    <div className="rounded-2xl border border-line bg-gradient-to-br from-panel to-brandLight/30 shadow-e2 p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand/5 to-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-lg">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-ink">{insight.title}</h3>
            <span className="text-2xl">{toneIcons[insight.tone]}</span>
          </div>
          <p className="text-sm text-inkMuted">What the algorithm thinks you want</p>
        </div>
        <Sparkles className="w-6 h-6 text-accent opacity-60" />
      </div>

      {/* Insight message */}
      <div className="relative mb-6">
        <p className="text-base text-ink leading-relaxed">{insight.message}</p>
      </div>

      {/* Top topics visualization */}
      <div className="relative space-y-3">
        {topTopics.map((topic, index) => {
          const widthPercent = (topic.pct / primaryTopic.pct) * 100;
          const isTop = index === 0;

          return (
            <div key={topic.topic} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {isTop && <TrendingUp className="w-4 h-4 text-brand" />}
                  <span className={`text-sm font-semibold capitalize ${isTop ? 'text-brand' : 'text-ink'}`}>
                    {topic.topic}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-inkMuted">{topic.count} items</span>
                  <span className={`text-sm font-bold ${isTop ? 'text-brand' : 'text-inkDim'}`}>
                    {Math.round(topic.pct)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-grid rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${isTop ? toneColors[insight.tone] : 'from-inkMuted to-neu'} transition-all duration-500 rounded-full`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      {topics.length > 3 && (
        <div className="relative mt-6 pt-6 border-t border-line">
          <p className="text-sm text-inkMuted text-center">
            Plus {topics.length - 3} more topic{topics.length - 3 > 1 ? 's' : ''} in your feed
          </p>
        </div>
      )}
    </div>
  );
}
