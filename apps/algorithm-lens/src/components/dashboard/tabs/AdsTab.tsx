import { motion } from 'motion/react';
import { Card } from '../../ui/Card';
import { DashboardHeroInsight } from '../DashboardHeroInsight';
import { DashboardSummaryCard } from '../DashboardSummaryCard';
import { DashboardTabContent } from '../DashboardTabContent';
import { ExpandableDeepDive } from '../ExpandableDeepDive';
import { FeatureGate } from '../../FeatureGate';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface AdsTabProps {
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
  onNavigate: (page: string) => void;
}

// Mock data
const productCategories = [
  { category: 'Wellness & Fitness', value: 32 },
  { category: 'Tech & Gadgets', value: 28 },
  { category: 'Fashion & Beauty', value: 18 },
  { category: 'Food & Dining', value: 14 },
  { category: 'Home & Living', value: 8 },
];

const topBrands = [
  { name: 'Nike', mentions: 142, sentiment: 85, category: 'Athletic' },
  { name: 'Apple', mentions: 128, sentiment: 90, category: 'Tech' },
  { name: 'Lululemon', mentions: 98, sentiment: 88, category: 'Athletic' },
  { name: 'Whole Foods', mentions: 86, sentiment: 75, category: 'Food' },
  { name: 'Peloton', mentions: 74, sentiment: 80, category: 'Fitness' },
  { name: 'Tesla', mentions: 68, sentiment: 72, category: 'Tech' },
  { name: 'Glossier', mentions: 54, sentiment: 82, category: 'Beauty' },
  { name: 'Patagonia', mentions: 48, sentiment: 92, category: 'Outdoor' },
];

const topProducts = [
  { name: 'Fitness Tracker', count: 284 },
  { name: 'Yoga Mat', count: 231 },
  { name: 'Protein Powder', count: 198 },
  { name: 'Running Shoes', count: 176 },
  { name: 'Meditation App', count: 152 },
  { name: 'Smart Watch', count: 134 },
  { name: 'Meal Prep Kit', count: 108 },
  { name: 'Workout Clothes', count: 89 },
];

export function AdsTab({ currentPlan, onUpgrade, onNavigate }: AdsTabProps) {
  return (
    <DashboardTabContent
      semanticColor="blue"
      hero={
        <DashboardHeroInsight
          semanticColor="blue"
          headline="32% of your feed is designed to sell you something. Wellness products dominate your commercial profile."
        />
      }
      primary={
        <Card className="p-8" style={{ borderRadius: '16px' }}>
          <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
            Top Product Categories
          </h3>
          <div className="space-y-4">
            {productCategories.slice(0, 3).map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: '14px', color: 'var(--foreground-secondary)' }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-10 bg-gray-100 rounded-xl overflow-hidden">
                  <motion.div
                    className="h-full rounded-xl"
                    style={{ backgroundColor: '#34D1BF' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-center" style={{ color: 'var(--foreground-tertiary)' }}>
            Wellness & Fitness leads at 32%, followed by Tech & Gadgets at 28%
          </p>
        </Card>
      }
      secondary={
        <>
          {/* Top 4 Brands */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Top Brands
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {topBrands.slice(0, 4).map((brand, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border text-center"
                  style={{ borderColor: '#e5e5e5' }}
                >
                  <h5 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{brand.name}</h5>
                  <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginBottom: '4px' }}>{brand.category}</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#34D1BF' }}>{brand.mentions}</p>
                  <p style={{ fontSize: '10px', color: 'var(--foreground-muted)' }}>mentions</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Ad Frequency */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              Ad Frequency
            </h4>
            <div className="text-center py-4">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{ background: 'rgba(52, 209, 191, 0.1)' }}
              >
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#34D1BF' }}>32%</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
                Commercial Content
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--foreground-tertiary)' }}>
                Nearly 1 in 3 posts is designed to sell
              </p>
            </div>
          </Card>
        </>
      }
      deepDive={
        <ExpandableDeepDive title="Explore deeper" semanticColor="blue">
          {/* Full Categories Chart */}
          <Card className="p-6" style={{ borderRadius: '16px' }}>
            <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
              All Product Categories
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={120} style={{ fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#34D1BF" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Brand Tracker - Premium */}
          <FeatureGate
            minPlan="premium"
            currentPlan={currentPlan}
            featureName="Full Brand Tracker"
            benefits={[
              'Track which brands appear most frequently',
              'See brand sentiment scores',
              'Understand your commercial profile',
            ]}
            onUpgrade={onUpgrade}
            onLearnMore={() => onNavigate('about')}
          >
            <Card className="p-6" style={{ borderRadius: '16px' }}>
              <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                Brand Exposure Tracker
              </h4>
              <div className="space-y-3">
                {topBrands.map((brand, i) => (
                  <motion.div
                    key={i}
                    className="border rounded-lg p-3"
                    style={{ borderColor: '#e5e5e5' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 style={{ fontSize: '14px', fontWeight: 600 }}>{brand.name}</h5>
                        <p style={{ fontSize: '11px', color: 'var(--foreground-muted)' }}>{brand.category}</p>
                      </div>
                      <div className="text-right">
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#34D1BF' }}>
                          {brand.mentions}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--foreground-muted)' }}>mentions</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: '11px', color: 'var(--foreground-secondary)' }}>Sentiment</span>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{brand.sentiment}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{
                            height: '100%',
                            width: `${brand.sentiment}%`,
                            background: brand.sentiment >= 80 ? '#34D1BF' : brand.sentiment >= 60 ? '#f59e0b' : '#ef4444',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Top Products */}
            <Card className="p-6" style={{ borderRadius: '16px' }}>
              <h4 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                Top Products Promoted
              </h4>
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{product.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#34D1BF' }}>
                        {product.count} times
                      </span>
                    </div>
                    <div className="h-5 bg-gray-100 rounded-lg overflow-hidden">
                      <motion.div
                        className="h-full rounded-lg"
                        style={{
                          background: 'linear-gradient(90deg, #34D1BF 0%, #8B6EF8 100%)',
                          width: `${(product.count / 284) * 100}%`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(product.count / 284) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                      />
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
          text="Every interaction reinforces your commercial identity. The algorithm knows you're valuable to wellness advertisers."
          suggestions={[
            "Your engagement shapes what products you'll see more of",
            "Commercial transparency helps reveal how algorithms monetize your attention"
          ]}
        />
      }
    />
  );
}
