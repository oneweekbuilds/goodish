import React from 'react';
import { BarChart3, MessageSquare, AlertTriangle, Heart } from 'lucide-react';

/**
 * Insight Card components extracted from ResultsPage (#14)
 * Each card displays a different dimension of feed analysis.
 */

const CardWrapper = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl shadow-md border border-border-light p-6">
    <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
      <div className="p-2 bg-primary-blue/5 rounded-lg">
        <Icon size={18} className="text-primary-blue" />
      </div>
      {title}
    </h2>
    {children}
  </div>
);

const EmptyState = ({ message, hint }) => (
  <div className="py-6 text-center">
    <p className="text-text-muted font-medium">{message}</p>
    {hint && <p className="text-xs text-text-muted/70 mt-2">{hint}</p>}
  </div>
);

const NotAnalyzedState = () => (
  <EmptyState
    message="AI analysis not used for this scan"
    hint="You can enable AI analysis before starting a scan to see tone, political, and wellbeing insights."
  />
);

/** Progress bar used for tone and topic percentages */
const ProgressBar = ({ percentage, colorClass = 'bg-primary-blue' }) => (
  <div className="h-3 bg-primary-blue/5 rounded-full overflow-hidden">
    <div
      className={`h-full ${colorClass} rounded-full`}
      style={{ width: `${percentage}%` }}
    />
  </div>
);

export const TopicClusters = ({ topTopics }) => (
  <CardWrapper icon={BarChart3} title="Topic Clusters">
    {topTopics.length > 0 ? (
      <div className="space-y-3">
        {topTopics.map((topic, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-text-main font-medium">{topic.topic}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-primary-blue/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-blue rounded-full"
                  style={{ width: `${topic.percentage * 100}%` }}
                />
              </div>
              <span className="text-sm text-text-muted w-12 text-right">
                {Math.round(topic.percentage * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        message="Not enough captured text to infer topics yet"
        hint="Topics are derived from post captions and hashtags"
      />
    )}
  </CardWrapper>
);

export const ContentTone = ({ toneBreakdown }) => (
  <CardWrapper icon={MessageSquare} title="Content Tone">
    {toneBreakdown.isNotAnalyzed ? (
      <NotAnalyzedState />
    ) : toneBreakdown.hasData ? (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-status-success font-medium">Positive</span>
            <span className="text-text-muted">{Math.round(toneBreakdown.positive * 100)}%</span>
          </div>
          <ProgressBar percentage={toneBreakdown.positive * 100} colorClass="bg-status-success" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted font-medium">Neutral</span>
            <span className="text-text-muted">{Math.round(toneBreakdown.neutral * 100)}%</span>
          </div>
          <ProgressBar percentage={toneBreakdown.neutral * 100} colorClass="bg-text-muted/40" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 font-medium">Negative</span>
            <span className="text-text-muted">{Math.round(toneBreakdown.negative * 100)}%</span>
          </div>
          <ProgressBar percentage={toneBreakdown.negative * 100} colorClass="bg-slate-400" />
        </div>
      </div>
    ) : (
      <EmptyState
        message="Not enough captured text to analyze tone yet"
        hint="Tone analysis requires text content from posts"
      />
    )}
  </CardWrapper>
);

export const PoliticalContent = ({ politicalPercentage }) => (
  <CardWrapper icon={AlertTriangle} title="Political Content">
    {politicalPercentage === null ? (
      <NotAnalyzedState />
    ) : (
      <>
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-text-main mb-2">
            {Math.round(politicalPercentage * 100)}%
          </div>
          <p className="text-text-muted">of your feed contains political content</p>
        </div>
      </>
    )}
  </CardWrapper>
);

export const WellbeingSignals = ({ wellbeing }) => (
  <CardWrapper icon={Heart} title="Wellbeing Signals">
    {wellbeing.isNotAnalyzed ? (
      <NotAnalyzedState />
    ) : wellbeing.hasData ? (
      <div className="space-y-3">
        <WellbeingRow label="Body image focus" value={wellbeing.bodyImage} />
        <WellbeingRow label="Diet/weight content" value={wellbeing.dietWeight} />
        <WellbeingRow label="Conflict/controversy" value={wellbeing.conflict} isLast />
      </div>
    ) : (
      <EmptyState
        message="No posts captured to analyze wellbeing signals"
        hint="Wellbeing themes are detected from post content"
      />
    )}
  </CardWrapper>
);

const WellbeingRow = ({ label, value, isLast = false }) => (
  <div className={`flex items-center justify-between py-2 ${!isLast ? 'border-b border-border-light/50' : ''}`}>
    <span className="text-text-muted">{label}</span>
    <span className="font-semibold text-text-main">
      {Math.round(value * 100)}%
    </span>
  </div>
);
