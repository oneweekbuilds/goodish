import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Circle, AlertCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import { track, EVENTS } from '../lib/analytics';
import { authenticatedFetch, isUnauthorized } from '../lib/api/authenticatedFetch';
import { getApiBaseUrl } from '../lib/apiConfig';
import SignInPrompt from '../components/auth/SignInPrompt';
import SEO from '../components/SEO';
import { logError } from '../lib/errorLogger.js';

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

/**
 * Overall timeout for the entire processing flow.
 * After this, the user sees a timeout message with retry/cancel options.
 * 2 minutes is generous for most scans; large feeds may take longer.
 */
const PROCESSING_TIMEOUT_MS = 120000;

/**
 * Polling interval for scan status checks.
 * Each individual poll uses maxAttempts: 1 (no per-poll retries) since
 * the polling loop itself provides retry behavior.
 */
const POLL_INTERVAL_MS = 2000;

/**
 * Number of consecutive poll failures before showing an error.
 * At 2s intervals, 5 failures = ~10 seconds of unresponsive API.
 */
const MAX_CONSECUTIVE_FAILURES = 5;

const ProcessingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scanId = searchParams.get('scanId');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [isDesktopScan, setIsDesktopScan] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs for cleanup
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const consecutiveFailuresRef = useRef(0);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  // Determine if this is a desktop scan by fetching scan data
  // Uses default retry (3 attempts) since this is a one-time check
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
          if (isMountedRef.current) {
            setIsDesktopScan(sourceType === 'DESKTOP_EXTENSION');
          }
        }
      } catch (err) {
        logError('ProcessingPage', 'Error checking scan source:', err);
        // Default to mobile if we can't determine
      }
    };

    checkScanSource();
  }, [scanId]);

  // Animate through processing steps
  // (#20) Simulated Progress UI: These processing steps are visual indicators
  // with fixed durations. The real progress comes from backend polling (see below).
  // The UI animates through steps every 3 seconds to show activity, but actual
  // step transitions should be driven by backend status when available.
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

  // Track elapsed time for the user-facing timer
  useEffect(() => {
    elapsedTimerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  // Overall processing timeout
  // After PROCESSING_TIMEOUT_MS, show a timeout message with retry/cancel options
  useEffect(() => {
    if (!scanId) return;

    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && !error) {
        setIsTimedOut(true);
        logError('ProcessingPage', 'Processing timed out', { scanId, pollCount, elapsedSeconds });
        // Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    }, PROCESSING_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [scanId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle retry: reset all state and restart polling
  const handleRetry = useCallback(() => {
    setError(null);
    setIsTimedOut(false);
    setCurrentStepIndex(0);
    setPollCount(0);
    setElapsedSeconds(0);
    consecutiveFailuresRef.current = 0;

    // Clear existing timers
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Restart the timeout
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsTimedOut(true);
        logError('ProcessingPage', 'Processing timed out on retry', { scanId });
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    }, PROCESSING_TIMEOUT_MS);

    // Force a re-render that triggers the polling effect
    // by setting a unique pollCount seed
    setPollCount(-1);
  }, [scanId]);

  // Poll backend for real scan status
  // (#20) Real Progress Polling: When scanId is available, the component polls
  // the backend for authoritative status. This is prioritized over simulated timers.
  // Once status='completed', the component navigates to results.
  //
  // Each individual poll uses maxAttempts: 1 because the polling loop itself
  // provides retry behavior. Adding per-poll retries would cause cascading delays.
  useEffect(() => {
    if (!scanId) {
      // If no scanId, simulate processing and redirect
      // This is for fallback/demo scenarios where backend doesn't return scanId
      const timer = setTimeout(() => {
        navigate('/scan/results/latest');
      }, 12000);
      return () => clearTimeout(timer);
    }

    const pollStatus = async () => {
      if (!isMountedRef.current || isTimedOut) return;

      const apiBase = getApiBaseUrl();
      try {
        // Use lightweight status endpoint for efficient polling.
        // maxAttempts: 1 — no per-poll retries; the polling loop retries naturally.
        const response = await authenticatedFetch(
          `${apiBase}/api/scans/${scanId}/status`,
          {},
          { maxAttempts: 1, context: 'ProcessingPage:poll' }
        );

        // Reset consecutive failure counter on any response
        consecutiveFailuresRef.current = 0;

        if (!response.ok) {
          if (response.status === 404) {
            // Scan not found yet, keep polling
            if (isMountedRef.current) setPollCount((prev) => prev + 1);
            return;
          }
          if (isUnauthorized(response)) {
            // 401 Unauthorized - show sign-in prompt
            if (isMountedRef.current) setShowSignInPrompt(true);
            return;
          }
          throw new Error(`Failed to fetch scan status: ${response.status}`);
        }

        const data = await response.json();

        // Check if scan is complete (status field is authoritative)
        if (data.status === 'completed') {

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
          if (isMountedRef.current) {
            setError(data.error_message || 'Scan processing failed. Please try again.');
          }
          return;
        }

        // Still processing, continue polling
        if (isMountedRef.current) setPollCount((prev) => prev + 1);
      } catch (err) {
        logError('ProcessingPage', 'Error polling scan status:', err);

        // Track consecutive failures
        consecutiveFailuresRef.current += 1;

        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES && isMountedRef.current) {
          setError(
            'Unable to reach the server. This may be due to a slow connection or high server load. ' +
            'You can try again or check your scan history later.'
          );
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    };

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);

    // Initial poll
    pollStatus();

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [scanId, navigate, isTimedOut]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format elapsed time for display
  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Show sign-in prompt if 401 error
  if (showSignInPrompt) {
    return (
      <>
        <SEO title="Processing Scan" noIndex={true} />
        <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16">
          <SignInPrompt
          title="Please sign in to continue"
          body="Sign in to view the status of your scan. Your scans are saved to your account."
          source="processing_401"
          onBack={() => navigate('/start')}
          backLabel="Back to platforms"
        />
        </div>
      </>
    );
  }

  // Timeout state — friendly message with retry and cancel options
  if (isTimedOut) {
    return (
      <>
        <SEO title="Processing Scan" noIndex={true} />
        <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-border-light p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-text-main mb-2">Taking Longer Than Expected</h1>
            <p className="text-text-muted mb-6">
              Analysis is taking longer than expected. This can happen with large feeds or during high server load.
              You can wait and try again, or return to the dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border-light text-text-main rounded-xl font-semibold hover:bg-primary-blue/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
              >
                <ArrowLeft size={18} />
                Dashboard
              </button>
            </div>
            {scanId && (
              <p className="text-xs text-text-muted/60 mt-4">
                Your scan may still be processing. Check your scan history later to see if it completed.
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Error state — with retry and cancel options
  if (error) {
    return (
      <>
        <SEO title="Processing Scan" noIndex={true} />
        <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-border-light p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-2">Processing Error</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 border border-border-light text-text-main rounded-xl font-semibold hover:bg-primary-blue/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2"
            >
              <ArrowLeft size={18} />
              Dashboard
            </button>
          </div>
        </div>
        </div>
      </>
    );
  }

  const steps = isDesktopScan ? PROCESSING_STEPS_DESKTOP : PROCESSING_STEPS_MOBILE;
  const progressPercent = Math.min(((currentStepIndex + 1) / steps.length) * 100, 95);

  return (
    <>
      <SEO title="Processing Scan" noIndex={true} />
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
          {/* Animated Spinner */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            {/* Track ring */}
            <div className="absolute inset-0 border-4 border-border-light rounded-full" />
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-primary-blue rounded-full animate-spin" />
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary-blue/40" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Analyzing Your Feed
          </h1>
          <p className="text-text-muted mb-8" aria-live="polite">
            {isDesktopScan
              ? "Processing your desktop scan\u2026"
              : "Processing your recording\u2026"}
          </p>

          {/* Processing Steps */}
          <div className="space-y-4 text-left mb-8">
            {steps.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    isComplete ? 'text-status-success' :
                    isCurrent ? 'text-primary-blue' :
                    'text-text-muted/50'
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
                    <span className="text-xs text-status-success ml-auto">Done</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress indicator */}
          <div
            className="h-2 bg-border-light rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Scan progress"
          >
            <div
              className="h-full bg-primary-blue rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Elapsed time indicator */}
          <p className="text-xs text-text-muted/60 mt-3">
            {formatElapsed(elapsedSeconds)} elapsed
          </p>
        </div>

        {/* Cancel link */}
        <Link to="/dashboard" className="block text-center text-sm text-text-muted hover:text-primary-blue transition-colors mt-6 py-2">
          Cancel and return to dashboard
        </Link>

        {/* Privacy note - only show for mobile scans */}
        {!isDesktopScan && (
          <p className="text-center text-sm text-text-muted mt-6">
            Your video is being processed securely and will be deleted after analysis.
          </p>
        )}
      </div>
      </div>
    </>
  );
};

export default ProcessingPage;
