import { motion } from 'motion/react';
import { Card } from '../../ui/Card';
import { DashboardHeroInsight } from '../DashboardHeroInsight';
import { DashboardSummaryCard } from '../DashboardSummaryCard';
import { DashboardTabContent } from '../DashboardTabContent';
import { ExpandableDeepDive } from '../ExpandableDeepDive';
import { FeatureGate } from '../../FeatureGate';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

interface PatternsTabProps {
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
  onNavigate: (page: string) => void;
}

// Mock data
const topTopics = [
  { name: 'Wellness', value: 28, color: '#8b5cf6' },
  { name: 'Politics', value: 24, color: '#ef4444' },
  { name: 'Technology', value: 20, color: '#34D1BF' },
  { name: 'Entertainment', value: 15, color: '#f59e0b' },
  { name: 'Lifestyle', value: 13, color: '#ec4899' },
];

const connectionData = [
  { name: 'Friends & Family', value: 15, color: '#ec4899' },
  { name: 'Other Content', value: 85, color: '#94a3b8' },
];

const sevenDayTrends = [
  { day: 'Mon', wellness: 24, politics: 28, tech: 18, entertainment: 16, lifestyle: 14 },
  { day: 'Tue', wellness: 26, politics: 26, tech: 19, entertainment: 15, lifestyle: 14 },
  { day: 'Wed', wellness: 25, politics: 25, tech: 21, entertainment: 15, lifestyle: 14 },
  { day: 'Thu', wellness: 27, politics: 24, tech: 20, entertainment: 16, lifestyle: 13 },
  { day: 'Fri', wellness: 28, politics: 23, tech: 20, entertainment: 17, lifestyle: 12 },
  { day: 'Sat', wellness: 29, politics: 22, tech: 19, entertainment: 18, lifestyle: 12 },
  { day: 'Sun', wellness: 28, politics: 24, tech: 20, entertainment: 15, lifestyle: 13 },
];

const topicDeltas = [
  { topic: 'Wellness', change: 4, direction: 'up' as const },
  { topic: 'Entertainment', change: -1, direction: 'down' as const },
  { topic: 'Tech', change: 2, direction: 'up' as const },
  { topic: 'Politics', change: -4, direction: 'down' as const },
  { topic: 'Lifestyle', change: -1, direction: 'down' as const },
];

export function PatternsTab({ currentPlan, onUpgrade, onNavigate }: PatternsTabProps) {
  return (
    <DashboardTabContent
      semanticColor="blue"
      hero={
        <DashboardHeroInsight
          semanticColor="blue"
          headline="Wellness dominates at 28% of your feed. You spend only 15% of time with friends and family content."
        />
      }
      primary={
        <Card className="p-8" style={{ borderRadius: '16px' }}>
          <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
            What Fills Your Feed
          </h3>
          <div className="space-y-4">
            {topTopics.slice(0, 3).map((topic, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: '14px', color: 'var(--foreground-secondary)' }}>
                    {topic.name}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>
                    {topic.value}%
                  </span>
                </div>
                <div className="h-10 bg-gray-100 rounded-xl overflow-hidden">
                  <motion.div
                    className="h-full rounded-xl"
                    style={{ backgroundColor: topic.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.value}%` }}
                    transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-center" style={{ color: 'var(--foreground-tertiary)' }}>
            Wellness, Politics, and Technology dominate your feed
          </p>
        </Card>
      }
      secondary={
        <>
          {/* Time with Connections */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Time with Connections
            </h4>
            <div className="space-y-4">
              {connectionData.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, delay: i * 0.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Week Deltas Summary */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              This Week's Changes
            </h4>
            <div className="space-y-3">
              {topicDeltas.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                    {item.topic}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.direction === 'up' ? (
                      <TrendingUp size={14} style={{ color: '#34D1BF' }} />
                    ) : (
                      <TrendingDown size={14} style={{ color: '#ef4444' }} />
                    )}
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: item.direction === 'up' ? '#34D1BF' : '#ef4444'
                      }}
                    >
                      {item.direction === 'up' ? '+' : ''}{item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      }
      deepDive={
        <ExpandableDeepDive title="Explore deeper" semanticColor="blue">
          {/* Full topic breakdown */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Complete Topic Breakdown
            </h4>
            <div className="space-y-3">
              {topTopics.map((topic, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                      {topic.name}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                      {topic.value}%
                    </span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{ backgroundColor: topic.color, width: `${topic.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 7-Day Trends - Premium Only */}
          <FeatureGate
            minPlan="premium"
            currentPlan={currentPlan}
            featureName="7-Day Trends"
            benefits={[
              'Track how your feed composition changes over the past week',
              'See which topics are trending up or down in your algorithm',
              'Identify sudden shifts in content type',
            ]}
            onUpgrade={onUpgrade}
            onLearnMore={() => onNavigate('about')}
          >
            <Card className="p-6" style={{ borderRadius: '16px' }}>
              <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                7-Day Topic Trends
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={sevenDayTrends} stackOffset="expand">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="day" style={{ fontSize: '12px' }} />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} style={{ fontSize: '12px' }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="wellness" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.8} name="Wellness" />
                  <Area type="monotone" dataKey="politics" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} name="Politics" />
                  <Area type="monotone" dataKey="tech" stackId="1" stroke="#34D1BF" fill="#34D1BF" fillOpacity={0.8} name="Tech" />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="mt-4 text-xs text-center" style={{ color: 'var(--foreground-tertiary)' }}>
                Rough signal based on recent data patterns
              </p>
            </Card>

            {/* Full deltas */}
            <Card className="p-6" style={{ borderRadius: '16px' }}>
              <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                All Week-over-Week Changes
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {topicDeltas.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: item.direction === 'up' ? '#34D1BF' : '#ef4444',
                      background: item.direction === 'up' ? 'rgba(52, 209, 191, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.topic}</span>
                      <div className="flex items-center gap-1">
                        {item.direction === 'up' ? (
                          <TrendingUp size={14} style={{ color: '#34D1BF' }} />
                        ) : (
                          <TrendingDown size={14} style={{ color: '#ef4444' }} />
                        )}
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: item.direction === 'up' ? '#34D1BF' : '#ef4444'
                          }}
                        >
                          {item.direction === 'up' ? '+' : ''}{item.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </FeatureGate>
        </ExpandableDeepDive>
      }
      summary={
        <DashboardSummaryCard
          semanticColor="blue"
          text="The algorithm prioritizes media over connections. Only 15% of your feed time is with people you know."
          suggestions={[
            "Consider engaging more with friends and family posts to signal your preferences",
            "Notice how wellness content has been increasing while politics is decreasing"
          ]}
        />
      }
    />
  );
}
