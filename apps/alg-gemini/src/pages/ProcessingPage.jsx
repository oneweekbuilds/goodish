import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, Circle } from 'lucide-react';
import { track, EVENTS } from '../lib/analytics';
import { authenticatedFetch, isUnauthorized } from '../lib/api/authenticatedFetch';
import { getApiBaseUrl } from '../lib/apiConfig';
import SignInPrompt from '../components/auth/SignInPrompt';

// Processing steps for mobile (video-based) scans
const PROCESSING_STEPS_MOBILE = [
  { id: 'extracting', label: 'Extracting frames', duration: 3000 },
  { id: 'detecting', label: 'Detecting ads', duration: 4000 },
  { id: 'analyzing', label: 'Analyzing topics', duration: 5000 },
  { id: 'generating', label: 'Generating insights', duration: 3000 },
];

// Processing steps for desktop (extension-based) scans
const PROCESSING_STEPS_DESKTOP = [
  { id: 'collecting', label: 'Collecting posts', duration: 3000 },
  { id: 'analyzing', label: 'Analyzing content', duration: 4000 },
  { id: 'classifying', label: 'Classifying ads', duration: 5000 },
  { id: 'generating', label: 'Generating insights', duration: 3000 },
];

const ProcessingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scanId = searchParams.get('scanId');
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [isDesktopScan, setIsDesktopScan] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  // Determine if this is a desktop scan by fetching scan data
  useEffect(() => {
    if (!scanId) return;

    const checkScanSource = async () => {
      const apiBase = getApiBaseUrl();
      try {
        const response = await authenticatedFetch(`${apiBase}/api/scans/${scanId}`);
        if (response.ok) {
          const data = await response.json();
          const scanData = data.result || data.scan || data;
          const sourceType = scanData?.scan_metadata?.source_type || data?.source_type;
          setIsDesktopScan(sourceType === 'DESKTOP_EXTENSION');
        }
      } catch (err) {
        console.error('Error checking scan source:', err);
        // Default to mobile if we can't determine
      }
    };

    checkScanSource();
  }, [scanId]);

  // Animate through processing steps
  useEffect(() => {
    const steps = isDesktopScan ? PROCESSING_STEPS_DESKTOP : PROCESSING_STEPS_MOBILE;
    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(stepTimer);
  }, [isDesktopScan]);

  // Poll backend for scan status
  useEffect(() => {
    if (!scanId) {
      // If no scanId, simulate processing and redirect
      const timer = setTimeout(() => {
        navigate('/scan/results/latest');
      }, 12000);
      return () => clearTimeout(timer);
    }

    const pollStatus = async () => {
      const apiBase = getApiBaseUrl();
      try {
        // Use lightweight status endpoint for efficient polling
        const response = await authenticatedFetch(`${apiBase}/api/scans/${scanId}/status`);

        if (!response.ok) {
          if (response.status === 404) {
            // Scan not found yet, keep polling
            setPollCount((prev) => prev + 1);
            return;
          }
          if (isUnauthorized(response)) {
            // 401 Unauthorized - show sign-in prompt
            setShowSignInPrompt(true);
            return;
          }
          throw new Error(`Failed to fetch scan status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[ProcessingPage] Poll response:', data);

        // Check if scan is complete (status field is authoritative)
        if (data.status === 'completed') {
          console.log('[ProcessingPage] Scan completed, navigating to results');

          // Track scan completion
          track(EVENTS.SCAN_COMPLETE, {
            scanId,
            pollCount,
          });

          navigate(`/scan/results/${scanId}`);
          return;
        }

        // Check for error status
        if (data.status === 'error' || data.status === 'failed') {
          setError(data.error_message || 'Scan processing failed');
          return;
        }

        // Still processing, continue polling
        setPollCount((prev) => prev + 1);
      } catch (err) {
        console.error('Error polling scan status:', err);
        // Don't set error immediately, just log and continue
        if (pollCount > 60) {
          // After 120 seconds (60 polls * 2s), show error
          setError('Scan is taking longer than expected. Please try again.');
        }
      }
    };

    // Poll every 2 seconds
    const pollInterval = setInterval(pollStatus, 2000);
    
    // Initial poll
    pollStatus();

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [scanId, navigate, pollCount]);

  // Show sign-in prompt if 401 error
  if (showSignInPrompt) {
    return (
      <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16">
        <SignInPrompt
          title="Please sign in to continue"
          body="Sign in to view the status of your scan. Your scans are saved to your account."
          source="processing_401"
          onBack={() => navigate('/start')}
          backLabel="Back to platforms"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-2">Processing Error</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <button
            onClick={() => navigate('/start')}
            className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
          {/* Animated Spinner */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
            
            {/* Animated ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-primary-blue rounded-full animate-spin" />
            
            {/* Inner icon */}
            <div className="absolute inset-3 bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 size={32} className="text-primary-blue animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Analyzing Your Feed
          </h1>
          <p className="text-text-muted mb-8">
            {isDesktopScan 
              ? "Processing your desktop scan…"
              : "Processing your recording…"}
          </p>

          {/* Processing Steps */}
          <div className="space-y-4 text-left mb-8">
            {(isDesktopScan ? PROCESSING_STEPS_DESKTOP : PROCESSING_STEPS_MOBILE).map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    isComplete ? 'text-green-600' :
                    isCurrent ? 'text-primary-blue' :
                    'text-slate-400'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle size={20} className="flex-shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-5 h-5 flex-shrink-0">
                      <div className="w-full h-full border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <Circle size={20} className="flex-shrink-0" />
                  )}
                  <span className={`font-medium ${isCurrent ? 'text-text-main' : ''}`}>
                    {step.label}
                  </span>
                  {isComplete && (
                    <span className="text-xs text-green-500 ml-auto">Done</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress indicator */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-blue rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(((currentStepIndex + 1) / (isDesktopScan ? PROCESSING_STEPS_DESKTOP : PROCESSING_STEPS_MOBILE).length) * 100, 95)}%` }}
            />
          </div>

          {/* Scan ID info */}
          {scanId && (
            <p className="text-xs text-slate-400 mt-4">
              Scan ID: {scanId}
            </p>
          )}
        </div>

        {/* Privacy note - only show for mobile scans */}
        {!isDesktopScan && (
          <p className="text-center text-sm text-text-muted mt-6">
            Your video is being processed securely and will be deleted after analysis.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProcessingPage;


