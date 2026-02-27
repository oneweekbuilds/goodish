import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Globe, Megaphone, Scale, MessageSquare, Compass, ArrowRight, Smartphone, Chrome } from 'lucide-react';

/**
 * EmptyDashboard - Encouraging empty state shown when a user has zero scans.
 *
 * Matches the mobile app's pattern: clear CTA, brief explanation, and a preview
 * of what the dashboard will look like once populated.
 */

const TAB_PREVIEWS = [
  { icon: BarChart3, label: 'Overview', color: '#2563EB' },
  { icon: Globe, label: 'Sources', color: '#6366F1' },
  { icon: Megaphone, label: 'Ads', color: '#D97706' },
  { icon: Scale, label: 'Politics', color: '#7C3AED' },
  { icon: MessageSquare, label: 'Tone', color: '#0D9488' },
  { icon: Compass, label: 'Suggested vs. Followed', color: '#E11D48' },
];

const EmptyDashboard = () => {
  return (
    <div className="min-h-[100dvh] bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden"
        >
          {/* Gradient header accent */}
          <div
            className="h-1.5 w-full"
            style={{
              background: 'linear-gradient(90deg, #2563EB 0%, #6366F1 20%, #D97706 40%, #7C3AED 60%, #0D9488 80%, #E11D48 100%)',
            }}
          />

          <div className="p-6 sm:p-8 md:p-10">
            {/* Icon */}
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BarChart3 size={32} className="text-primary-blue" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-text-main text-center mb-3">
              Your dashboard is ready
            </h1>

            {/* Subtitle */}
            <p className="text-text-muted text-center max-w-md mx-auto mb-8 leading-relaxed">
              Install the Chrome extension or use the mobile app to scan your first feed. Your results will appear here.
            </p>

            {/* CTA */}
            <div className="flex justify-center mb-8">
              <Link
                to="/start"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary-blue text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl group"
              >
                Start Your First Scan
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* How it works - matching mobile app's 3-step pattern */}
            <div className="bg-slate-50 rounded-xl p-5 mb-8">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
                How it works
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { step: '1', icon: Globe, label: 'Open a platform', sublabel: 'TikTok, Instagram, etc.' },
                  { step: '2', icon: Chrome, label: 'Start a scan', sublabel: 'Scroll for a few minutes' },
                  { step: '3', icon: BarChart3, label: 'See your results', sublabel: 'Insights appear here' },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                      <item.icon size={18} className="text-primary-blue" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mb-0.5">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.sublabel}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab preview: what you'll unlock */}
            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
                What you'll see
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {TAB_PREVIEWS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <div
                      key={tab.label}
                      className="flex flex-col items-center gap-1.5 py-2"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${tab.color}10` }}
                      >
                        <Icon size={16} style={{ color: tab.color }} />
                      </div>
                      <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">
                        {tab.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Secondary card: ways to scan */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
          className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Chrome size={16} className="text-primary-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Chrome Extension</p>
                <p className="text-xs text-slate-500">Scan while you scroll on desktop</p>
              </div>
            </div>
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Mobile App</p>
                <p className="text-xs text-slate-500">Scan feeds on your phone</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmptyDashboard;
