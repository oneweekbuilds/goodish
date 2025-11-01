import { useState } from 'react';
import { DashboardTier } from './DashboardTier';
import { Button } from './ui/button';

export function DashboardTierDemo() {
  const [currentTier, setCurrentTier] = useState<'free' | 'pro' | 'premium'>('free');

  const handleUpgrade = () => {
    if (currentTier === 'free') {
      setCurrentTier('pro');
    } else if (currentTier === 'pro') {
      setCurrentTier('premium');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      {/* Tier Switcher - For Demo Purposes */}
      <div 
        className="sticky top-0 z-50 border-b"
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(8px)',
          borderColor: '#E5E7EB',
          padding: '16px 48px',
        }}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', fontFamily: 'Inter' }}>
              Dashboard Tier Preview
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
              Switch between tiers to see how features unlock
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setCurrentTier('free')}
              variant={currentTier === 'free' ? 'default' : 'outline'}
              style={{
                background: currentTier === 'free' ? '#F3F4F6' : 'transparent',
                color: currentTier === 'free' ? '#111827' : '#6B7280',
                borderColor: '#E5E7EB',
              }}
            >
              Free
            </Button>
            <Button
              onClick={() => setCurrentTier('pro')}
              variant={currentTier === 'pro' ? 'default' : 'outline'}
              style={{
                background: currentTier === 'pro' ? '#7D66E6' : 'transparent',
                color: currentTier === 'pro' ? '#FFFFFF' : '#6B7280',
                borderColor: currentTier === 'pro' ? '#7D66E6' : '#E5E7EB',
              }}
            >
              Pro
            </Button>
            <Button
              onClick={() => setCurrentTier('premium')}
              variant={currentTier === 'premium' ? 'default' : 'outline'}
              style={{
                background: currentTier === 'premium' ? '#4F9FA9' : 'transparent',
                color: currentTier === 'premium' ? '#FFFFFF' : '#6B7280',
                borderColor: currentTier === 'premium' ? '#4F9FA9' : '#E5E7EB',
              }}
            >
              Premium
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <DashboardTier tier={currentTier} onUpgrade={handleUpgrade} />

      {/* Info Panel */}
      <div 
        className="fixed bottom-8 right-8 p-6 rounded-2xl border max-w-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderColor: '#E5E7EB',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
          Current Tier: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
        </h3>
        
        {currentTier === 'free' && (
          <div>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              <strong>Unlocked:</strong> Feed Breakdown, Top 5 Topics
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              <strong>Locked:</strong> Ad Transparency, Influencer Analysis, Bias Map
            </p>
            <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>
                💡 Upgrade to Pro to unlock 3 more insights
              </p>
            </div>
          </div>
        )}

        {currentTier === 'pro' && (
          <div>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              <strong>Unlocked:</strong> Feed Breakdown, Topics, Ad Transparency, Influencer Analysis, Sentiment Trend
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              <strong>Locked:</strong> Bias Map
            </p>
            <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>
                💎 Upgrade to Premium for complete algorithmic analysis
              </p>
            </div>
          </div>
        )}

        {currentTier === 'premium' && (
          <div>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              <strong>All Features Unlocked!</strong>
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              8 insights including Bias Map, Engagement by Platform, and Content Tone
            </p>
            <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>
                ✨ You have full access to your algorithmic footprint
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
