import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, Circle, AlertTriangle, RefreshCw } from 'lucide-react';

// Processing timeout constants
const POLL_INTERVAL_MS = 2000;      // Poll every 2 seconds
const MAX_PROCESSING_TIME_MS = 180000; // 3 minutes max before showing "still working" state
const HARD_TIMEOUT_MS = 300000;     // 5 minutes hard timeout

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
  const [isDesktopScan, setIsDesktopScan] = useState(false);
  const [isSlowProcessing, setIsSlowProcessing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastPollError, setLastPollError] = useState(null);

  // Use refs to track timing without causing re-renders
  const startTimeRef = useRef(Date.now());
  const pollIntervalRef = useRef(null);
  const isNavigatingRef = useRef(false);

  // Determine if this is a desktop scan by fetching scan data
  useEffect(() => {
    if (!scanId) return;

    const checkScanSource = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/scans/${scanId}`);
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

  // Track elapsed time for UI display
  useEffect(() => {
    const elapsedTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);

      // Check for slow processing (soft timeout)
      if (elapsed * 1000 >= MAX_PROCESSING_TIME_MS && !isSlowProcessing) {
        setIsSlowProcessing(true);
      }

      // Check for hard timeout
      if (elapsed * 1000 >= HARD_TIMEOUT_MS) {
        setError('Processing is taking longer than expected. The server may be busy. Please try again.');
      }
    }, 1000);

    return () => clearInterval(elapsedTimer);
  }, [isSlowProcessing]);

  // Poll function - stable reference using useCallback
  const pollStatus = useCallback(async () => {
    // Don't poll if we're already navigating or have an error
    if (isNavigatingRef.current || error) return;

    try {
      // Use lightweight status endpoint for efficient polling
      const response = await fetch(`http://127.0.0.1:8000/api/scans/${scanId}/status`);

      if (!response.ok) {
        if (response.status === 404) {
          // Scan not found yet, keep polling
          console.log('[ProcessingPage] Scan not found yet, continuing to poll');
          setLastPollError(null);
          return;
        }
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('[ProcessingPage] Poll response:', data);
      setLastPollError(null);

      // Check if scan is complete (status field is authoritative)
      if (data.status === 'completed') {
        console.log('[ProcessingPage] Scan completed, navigating to results');
        isNavigatingRef.current = true;
        navigate(`/scan/results/${scanId}`);
        return;
      }

      // Check for error status
      if (data.status === 'error' || data.status === 'failed') {
        const errorMsg = data.error_message || 'Scan processing failed. Please try again.';
        setError(errorMsg);
        return;
      }

      // Still processing, continue polling (no state change needed)
    } catch (err) {
      console.error('[ProcessingPage] Error polling scan status:', err);
      setLastPollError(err.message);
      // Don't set fatal error - just track the poll error
      // The time-based timeout will handle prolonged failures
    }
  }, [scanId, navigate, error]);

  // Poll backend for scan status
  useEffect(() => {
    if (!scanId) {
      // If no scanId, simulate processing and redirect
      const timer = setTimeout(() => {
        navigate('/scan/results/latest');
      }, 12000);
      return () => clearTimeout(timer);
    }

    // Reset start time when effect runs
    startTimeRef.current = Date.now();
    isNavigatingRef.current = false;

    // Initial poll
    pollStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [scanId, navigate, pollStatus]);

  // Manual retry handler
  const handleRetry = () => {
    setError(null);
    setLastPollError(null);
    setIsSlowProcessing(false);
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    isNavigatingRef.current = false;
    pollStatus();
  };

  // Navigate to start page
  const handleBackToStart = () => {
    navigate('/start');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-2">Processing Error</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Retry
            </button>
            <button
              onClick={handleBackToStart}
              className="px-6 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Start New Scan
            </button>
          </div>
          {scanId && (
            <p className="text-xs text-slate-400 mt-4">
              Scan ID: {scanId}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Format elapsed time for display
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

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
            <div className={`absolute inset-0 border-4 border-transparent rounded-full animate-spin ${
              isSlowProcessing ? 'border-t-amber-500' : 'border-t-primary-blue'
            }`} />

            {/* Inner icon */}
            <div className={`absolute inset-3 rounded-full flex items-center justify-center ${
              isSlowProcessing ? 'bg-amber-50' : 'bg-blue-50'
            }`}>
              <Loader2
                size={32}
                className={`animate-spin ${isSlowProcessing ? 'text-amber-500' : 'text-primary-blue'}`}
                style={{ animationDuration: '3s' }}
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text-main mb-2">
            {isSlowProcessing ? 'Still Working...' : 'Analyzing Your Feed'}
          </h1>
          <p className="text-text-muted mb-4">
            {isSlowProcessing
              ? "This is taking longer than usual. The server may be processing a large file."
              : isDesktopScan
                ? "Processing your desktop scan…"
                : "Processing your recording…"}
          </p>

          {/* Elapsed time indicator */}
          <p className="text-xs text-slate-400 mb-6">
            Elapsed: {formatElapsedTime(elapsedSeconds)}
          </p>

          {/* Connection error warning */}
          {lastPollError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800">
              Connection issue detected. Retrying automatically...
            </div>
          )}

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
                    isCurrent ? (isSlowProcessing ? 'text-amber-600' : 'text-primary-blue') :
                    'text-slate-400'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle size={20} className="flex-shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-5 h-5 flex-shrink-0">
                      <div className={`w-full h-full border-2 border-t-transparent rounded-full animate-spin ${
                        isSlowProcessing ? 'border-amber-500' : 'border-primary-blue'
                      }`} />
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
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isSlowProcessing ? 'bg-amber-500' : 'bg-primary-blue'
              }`}
              style={{ width: `${Math.min(((currentStepIndex + 1) / (isDesktopScan ? PROCESSING_STEPS_DESKTOP : PROCESSING_STEPS_MOBILE).length) * 100, 95)}%` }}
            />
          </div>

          {/* Action buttons for slow processing */}
          {isSlowProcessing && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-white text-amber-600 border border-amber-300 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Check Status
              </button>
              <button
                onClick={handleBackToStart}
                className="px-4 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Start New Scan
              </button>
            </div>
          )}

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


