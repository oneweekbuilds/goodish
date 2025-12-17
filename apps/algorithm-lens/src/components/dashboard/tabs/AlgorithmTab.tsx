import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Layers, Clock, RefreshCw, Eye } from 'lucide-react';
import { FeatureGate } from '../../FeatureGate';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface AlgorithmTabProps {
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
  onNavigate: (page: string) => void;
}

// Interpretive data (not raw stats)
const topRecurringThemes = [
  { theme: 'Wellness & Self-Care', strength: 72 },
  { theme: 'Technology News', strength: 58 },
  { theme: 'Entertainment', strength: 45 },
];

const platformBreakdown = [
  { platform: 'Instagram', dominant: 'Wellness', percentage: 35 },
  { platform: 'TikTok', dominant: 'Entertainment', percentage: 28 },
  { platform: 'Twitter', dominant: 'Politics', percentage: 45 },
  { platform: 'YouTube', dominant: 'Tech', percentage: 30 },
];

const topicSentimentData = [
  { topic: 'Wellness', positive: 75, neutral: 15, negative: 10 },
  { topic: 'Politics', positive: 25, neutral: 15, negative: 60 },
  { topic: 'Tech', positive: 65, neutral: 25, negative: 10 },
];

export function AlgorithmTab({ currentPlan, onUpgrade, onNavigate }: AlgorithmTabProps) {
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);

  return (
    <FeatureGate
      minPlan="premium"
      currentPlan={currentPlan}
      featureName="What the Algorithm Thinks"
      benefits={[
        'See patterns across platforms you wouldn\'t notice on your own',
        'Understand why certain content keeps appearing',
        'Discover how your feed differs from typical users',
        'Get gentle suggestions for shifting patterns over time',
      ]}
      onUpgrade={onUpgrade}
      onLearnMore={() => onNavigate('about')}
    >
      <div className="space-y-20 md:space-y-28">

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: HERO INTERPRETATION

            This is THE moment. Full-width. Dominant. Editorial.
            No cards. No charts. No icons cluttering the message.
            Just a powerful interpretive statement that says something real.
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="relative -mx-6 md:-mx-8 lg:-mx-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div
            className="w-full py-20 md:py-28 lg:py-32 px-8 md:px-16 lg:px-24"
            style={{
              background: `linear-gradient(
                160deg,
                rgba(37, 99, 235, 0.06) 0%,
                rgba(37, 99, 235, 0.12) 35%,
                rgba(37, 99, 235, 0.08) 70%,
                rgba(37, 99, 235, 0.04) 100%
              )`,
            }}
          >
            <div className="max-w-4xl mx-auto">
              {/* Quiet provenance marker - small, unobtrusive */}
              <motion.p
                className="mb-10 md:mb-12"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--dashboard-blue)',
                  opacity: 0.8,
                  letterSpacing: '0.02em',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Based on patterns across 4 platforms • Updated 2 hours ago
              </motion.p>

              {/* THE HEADLINE - This is the emotional anchor */}
              <motion.h1
                style={{
                  fontSize: 'clamp(32px, 6vw, 56px)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-headline)',
                  color: 'var(--foreground)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  maxWidth: '900px',
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              >
                Your feed keeps returning to
                <span style={{ color: 'var(--dashboard-blue)' }}> wellness</span> and
                <span style={{ color: 'var(--dashboard-blue)' }}> technology</span>—
                even when you don't ask for it.
              </motion.h1>

              {/* Subtext - honest, humble */}
              <motion.p
                className="mt-8 md:mt-10"
                style={{
                  fontSize: 'clamp(16px, 2vw, 19px)',
                  lineHeight: 1.7,
                  color: 'var(--foreground-secondary)',
                  maxWidth: '640px',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                This is our best interpretation based on what we've observed.
                Algorithms don't explain themselves—we're reading between the lines.
              </motion.p>
            </div>
          </div>
        </motion.section>


        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: PRIMARY INTERPRETATION

            One confident takeaway. One restrained visual.
            The visual supports the insight—it doesn't compete with it.
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="w-full max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          {/* Primary insight sentence - large and confident */}
          <h2
            style={{
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              fontWeight: 600,
              fontFamily: 'var(--font-headline)',
              color: 'var(--foreground)',
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Three themes dominate what you see.
          </h2>

          <p
            style={{
              fontSize: '17px',
              color: 'var(--foreground-secondary)',
              lineHeight: 1.7,
              marginBottom: '48px',
              maxWidth: '580px',
            }}
          >
            These topics surface consistently across platforms—
            a signal that algorithms have identified strong engagement patterns.
          </p>

          {/* Single restrained visual - the dominant themes */}
          <div className="space-y-8">
            {topRecurringThemes.map((item, index) => (
              <motion.div
                key={item.theme}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.15, duration: 0.5 }}
              >
                {/* Theme name - dominant */}
                <div className="flex items-baseline justify-between mb-3">
                  <span
                    style={{
                      fontSize: index === 0 ? '20px' : '17px',
                      fontWeight: index === 0 ? 600 : 500,
                      fontFamily: 'var(--font-headline)',
                      color: index === 0 ? 'var(--foreground)' : 'var(--foreground-secondary)',
                    }}
                  >
                    {item.theme}
                  </span>
                  {index === 0 && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'var(--dashboard-blue)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Most prominent
                    </span>
                  )}
                </div>

                {/* Progress bar - simple, elegant */}
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{
                    background: 'rgba(37, 99, 235, 0.08)',
                  }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: index === 0
                        ? 'var(--dashboard-blue)'
                        : index === 1
                        ? 'rgba(37, 99, 235, 0.55)'
                        : 'rgba(37, 99, 235, 0.30)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.strength}%` }}
                    transition={{ delay: 0.9 + index * 0.15, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quiet footnote */}
          <p
            className="mt-10"
            style={{
              fontSize: '13px',
              color: 'var(--foreground-muted)',
              lineHeight: 1.6,
            }}
          >
            Pattern strength reflects how often these topics appear relative to everything else in your feed.
          </p>
        </motion.section>


        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3: WHY THIS MAY BE HAPPENING

            Two supporting observations. Quieter. Secondary.
            Explains context without competing with the primary insight.
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {/* Section label - understated */}
          <p
            className="mb-8 text-center"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--foreground-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Why this may be happening
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Context Card 1: Feed narrowness */}
            <div
              className="p-8"
              style={{
                background: 'rgba(37, 99, 235, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(37, 99, 235, 0.08)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <Layers size={18} style={{ color: 'var(--dashboard-blue)', opacity: 0.7 }} />
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-headline)',
                  }}
                >
                  Narrowing focus
                </span>
              </div>

              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--foreground-secondary)',
                  lineHeight: 1.7,
                }}
              >
                Your feed appears <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>moderately narrow</strong>—
                a few topics dominate while others rarely appear. This happens when algorithms
                detect consistent engagement patterns.
              </p>

              {/* Visual indicator - quiet */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: '35%', background: 'var(--dashboard-blue)', opacity: 0.6 }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--foreground-muted)' }}>
                  Narrow
                </span>
              </div>
            </div>

            {/* Context Card 2: Pattern persistence */}
            <div
              className="p-8"
              style={{
                background: 'rgba(37, 99, 235, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(37, 99, 235, 0.08)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <Clock size={18} style={{ color: 'var(--dashboard-blue)', opacity: 0.7 }} />
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-headline)',
                  }}
                >
                  Sticky patterns
                </span>
              </div>

              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--foreground-secondary)',
                  lineHeight: 1.7,
                }}
              >
                These themes have been <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>persistent over time</strong>.
                Once the algorithm identifies an interest, it reinforces it—
                changing direction typically requires sustained effort.
              </p>

              {/* Visual indicator - quiet */}
              <div className="flex items-center gap-2 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    style={{
                      background: i <= 3 ? 'var(--dashboard-blue)' : 'rgba(37, 99, 235, 0.15)',
                      opacity: i <= 3 ? 0.6 : 1,
                    }}
                  />
                ))}
                <span style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginLeft: '8px' }}>
                  High
                </span>
              </div>
            </div>
          </div>
        </motion.section>


        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4: DEEPER DETAILS (COLLAPSED)

            For users who want more. Must not compete with primary content.
            Clearly marked as optional. Contains the dense data.
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="w-full max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <button
            onClick={() => setDeepDiveOpen(!deepDiveOpen)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl transition-all duration-200 group"
            style={{
              background: deepDiveOpen ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
              border: '1px dashed rgba(37, 99, 235, 0.2)',
            }}
          >
            <Eye size={16} style={{ color: 'var(--dashboard-blue)', opacity: 0.6 }} />
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--dashboard-blue)',
                opacity: 0.8,
              }}
            >
              {deepDiveOpen ? 'Hide detailed breakdowns' : 'Explore detailed breakdowns'}
            </span>
            <motion.div
              animate={{ rotate: deepDiveOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronDown size={16} style={{ color: 'var(--dashboard-blue)', opacity: 0.6 }} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {deepDiveOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-10 space-y-8">
                  {/* Platform-by-platform breakdown */}
                  <div
                    className="p-6"
                    style={{
                      background: 'var(--card-bg)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <h4
                      className="mb-1"
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-headline)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Platform-by-Platform
                    </h4>
                    <p
                      className="mb-6"
                      style={{
                        fontSize: '13px',
                        color: 'var(--foreground-tertiary)',
                      }}
                    >
                      Each platform optimizes for different engagement signals
                    </p>

                    <div className="space-y-3">
                      {platformBreakdown.map((platform) => (
                        <div
                          key={platform.platform}
                          className="flex items-center justify-between py-3"
                          style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--foreground)',
                                minWidth: '80px',
                              }}
                            >
                              {platform.platform}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                              leans toward <strong style={{ color: 'var(--foreground)' }}>{platform.dominant}</strong>
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
                            ~{platform.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment distribution */}
                  <div
                    className="p-6"
                    style={{
                      background: 'var(--card-bg)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <h4
                      className="mb-1"
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-headline)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Emotional Tone by Topic
                    </h4>
                    <p
                      className="mb-6"
                      style={{
                        fontSize: '13px',
                        color: 'var(--foreground-tertiary)',
                      }}
                    >
                      Algorithms often amplify emotionally charged content
                    </p>

                    <div style={{ height: '160px', opacity: 0.85 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topicSentimentData} barCategoryGap="25%">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                          <XAxis
                            dataKey="topic"
                            tick={{ fontSize: 12, fill: 'var(--foreground-tertiary)' }}
                            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'var(--foreground-muted)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              fontSize: '12px',
                            }}
                            formatter={(value: number) => `${value}%`}
                          />
                          <Bar dataKey="positive" stackId="a" fill="rgba(16, 185, 129, 0.65)" name="Positive" />
                          <Bar dataKey="neutral" stackId="a" fill="rgba(148, 163, 184, 0.45)" name="Neutral" />
                          <Bar dataKey="negative" stackId="a" fill="rgba(239, 68, 68, 0.55)" name="Negative" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>


        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5: SUMMARY & AGENCY

            A calm closing. Reassurance, not prescription.
            Suggestions are optional, collapsible.
            The tone is: "This is what we see. You decide what it means."
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.section
          className="w-full max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div
            className="p-10 md:p-12 text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.08) 100%)',
              borderRadius: '24px',
            }}
          >
            {/* Reassurance headline */}
            <div
              className="w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(37, 99, 235, 0.1)' }}
            >
              <RefreshCw size={20} style={{ color: 'var(--dashboard-blue)' }} />
            </div>

            <h3
              style={{
                fontSize: '24px',
                fontWeight: 600,
                fontFamily: 'var(--font-headline)',
                color: 'var(--foreground)',
                marginBottom: '12px',
                letterSpacing: '-0.01em',
              }}
            >
              Patterns, not identity.
            </h3>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--foreground-secondary)',
                lineHeight: 1.7,
                maxWidth: '480px',
                margin: '0 auto',
              }}
            >
              What algorithms show you reflects past behavior—not who you are.
              These patterns can shift, but it happens gradually.
            </p>

            {/* Collapsible suggestions */}
            <div className="mt-10">
              <button
                onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: suggestionsExpanded ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--dashboard-blue)',
                  }}
                >
                  {suggestionsExpanded ? 'Hide suggestions' : 'If you wanted to shift things'}
                </span>
                <motion.div
                  animate={{ rotate: suggestionsExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} style={{ color: 'var(--dashboard-blue)' }} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {suggestionsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-6 space-y-3 text-left max-w-md mx-auto">
                      {[
                        'Seek out content on topics you want to see more of',
                        'Use "not interested" options when they appear',
                        'Engage thoughtfully—algorithms track all interactions',
                        'Expect change to take weeks, not days',
                      ].map((suggestion, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3"
                          style={{
                            fontSize: '14px',
                            color: 'var(--foreground-secondary)',
                            lineHeight: 1.6,
                          }}
                        >
                          <span style={{ color: 'var(--dashboard-blue)', opacity: 0.5, marginTop: '6px' }}>
                            •
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Closing thought */}
            <p
              className="mt-10"
              style={{
                fontSize: '14px',
                color: 'var(--foreground-muted)',
                fontStyle: 'italic',
              }}
            >
              "The goal isn't to beat the algorithm. It's to understand what it's showing you."
            </p>
          </div>
        </motion.section>

      </div>
    </FeatureGate>
  );
}
