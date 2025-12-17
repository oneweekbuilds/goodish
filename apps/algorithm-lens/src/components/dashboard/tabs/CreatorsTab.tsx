import { motion } from 'motion/react';
import { Card } from '../../ui/Card';
import { DashboardHeroInsight } from '../DashboardHeroInsight';
import { DashboardSummaryCard } from '../DashboardSummaryCard';
import { DashboardTabContent } from '../DashboardTabContent';
import { ExpandableDeepDive } from '../ExpandableDeepDive';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface CreatorsTabProps {
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
}

// Mock data
const creatorConcentration = [
  { name: 'Top 10 Creators', value: 68, color: '#ef4444' },
  { name: 'All Others', value: 32, color: '#94a3b8' },
];

const geographicData = [
  { region: 'North America', value: 78, color: '#34D1BF' },
  { region: 'Europe', value: 10, color: '#8b5cf6' },
  { region: 'Asia', value: 8, color: '#f59e0b' },
  { region: 'Other', value: 4, color: '#94a3b8' },
];

export function CreatorsTab(_props: CreatorsTabProps) {

  return (
    <DashboardTabContent
      semanticColor="green"
      hero={
        <DashboardHeroInsight
          semanticColor="green"
          headline="68% of your feed comes from just 10 creators. 78% of voices are from North America."
        />
      }
      primary={
        <Card className="p-8" style={{ borderRadius: '16px' }}>
          <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
            Who Shapes Your View
          </h3>
          <div className="space-y-4">
            {creatorConcentration.map((item, i) => (
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
                    transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-center" style={{ color: 'var(--foreground-tertiary)' }}>
            A tiny group of 10 creators controls 68% of what you see
          </p>
        </Card>
      }
      secondary={
        <>
          {/* Geographic Top 2 */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Geographic Origin
            </h4>
            <div className="space-y-4">
              {geographicData.slice(0, 2).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: item.color }} />
                    <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                      {item.region}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
              Most content creators in your feed are from North America
            </p>
          </Card>

          {/* Creator Diversity Score */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Creator Diversity Score
            </h4>
            <div className="text-center py-4">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
              >
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>Low</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                Your feed is highly concentrated among few creators
              </p>
            </div>
          </Card>
        </>
      }
      deepDive={
        <ExpandableDeepDive title="Explore deeper" semanticColor="green">
          {/* Full Geographic Breakdown */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Full Geographic Distribution
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={geographicData}
                  dataKey="value"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {geographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* All Geographic Data */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Regional Breakdown
            </h4>
            <div className="space-y-3">
              {geographicData.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                      {item.region}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{ backgroundColor: item.color, width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-center" style={{ color: 'var(--foreground-tertiary)' }}>
              The more balanced this distribution, the broader the perspectives you see.
            </p>
          </Card>
        </ExpandableDeepDive>
      }
      summary={
        <DashboardSummaryCard
          semanticColor="green"
          text="Your worldview is shaped by a very small group. 68% from just 10 creators affects understanding of culture, economics, and global perspectives."
          suggestions={[
            "Consider following creators from different regions",
            "Diversifying your creator base can broaden your perspective"
          ]}
        />
      }
    />
  );
}
