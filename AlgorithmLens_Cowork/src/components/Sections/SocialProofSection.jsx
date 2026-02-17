import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SocialProofSection = () => {
  return (
    <section className="py-12 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Trust Badges — verified claims only */}
        <TrustBadgesSection />
        {/* Plus teaser */}
        <PlusTeaser />
      </div>
    </section>
  );
};

// Subtle Plus teaser on landing page — converts awareness into intent
const PlusTeaser = () => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="bg-gradient-to-r from-blue-50/80 to-emerald-50/80 border border-blue-200/40 rounded-2xl px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={16} className="text-primary-blue" />
          <span className="text-sm font-semibold text-text-main">Want to go deeper?</span>
        </div>
        <p className="text-sm text-text-muted mb-3">
          Free scans show the headlines. Plus adds evidence-based analysis, AI-powered Q&A, and trend tracking over time.
        </p>
        <button
          onClick={() => navigate('/plus')}
          className="text-sm font-semibold text-primary-blue hover:text-blue-700 transition-colors"
        >
          Learn about Plus →
        </button>
      </div>
    </motion.div>
  );
};

// Trust Badges Section — only claims we can verify
const TrustBadgesSection = () => {
  const badges = [
    {
      icon: Shield,
      label: "Built by an MIT student",
      delay: 0.1,
    },
    {
      icon: Lock,
      label: "Privacy-first",
      delay: 0.2,
    },
    {
      icon: Eye,
      label: "Videos deleted after processing",
      delay: 0.3,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-wrap justify-center gap-3 sm:gap-4"
    >
      {badges.map((badge, idx) => (
        <BadgePill
          key={idx}
          icon={badge.icon}
          label={badge.label}
          delay={badge.delay}
        />
      ))}
    </motion.div>
  );
};

// Individual Badge Pill
const BadgePill = ({ icon: Icon, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary-blue/5 to-accent-green/5 border border-border-light/50 rounded-full hover:border-primary-blue/30 transition-all duration-300 group"
  >
    <Icon
      size={18}
      className="text-primary-blue group-hover:text-accent-green transition-colors duration-300"
      strokeWidth={2}
    />
    <span className="text-xs sm:text-sm font-medium text-text-main">
      {label}
    </span>
  </motion.div>
);

export default SocialProofSection;
