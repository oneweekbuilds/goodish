import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Music, Camera, Play, Users, Briefcase, MessageCircle } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';
import OnboardingModal from '../components/OnboardingModal';
import BackLink from '../components/ui/BackLink';
import SEO from '../components/SEO';

// SVG icon component for X logo
const XIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694L2.306 21.75H-1v-3.308l7.227-8.26L-1.424 2.25h6.514l5.106 6.694 6.128-6.694zM17.04 19.332h1.81L5.969 4.09H4.126l12.914 15.242z" />
  </svg>
);

// Platform configuration
const PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    description: 'Analyze your For You page',
    color: 'bg-slate-900',
    hoverBorder: 'hover:border-slate-900',
    available: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Camera,
    description: 'Analyze your Reels & Feed',
    color: 'bg-pink-600',
    hoverBorder: 'hover:border-pink-600',
    available: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Play,
    description: 'Analyze your Shorts & Home',
    color: 'bg-red-600',
    hoverBorder: 'hover:border-red-600',
    available: true,
  },
  {
    id: 'x',
    name: 'X',
    icon: XIcon,
    description: 'Analyze your timeline',
    color: 'bg-slate-900',
    hoverBorder: 'hover:border-slate-900',
    available: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Users,
    description: 'Analyze your News Feed',
    color: 'bg-blue-600',
    hoverBorder: 'hover:border-blue-600',
    available: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Briefcase,
    description: 'Analyze your LinkedIn feed',
    color: 'bg-blue-700',
    hoverBorder: 'hover:border-blue-700',
    available: true,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: MessageCircle,
    description: 'Analyze your Reddit feed',
    color: 'bg-orange-600',
    hoverBorder: 'hover:border-orange-600',
    available: true,
  },
  {
    id: 'other',
    name: 'More Coming Soon',
    icon: null,
    description: 'Additional platforms in development',
    color: 'bg-gray-400',
    hoverBorder: 'hover:border-gray-400',
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
    <>
      <SEO title="Choose Your Platform" description="Select a social media platform to analyze. See what TikTok, Instagram, YouTube, and more show you." path="/start" />
      <div className="min-h-screen bg-bg-page py-12 sm:py-24 px-4 sm:px-6">
        {/* Onboarding Modal */}
        {!hasCompletedOnboarding && <OnboardingModal />}

      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <BackLink to="/" label="Back to home" />

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
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
          <div className="mb-8 bg-primary-blue/5 rounded-lg p-3 sm:p-4 border border-primary-blue/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm sm:text-base text-text-main mb-1">
                  Tip: Scanning regularly helps you see patterns.
                </p>
                <p className="text-xs sm:text-sm text-primary-blue">
                  Run 3 scans this week to start building a timeline of how your feed evolves.
                </p>
              </div>
              <button
                onClick={handleDismissRetentionTip}
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm font-medium text-primary-blue hover:bg-primary-blue/10 rounded-lg transition-colors whitespace-nowrap"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
    </>
  );
};

const PlatformCard = ({ platform }) => {
  const cardContent = (
    <div
      className={`
        relative bg-white rounded-xl shadow-sm border-2 border-border-light
        p-4 sm:p-6 flex flex-col items-center text-center
        transition-all duration-300
        ${platform.available
          ? `cursor-pointer hover:shadow-md hover:-translate-y-1 ${platform.hoverBorder}`
          : 'opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Coming Soon Badge */}
      {!platform.available && (
        <div className="absolute top-3 right-3">
          <span className="text-xs font-semibold px-2 py-1 bg-primary-blue/5 text-text-muted rounded-full">
            Coming soon
          </span>
        </div>
      )}

      {/* Platform Icon */}
      <div className={`w-16 h-16 rounded-2xl ${platform.color} flex items-center justify-center mb-4`}>
        {platform.icon ? (
          React.createElement(platform.icon, {
            className: 'w-8 h-8 text-white',
          })
        ) : (
          <span className="text-2xl text-white">+</span>
        )}
      </div>

      {/* Platform Name */}
      <h3 className="text-lg sm:text-xl font-bold text-text-main mb-2">
        {platform.name}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-text-muted mb-4">
        {platform.description}
      </p>

      {/* Action Indicator */}
      {platform.available && (
        <span className="px-3 py-1.5 rounded-full bg-primary-blue/5 text-primary-blue text-sm font-semibold inline-flex items-center gap-1">
          <span>Get Started</span>
          <ArrowRight size={16} />
        </span>
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
