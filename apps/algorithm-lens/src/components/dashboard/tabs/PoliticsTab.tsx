import { motion } from 'motion/react';
import { Card } from '../../ui/Card';
import { DashboardHeroInsight } from '../DashboardHeroInsight';
import { DashboardSummaryCard } from '../DashboardSummaryCard';
import { DashboardTabContent } from '../DashboardTabContent';
import { ExpandableDeepDive } from '../ExpandableDeepDive';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface PoliticsTabProps {
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
}

// Mock data
const politicalLean = [
  { name: 'Left', value: 58, color: '#3b82f6' },
  { name: 'Neutral', value: 22, color: '#94a3b8' },
  { name: 'Right', value: 20, color: '#ef4444' },
];

const contentTone = [
  { tone: 'Balanced', value: 14, color: '#34D1BF' },
  { tone: 'Analytical', value: 28, color: '#94a3b8' },
  { tone: 'Outrage', value: 38, color: '#ef4444' },
  { tone: 'Empathetic', value: 20, color: '#8b5cf6' },
];

const topicSentiment = [
  { topic: 'Wellness', positive: 60, neutral: 25, negative: 15 },
  { topic: 'Politics', positive: 25, neutral: 15, negative: 60 },
  { topic: 'Tech', positive: 65, neutral: 20, negative: 15 },
  { topic: 'Sustainability', positive: 70, neutral: 20, negative: 10 },
  { topic: 'Finance', positive: 35, neutral: 30, negative: 35 },
  { topic: 'Mental Health', positive: 55, neutral: 25, negative: 20 },
  { topic: 'Lifestyle', positive: 50, neutral: 30, negative: 20 },
  { topic: 'Sports', positive: 45, neutral: 30, negative: 25 },
];

export function PoliticsTab(_props: PoliticsTabProps) {

  return (
    <DashboardTabContent
      semanticColor="green"
      hero={
        <DashboardHeroInsight
          semanticColor="green"
          headline="58% of your political content leans left, with 38% framed using outrage-driven language."
        />
      }
      primary={
        <Card className="p-8" style={{ borderRadius: '16px' }}>
          <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
            Political Distribution
          </h3>
          <div className="space-y-4">
            {politicalLean.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: '14px', color: 'var(--foreground-secondary)' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-10 bg-gray-100 rounded-xl overflow-hidden">
                  <motion.div
                    className="h-full rounded-xl"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-center" style={{ color: 'var(--foreground-tertiary)' }}>
            Your feed skews 58% left-leaning with 22% neutral content
          </p>
        </Card>
      }
      secondary={
        <>
          {/* Dominant Tone */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Dominant Content Tone
            </h4>
            <div className="text-center py-4">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
              >
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>38%</span>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>
                Outrage-Driven
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                The most common emotional framing in your feed
              </p>
            </div>
          </Card>

          {/* Quick Tone Breakdown */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Tone Breakdown
            </h4>
            <div className="space-y-3">
              {contentTone.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: item.color }} />
                    <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                      {item.tone}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      }
      deepDive={
        <ExpandableDeepDive title="Explore deeper" semanticColor="green">
          {/* Full Content Tone Chart */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Content Tone Distribution
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contentTone} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" />
                <YAxis dataKey="tone" type="category" width={80} style={{ fontSize: '12px' }} />
                <RechartsTooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {contentTone.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* How Topics Are Framed */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              How Topics Are Framed
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topicSentiment.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                      {item.topic}
                    </span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-8 rounded-lg overflow-hidden cursor-pointer flex"
                          style={{ background: '#F5F7FC' }}
                        >
                          <div
                            className="h-full flex items-center justify-center"
                            style={{ background: '#3ED6B2', width: `${item.positive}%` }}
                          >
                            {item.positive >= 10 && (
                              <span style={{ fontSize: '12px', color: '#FFF', fontWeight: 600 }}>
                                {item.positive}%
                              </span>
                            )}
                          </div>
                          <div
                            className="h-full flex items-center justify-center"
                            style={{ background: '#94a3b8', width: `${item.neutral}%` }}
                          >
                            {item.neutral >= 10 && (
                              <span style={{ fontSize: '12px', color: '#FFF', fontWeight: 600 }}>
                                {item.neutral}%
                              </span>
                            )}
                          </div>
                          <div
                            className="h-full flex items-center justify-center"
                            style={{ background: '#7B61FF', width: `${item.negative}%` }}
                          >
                            {item.negative >= 10 && (
                              <span style={{ fontSize: '12px', color: '#FFF', fontWeight: 600 }}>
                                {item.negative}%
                              </span>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Positive: {item.positive}% | Neutral: {item.neutral}% | Negative: {item.negative}%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: '#3ED6B2' }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A1A' }}>Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: '#94a3b8' }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A1A' }}>Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: '#7B61FF' }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A1A' }}>Negative</span>
              </div>
            </div>
          </Card>
        </ExpandableDeepDive>
      }
      summary={
        <DashboardSummaryCard
          semanticColor="green"
          text="38% of political content uses outrage-driven language. This reinforces beliefs and makes compromise feel impossible."
          suggestions={[
            "Notice when content triggers strong emotional reactions",
            "Seek out balanced or analytical sources for comparison"
          ]}
        />
      }
    />
  );
}
