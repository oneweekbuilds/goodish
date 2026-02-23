import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';

/**
 * TwoWaysSection — explains the relationship between the Chrome extension
 * and the mobile app so users understand why both exist and when to use each.
 */
const TwoWaysSection = () => {
  return (
    <section
      className="py-12 sm:py-24 bg-white overflow-hidden"
      aria-labelledby="two-ways-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <h2
            id="two-ways-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 sm:mb-6"
          >
            Two ways to scan your feed.
          </h2>
          <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-2">
            Use the Chrome extension on desktop or the mobile app on your phone. Same analysis, wherever you browse.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Chrome Extension Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-b from-white to-blue-50/30 border border-border-light rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col"
            role="article"
            aria-label="Chrome extension for desktop scanning"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary-blue/10 flex items-center justify-center mb-5">
              <Monitor size={28} className="text-primary-blue" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-text-main mb-2">Chrome Extension</h3>
            <p className="text-sm sm:text-base text-text-muted mb-4 flex-1">
              Install once, then scan any supported platform directly in your browser. The extension reads your feed as you scroll and captures a snapshot for analysis.
            </p>
            <p className="text-xs text-text-muted mb-4">
              Best for desktop browsing on TikTok, Instagram, YouTube, X, Facebook, LinkedIn, and Reddit.
            </p>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-blue hover:text-blue-700 transition-colors"
            >
              Install Extension <ArrowRight size={14} aria-hidden="true" />
            </a>
          </motion.div>

          {/* Mobile App Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-b from-white to-green-50/30 border border-border-light rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col"
            role="article"
            aria-label="Mobile app for phone scanning"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center mb-5">
              <Smartphone size={28} className="text-accent-green" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-text-main mb-2">Mobile App</h3>
            <p className="text-sm sm:text-base text-text-muted mb-4 flex-1">
              Open any supported platform inside the app and scroll through your feed. The app captures what you see and generates your analysis dashboard on the go.
            </p>
            <p className="text-xs text-text-muted mb-4">
              Available for iOS and Android. Scan your feed anywhere, anytime.
            </p>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent-green hover:text-green-700 transition-colors"
            >
              Download App <ArrowRight size={14} aria-hidden="true" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TwoWaysSection;
