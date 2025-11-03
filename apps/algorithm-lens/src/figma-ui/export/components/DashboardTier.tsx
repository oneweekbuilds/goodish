import { motion } from 'motion/react';
import { Lock, TrendingUp, BarChart3, Users, Map, Activity, Layers, PieChart } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface DashboardTierProps {
  tier: 'free' | 'pro' | 'premium';
  onUpgrade?: () => void;
}

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  locked?: boolean;
  lockMessage?: string;
  chartType: 'pie' | 'bar' | 'bubble' | 'heatmap' | 'line' | 'stacked' | 'donut' | 'sparkline';
  tier: 'free' | 'pro' | 'premium';
}

const DashboardCard = ({ title, subtitle, locked, lockMessage, chartType, tier }: DashboardCardProps) => {
  const getChartBackground = () => {
    if (locked) return '#F3F4F6';
    if (tier === 'free') return '#F3F4F6';
    if (tier === 'pro') return 'linear-gradient(90deg, #D9F3F2, #E4D9FF)';
    return 'linear-gradient(90deg, #E4D9FF, #D9F3F2)';
  };

  const renderChartPlaceholder = () => {
    const background = getChartBackground();
    
    switch (chartType) {
      case 'pie':
        return (
          <div className="w-full h-full flex items-center justify-center" style={{ background }}>
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-[24px]" style={{ borderColor: locked ? '#D1D5DB' : '#7D66E6', borderRightColor: locked ? '#9CA3AF' : '#4F9FA9', borderBottomColor: locked ? '#E5E7EB' : '#B8A4F5' }} />
            </div>
          </div>
        );
      
      case 'bar':
        return (
          <div className="w-full h-full flex items-end justify-around gap-3 p-6" style={{ background }}>
            {[65, 85, 45, 90, 70].map((height, i) => (
              <div key={i} className="flex-1 rounded-t-lg transition-all" style={{ height: `${height}%`, background: locked ? '#D1D5DB' : '#7D66E6' }} />
            ))}
          </div>
        );
      
      case 'bubble':
        return (
          <div className="w-full h-full flex items-center justify-center gap-4 p-6" style={{ background }}>
            {[60, 80, 45, 70].map((size, i) => (
              <div 
                key={i} 
                className="rounded-full" 
                style={{ 
                  width: size, 
                  height: size, 
                  background: locked ? '#D1D5DB' : i % 2 === 0 ? '#7D66E6' : '#4F9FA9',
                  opacity: 0.7
                }} 
              />
            ))}
          </div>
        );
      
      case 'heatmap':
        return (
          <div className="w-full h-full grid grid-cols-6 grid-rows-4 gap-2 p-6" style={{ background }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i} 
                className="rounded"
                style={{ 
                  background: locked ? '#E5E7EB' : `rgba(125, 102, 230, ${0.2 + (i % 5) * 0.15})`
                }} 
              />
            ))}
          </div>
        );
      
      case 'line':
        return (
          <div className="w-full h-full flex items-end p-6" style={{ background }}>
            <svg width="100%" height="100%" viewBox="0 0 300 150">
              <polyline
                points="0,120 50,80 100,90 150,50 200,60 250,30 300,40"
                fill="none"
                stroke={locked ? '#D1D5DB' : '#7D66E6'}
                strokeWidth="3"
              />
              <polyline
                points="0,130 50,110 100,100 150,80 200,90 250,70 300,60"
                fill="none"
                stroke={locked ? '#E5E7EB' : '#4F9FA9'}
                strokeWidth="3"
              />
            </svg>
          </div>
        );
      
      case 'stacked':
        return (
          <div className="w-full h-full flex items-end justify-around gap-3 p-6" style={{ background }}>
            {[70, 85, 60, 90].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1">
                <div className="rounded-t" style={{ height: '40%', background: locked ? '#D1D5DB' : '#7D66E6' }} />
                <div className="rounded" style={{ height: '30%', background: locked ? '#E5E7EB' : '#4F9FA9' }} />
                <div className="rounded-b" style={{ height: '30%', background: locked ? '#F3F4F6' : '#B8A4F5' }} />
              </div>
            ))}
          </div>
        );
      
      case 'donut':
        return (
          <div className="w-full h-full flex items-center justify-center" style={{ background }}>
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-[28px]" style={{ borderColor: locked ? '#D1D5DB' : '#7D66E6', borderRightColor: locked ? '#9CA3AF' : '#4F9FA9', borderBottomColor: locked ? '#E5E7EB' : '#B8A4F5' }} />
              <div className="absolute inset-8 rounded-full bg-white" />
            </div>
          </div>
        );
      
      case 'sparkline':
        return (
          <div className="w-full h-full flex items-center p-6" style={{ background }}>
            <svg width="100%" height="60" viewBox="0 0 300 60">
              <polyline
                points="0,45 30,35 60,40 90,25 120,30 150,20 180,25 210,15 240,20 270,10 300,15"
                fill="none"
                stroke="#4F9FA9"
                strokeWidth="2"
              />
              <polyline
                points="0,45 30,35 60,40 90,25 120,30 150,20 180,25 210,15 240,20 270,10 300,15"
                fill="url(#sparklineGradient)"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4F9FA9" />
                  <stop offset="100%" stopColor="#4F9FA9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );
      
      default:
        return <div className="w-full h-full" style={{ background }} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="relative overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)', borderRadius: '16px', height: '300px' }}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-4">
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', fontFamily: 'Inter' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginTop: '4px' }}>
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex-1 relative rounded-lg overflow-hidden">
            {renderChartPlaceholder()}
          </div>
        </div>

        {locked && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center px-6">
              <div className="mb-3 flex justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                  <Lock size={20} style={{ color: '#6B7280' }} />
                </div>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
                {lockMessage || 'Upgrade to unlock this insight'}
              </p>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export function DashboardTier({ tier, onUpgrade }: DashboardTierProps) {
  const getTierBadgeStyles = () => {
    switch (tier) {
      case 'free':
        return { background: '#F3F4F6', color: '#6B7280', text: 'FREE' };
      case 'pro':
        return { background: '#7D66E6', color: '#FFFFFF', text: 'PRO' };
      case 'premium':
        return { background: '#4F9FA9', color: '#FFFFFF', text: 'PREMIUM' };
    }
  };

  const badgeStyles = getTierBadgeStyles();

  return (
    <div 
      className="w-full min-h-screen px-6 py-12 md:px-24 md:py-12"
      style={{ 
        background: '#FFFFFF',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-8 md:px-12 md:py-12"
        style={{
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          borderRadius: '16px',
          background: '#FFFFFF',
          maxWidth: '1440px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', fontFamily: 'Inter' }}>
            AlgorithmLens Dashboard
          </h1>
          <div 
            className="px-4 py-2 rounded-full"
            style={{ 
              background: badgeStyles.background, 
              color: badgeStyles.color,
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
              {badgeStyles.text}
            </span>
          </div>
        </div>

        <div className="mb-8 h-px" style={{ background: '#E5E7EB' }} />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Feed Breakdown - Always Unlocked */}
          <DashboardCard
            title="Feed Breakdown by Category"
            subtitle="Distribution of content types"
            locked={false}
            chartType="pie"
            tier={tier}
          />

          {/* Top 5 Topics - Always Unlocked */}
          <DashboardCard
            title="Top 5 Topics You Engage With"
            subtitle="Your most-viewed content areas"
            locked={false}
            chartType="bar"
            tier={tier}
          />

          {/* Ad Transparency - Pro+ */}
          <DashboardCard
            title="Ad Transparency"
            subtitle="Ad types and engagement rates"
            locked={tier === 'free'}
            lockMessage="Upgrade to Pro to unlock Ad Transparency insights."
            chartType="bar"
            tier={tier}
          />

          {/* Influencer Analysis - Pro+ */}
          <DashboardCard
            title="Influencer Concentration"
            subtitle="Creator reach distribution"
            locked={tier === 'free'}
            lockMessage="Upgrade to Pro to unlock Influencer Analysis."
            chartType="bubble"
            tier={tier}
          />

          {/* Bias Map - Premium only */}
          <DashboardCard
            title="Platform Bias Map"
            subtitle="Content bias by platform and topic"
            locked={tier !== 'premium'}
            lockMessage={tier === 'free' ? 'Upgrade to Premium to explore bias by platform and topic.' : 'Upgrade to Premium to explore bias by platform and topic.'}
            chartType="heatmap"
            tier={tier}
          />

          {/* Sentiment Trend - Pro+ */}
          {tier !== 'free' && (
            <DashboardCard
              title="Sentiment Trend Over Time"
              subtitle="Emotional tone of your feed"
              locked={false}
              chartType="line"
              tier={tier}
            />
          )}

          {/* Engagement by Platform - Premium only */}
          {tier === 'premium' && (
            <DashboardCard
              title="Engagement by Platform"
              subtitle="Activity breakdown across platforms"
              locked={false}
              chartType="stacked"
              tier={tier}
            />
          )}

          {/* Content Tone - Premium only */}
          {tier === 'premium' && (
            <DashboardCard
              title="Content Tone Chart"
              subtitle="Distribution of content emotional tone"
              locked={false}
              chartType="donut"
              tier={tier}
            />
          )}
        </div>

        {/* Upgrade Banners */}
        {tier === 'free' && (
          <motion.div
            className="rounded-2xl p-8 flex items-center justify-between"
            style={{
              background: 'linear-gradient(90deg, #E4D9FF, #D9F3F2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                Upgrade to Pro for deeper insights
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Unlock ad transparency, creator analysis, and sentiment tracking.
              </p>
            </div>
            <Button 
              onClick={onUpgrade}
              className="px-6 py-3 rounded-lg"
              style={{ background: '#7D66E6', color: '#FFFFFF', fontWeight: 600 }}
            >
              Upgrade to Pro
            </Button>
          </motion.div>
        )}

        {tier === 'pro' && (
          <motion.div
            className="rounded-2xl p-8 flex items-center justify-between"
            style={{
              background: 'linear-gradient(90deg, #D9F3F2, #E4D9FF)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                Unlock the full picture with Premium
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                See platform bias, advanced comparisons, and complete algorithmic analysis.
              </p>
            </div>
            <Button 
              onClick={onUpgrade}
              className="px-6 py-3 rounded-lg"
              style={{ background: '#4F9FA9', color: '#FFFFFF', fontWeight: 600 }}
            >
              Upgrade to Premium
            </Button>
          </motion.div>
        )}

        {tier === 'premium' && (
          <motion.div
            className="rounded-2xl p-8"
            style={{
              background: 'linear-gradient(90deg, #E4D9FF, #D9F3F2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                  Algorithm Insights Summary
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                  These insights reflect your personalized algorithmic footprint across all major platforms.
                </p>
              </div>
              <div className="w-48 h-16">
                <svg width="100%" height="100%" viewBox="0 0 200 60">
                  <polyline
                    points="0,45 20,35 40,40 60,25 80,30 100,20 120,25 140,15 160,20 180,10 200,15"
                    fill="none"
                    stroke="#4F9FA9"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

