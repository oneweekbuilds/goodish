import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, BarChart3, Eye, Tag, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_CONFIGS } from '../../lib/scanApi';

export default function ProcessingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [platform, setPlatform] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const steps = [
    { icon: Eye, text: 'Extracting feed content...' },
    { icon: Tag, text: 'Detecting ads and sponsored posts...' },
    { icon: BarChart3, text: 'Analyzing topics and patterns...' },
    { icon: ShieldCheck, text: 'Generating insights...' },
  ];

  useEffect(() => {
    // Get platform from session storage
    const storedPlatform = sessionStorage.getItem('pendingScanPlatform');
    setPlatform(storedPlatform);

    // Check if we have pending scan results
    const pendingResult = sessionStorage.getItem('pendingScanResult');
    
    if (pendingResult) {
      // We have results - show animation then redirect
      const result = JSON.parse(pendingResult);
      const scanId = result.scan_metadata?.scan_id;
      
      // Animate through steps
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 800);

      // After animation, redirect to results
      const redirectTimeout = setTimeout(() => {
        clearInterval(stepInterval);
        // Clear session storage
        sessionStorage.removeItem('pendingScanResult');
        sessionStorage.removeItem('pendingScanPlatform');
        
        if (scanId) {
          navigate(`/scan/results/${scanId}`);
        } else {
          // Fallback: store result for results page
          sessionStorage.setItem('directScanResult', pendingResult);
          navigate('/scan/results/latest');
        }
      }, steps.length * 800 + 500);

      return () => {
        clearInterval(stepInterval);
        clearTimeout(redirectTimeout);
      };
    } else {
      // No pending results - show timeout message after a delay
      const timeout = setTimeout(() => {
        setTimedOut(true);
      }, 5000);

      // Redirect after showing timeout message
      const redirectTimeout = setTimeout(() => {
        navigate('/start');
      }, 8000);

      return () => {
        clearTimeout(timeout);
        clearTimeout(redirectTimeout);
      };
    }
  }, [navigate, steps.length]);

  const config = platform ? PLATFORM_CONFIGS[platform] : null;

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: '#fdfaf4' }}
    >
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-12 text-center"
        >
          {/* Platform badge */}
          {config && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{
                backgroundColor: config.bgColor,
                color: config.color,
              }}
            >
              <span className="text-sm font-semibold">{config.name}</span>
            </motion.div>
          )}

          {/* Animated spinner */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-slate-100"
              style={{ borderTopColor: '#2563EB' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                size={36}
                className="text-blue-600 animate-pulse"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {timedOut ? 'No Scan Data Found' : 'Analyzing Your Feed'}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 mb-10 max-w-sm mx-auto">
            {timedOut 
              ? 'Redirecting you back to start a new scan...'
              : 'We\'re detecting ads, topics, patterns, and content categories in your feed.'
            }
          </p>

          {/* Progress Steps */}
          {!timedOut && (
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: isComplete || isActive ? 1 : 0.4,
                      x: 0,
                    }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-50 border border-blue-200'
                        : isComplete
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-600'
                          : isComplete
                          ? 'bg-green-100 text-green-600'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isComplete ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        isActive
                          ? 'text-blue-700'
                          : isComplete
                          ? 'text-green-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Privacy note */}
          <p className="text-xs text-slate-400 mt-8">
            🔒 Your data is processed securely and never shared.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
