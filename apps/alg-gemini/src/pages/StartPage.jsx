import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';
import OnboardingModal from '../components/OnboardingModal';

// Platform configuration
const PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '📱',
    description: 'Analyze your For You page',
    color: 'bg-slate-900',
    hoverBorder: 'hover:border-slate-900',
    available: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    description: 'Analyze your Reels & Feed',
    color: 'bg-pink-600',
    hoverBorder: 'hover:border-pink-600',
    available: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    description: 'Analyze your Shorts & Home',
    color: 'bg-red-600',
    hoverBorder: 'hover:border-red-600',
    available: true,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    icon: '𝕏',
    description: 'Analyze your timeline',
    color: 'bg-slate-900',
    hoverBorder: 'hover:border-slate-900',
    available: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👤',
    description: 'Analyze your News Feed',
    color: 'bg-blue-600',
    hoverBorder: 'hover:border-blue-600',
    available: false,
  },
];

const StartPage = () => {
  const { hasCompletedOnboarding } = useUserProfile();
  const [showRetentionTip, setShowRetentionTip] = React.useState(false);

  // Check if retention tip should be shown
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem('algGeminiRetentionTipDismissed');
    if (dismissed !== 'true') {
      setShowRetentionTip(true);
    }
  }, []);

  const handleDismissRetentionTip = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('algGeminiRetentionTipDismissed', 'true');
      setShowRetentionTip(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page py-24 px-6">
      {/* Onboarding Modal */}
      {!hasCompletedOnboarding && <OnboardingModal />}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-4">
            Choose Your Platform
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Select the social media platform you want to analyze. We'll help you understand
            what the algorithm shows you.
          </p>
        </div>

        {/* Retention Tip Banner */}
        {showRetentionTip && (
          <div className="mb-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-1">
                  Tip: Scanning regularly helps you see patterns.
                </p>
                <p className="text-sm text-blue-700">
                  Run 3 scans this week to start building a timeline of how your feed evolves.
                </p>
              </div>
              <button
                onClick={handleDismissRetentionTip}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORMS.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted">
            Your data stays private. Videos are processed locally and deleted immediately after analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

const PlatformCard = ({ platform }) => {
  const cardContent = (
    <div
      className={`
        relative bg-white rounded-xl shadow-md border-2 border-slate-100 
        p-6 flex flex-col items-center text-center 
        transition-all duration-300
        ${platform.available 
          ? `cursor-pointer hover:shadow-lg hover:-translate-y-1 ${platform.hoverBorder}` 
          : 'opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Coming Soon Badge */}
      {!platform.available && (
        <div className="absolute top-3 right-3">
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
            Coming soon
          </span>
        </div>
      )}

      {/* Platform Icon */}
      <div className={`w-16 h-16 rounded-2xl ${platform.color} flex items-center justify-center mb-4`}>
        <span className="text-3xl filter drop-shadow-sm">{platform.icon}</span>
      </div>

      {/* Platform Name */}
      <h3 className="text-xl font-bold text-text-main mb-2">
        {platform.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-muted mb-4">
        {platform.description}
      </p>

      {/* Action Indicator */}
      {platform.available && (
        <div className="flex items-center gap-1 text-primary-blue font-semibold text-sm">
          <span>Get Started</span>
          <ArrowRight size={16} />
        </div>
      )}
    </div>
  );

  if (platform.available) {
    return (
      <Link to={`/scan/platform/${platform.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default StartPage;



