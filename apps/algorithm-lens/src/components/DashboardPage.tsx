import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import {
  DashboardTabs,
  DashboardTabId,
  PatternsTab,
  PoliticsTab,
  CreatorsTab,
  AdsTab,
  AlgorithmTab,
} from './dashboard';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
}

export function DashboardPage({ onNavigate, currentPlan, onUpgrade }: DashboardPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState<DashboardTabId>('patterns');
  const isPremium = currentPlan === 'premium';

  const handleTabChange = (tab: DashboardTabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'patterns':
        return (
          <PatternsTab
            currentPlan={currentPlan}
            onUpgrade={onUpgrade}
            onNavigate={onNavigate}
          />
        );
      case 'politics':
        return (
          <PoliticsTab
            currentPlan={currentPlan}
            onUpgrade={onUpgrade}
          />
        );
      case 'creators':
        return (
          <CreatorsTab
            currentPlan={currentPlan}
            onUpgrade={onUpgrade}
          />
        );
      case 'ads':
        return (
          <AdsTab
            currentPlan={currentPlan}
            onUpgrade={onUpgrade}
            onNavigate={onNavigate}
          />
        );
      case 'algorithm':
        return (
          <AlgorithmTab
            currentPlan={currentPlan}
            onUpgrade={onUpgrade}
            onNavigate={onNavigate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '80px', paddingBottom: '64px' }}>
      {/* Header Ribbon */}
      {!isPremium ? (
        <div
          className="w-full border-b"
          style={{
            height: '36px',
            background: 'var(--muted)',
            borderColor: 'rgba(125, 102, 230, 0.15)',
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-full flex items-center justify-center gap-3">
            <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
              Upgrade to Premium for full insights and multi-platform tracking.
            </span>
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              Upgrade Now <ArrowRight size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="w-full border-b"
          style={{
            height: '36px',
            background: 'var(--background)',
            borderColor: 'rgba(79, 159, 169, 0.15)',
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-full flex items-center justify-center">
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F9FA9' }}>
              Premium Dashboard Active
            </span>
          </div>
        </div>
      )}

      <div className="px-6 md:px-8" style={{ paddingTop: '40px' }}>
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1
              className="mb-3 tracking-tight"
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 800,
                lineHeight: '1.1',
                fontFamily: 'var(--font-headline)',
              }}
            >
              Your Algorithmic Reality
            </h1>
            <p className="text-lg" style={{ color: 'var(--foreground-secondary)' }}>
              Hi Justin, here's a clear look at what shapes your digital world.
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <DashboardTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              currentPlan={currentPlan}
              className="rounded-xl overflow-hidden"
            />
          </motion.div>

          {/* Active Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pb-12"
          >
            {renderActiveTab()}
          </motion.div>

          {/* Footer Upgrade Banner (Free tier only) */}
          {!isPremium && (
            <motion.div
              className="p-6 rounded-2xl border-2 mt-8 mb-12"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--border)',
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Sparkles size={20} style={{ color: 'white' }} />
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--foreground)' }}>
                    Want to explore deeper insights and multi-platform trends?
                  </p>
                </div>
                <Button
                  onClick={onUpgrade}
                  className="flex-shrink-0 rounded-lg"
                  style={{
                    background: 'var(--primary)',
                    borderRadius: '8px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    height: '44px',
                    color: 'white',
                  }}
                >
                  Upgrade to Premium
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
