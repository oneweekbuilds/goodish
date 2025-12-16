import { motion } from 'motion/react';
import { ArrowRight, Eye, BarChart3, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PLATFORM_CONFIGS, SUPPORTED_PLATFORMS } from '../lib/scanApi';
import { PlatformIcon } from '../components/PlatformBadge';

export default function StartPage() {
  const navigate = useNavigate();

  const handlePlatformSelect = (platformId: string) => {
    navigate(`/scan/platform/${platformId}`);
  };

  const allPlatforms = [...SUPPORTED_PLATFORMS, 'facebook'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfaf4' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-0 left-0 right-0 h-full opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, #2563EB 0%, transparent 50%),
                               radial-gradient(circle at 80% 70%, #10B981 0%, transparent 50%)`
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-5 py-2 text-sm font-medium text-blue-700">
              <Eye size={16} />
              Start Your Analysis
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              See the feed<br />
              <span className="text-blue-600">
                the algorithm sees.
              </span>
            </h1>
          </motion.div>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto text-center mb-16 leading-relaxed"
          >
            Choose a platform to begin analyzing your feed.
          </motion.p>

          {/* Platform Selection Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {allPlatforms.map((platformId, index) => {
              const config = PLATFORM_CONFIGS[platformId];
              const isDisabled = config?.disabled;

              return (
                <motion.div
                  key={platformId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
                >
                  <Card
                    className={`relative overflow-hidden transition-all duration-300 bg-white ${
                      isDisabled
                        ? 'cursor-not-allowed grayscale'
                        : 'cursor-pointer hover:shadow-lg hover:-translate-y-1 shadow-md group'
                    }`}
                    style={{
                      borderRadius: '20px',
                      padding: '24px 16px',
                      border: `2px solid ${isDisabled ? '#D1D5DB' : 'transparent'}`,
                      opacity: isDisabled ? 0.6 : 1,
                    }}
                    onClick={() => !isDisabled && handlePlatformSelect(platformId)}
                    onMouseEnter={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.borderColor = config?.color || '#2563EB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDisabled ? '#D1D5DB' : 'transparent';
                    }}
                  >
                    {/* Disabled overlay with prominent badge */}
                    {isDisabled && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <div className="absolute top-3 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full shadow-sm">
                            🚧 Coming Soon
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDisabled ? 'mt-6' : ''}`}
                      style={{
                        backgroundColor: isDisabled ? '#F3F4F6' : (config?.bgColor || '#F3F4F6'),
                        color: isDisabled ? '#9CA3AF' : (config?.color || '#374151'),
                      }}
                    >
                      <PlatformIcon platform={platformId} className="w-8 h-8" />
                    </div>

                    {/* Name */}
                    <h3 className={`text-center font-semibold mb-2 ${isDisabled ? 'text-slate-400' : 'text-slate-900'}`}>
                      {config?.name || platformId}
                    </h3>

                    {/* Arrow indicator - only for enabled platforms */}
                    {!isDisabled && (
                      <div className="flex justify-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
                          style={{ backgroundColor: config?.bgColor || '#F3F4F6' }}
                        >
                          <ArrowRight size={16} style={{ color: config?.color }} />
                        </div>
                      </div>
                    )}

                    {/* Disabled message at bottom */}
                    {isDisabled && (
                      <p className="text-center text-xs text-slate-400 mt-2">
                        Not available yet
                      </p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Privacy note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-slate-500 mt-12"
          >
            🔒 Your data stays private. We analyze locally and never store your personal information.
          </motion.p>
        </div>
      </section>

      {/* How It Works Mini Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 text-slate-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Choose Platform',
                description: 'Select which social media platform you want to analyze',
                icon: Eye,
                color: '#2563EB',
                bgColor: '#EFF6FF',
              },
              {
                step: '2',
                title: 'Scan Your Feed',
                description: 'Use our Chrome extension or upload a mobile recording',
                icon: BarChart3,
                color: '#10B981',
                bgColor: '#ECFDF5',
              },
              {
                step: '3',
                title: 'Get Insights',
                description: 'See detailed analysis of your feed patterns and ads',
                icon: Shield,
                color: '#2563EB',
                bgColor: '#EFF6FF',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div 
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: item.bgColor, color: item.color }}
                >
                  <item.icon size={24} />
                </div>
                <div 
                  className="w-8 h-8 mx-auto -mt-10 mb-6 rounded-full bg-white border-2 flex items-center justify-center font-bold text-sm shadow-sm"
                  style={{ borderColor: item.color, color: item.color }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
