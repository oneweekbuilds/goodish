import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Monitor,
  Smartphone,
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import PlatformBadge, { getPlatformConfig } from '../components/PlatformBadge';
import { track, EVENTS } from '../lib/analytics';
import { authenticatedFetch, isUnauthorized } from '../lib/api/authenticatedFetch';
import { getApiBaseUrl } from '../lib/apiConfig';
import SignInPrompt from '../components/auth/SignInPrompt';
import SEO from '../components/SEO';
import { logError } from '../lib/errorLogger.js';

// Platform display names
const PLATFORM_NAMES = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  x: 'X',
  twitter: 'X',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
};

const ScanPlatformPage = () => {
  const { platform } = useParams();
  const navigate = useNavigate();
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [checkingExtension, setCheckingExtension] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showRecordingHelp, setShowRecordingHelp] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const platformName = PLATFORM_NAMES[platform] || platform;
  const platformConfig = getPlatformConfig(platform);

  // Simple device detection
  const isMobile = typeof navigator !== "undefined"
    ? /Mobi|Android/i.test(navigator.userAgent)
    : false;

  // Check if Chrome extension is installed
  // (#19) Extension Detection Strategy:
  // Current detection approaches (in order of robustness):
  // 1. DOM marker: Check for #algorithmlens-extension-marker element (injected by extension)
  // 2. localStorage flag: Check 'algorithmlens-extension-installed' (set by extension)
  // 3. window.postMessage fallback: Could try posting a message and waiting for response
  // 4. Known extension global: Could check for window.__ALGORITHMLENS_EXT__ if exposed
  //
  // Limitations:
  // - Content Security Policy (CSP) may block some detection methods
  // - Extension may not have injected yet if page loads before extension
  // - Users may install extension after visiting this page (detected on page reload)
  //
  // Future improvements:
  // - Add a "Not installed? Refresh the page" message to handle late installs
  // - Use Service Worker postMessage with timeout for more reliable detection
  useEffect(() => {
    const checkExtension = () => {
      let installed = false;

      // Method 1: Check for DOM marker (most reliable if extension loads)
      const extensionCheck = document.getElementById('algorithmlens-extension-marker');
      if (extensionCheck) {
        installed = true;
      } else {
        // Method 2: Check localStorage flag (fallback if DOM injection failed)
        const flagSet = localStorage.getItem('algorithmlens-extension-installed') === 'true';
        if (flagSet) {
          installed = true;
        }
        // Method 3: Could add more robust detection here (e.g., postMessage with timeout)
        // For now, if both methods fail, assume not installed
      }

      setExtensionInstalled(installed);
      setCheckingExtension(false);
    };

    // Small delay to allow extension content script to inject marker
    const timer = setTimeout(checkExtension, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Validate file extension
  const isValidFileType = (fileName) => {
    const validExtensions = ['.mp4', '.mov', '.webm'];
    const lowerFileName = fileName.toLowerCase();
    return validExtensions.some(ext => lowerFileName.endsWith(ext));
  };

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile.name)) {
        setFile(droppedFile);
        setUploadError(null);
      } else {
        setUploadError('This file type is not supported. Please upload an .mp4, .mov, or .webm screen recording.');
      }
    }
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFileType(selectedFile.name)) {
        setFile(selectedFile);
        setUploadError(null);
      } else {
        setFile(null);
        setUploadError('This file type is not supported. Please upload an .mp4, .mov, or .webm screen recording.');
      }
    }
  };

  // Handle upload
  const handleUpload = async () => {
    // Client-side validation: required file
    if (!file) {
      setUploadError('Please select a screen recording file before uploading.');
      return;
    }

    // Client-side validation: file type
    if (!isValidFileType(file.name)) {
      setUploadError('This file type is not supported. Please upload an .mp4, .mov, or .webm screen recording.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    // Track scan started
    track(EVENTS.SCAN_STARTED, {
      platform,
      fileSize: file.size,
      fileType: file.type,
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);
    // Note: userId is now extracted from JWT on backend

    const apiBase = getApiBaseUrl();

    try {
      const response = await authenticatedFetch(`${apiBase}/api/scan/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Check for 401 Unauthorized
        if (isUnauthorized(response)) {
          setUploading(false);
          setShowSignInPrompt(true);
          return;
        }

        // Try to extract the server's error detail
        let serverDetail = '';
        try {
          const errBody = await response.json();
          serverDetail = errBody.detail || errBody.message || errBody.error || '';
        } catch {
          // Response body wasn't JSON
        }

        // Create an error with the server's message attached
        const uploadErr = new Error(serverDetail || `Upload failed: ${response.status} ${response.statusText}`);
        uploadErr.status = response.status;
        uploadErr.serverDetail = serverDetail;
        throw uploadErr;
      }

      const data = await response.json();

      // Get the scan ID from response (new format: {scan_id, status})
      const resultScanId = data.scan_id || data.id || data.scan_metadata?.scan_id;

      if (resultScanId) {
        // Navigate to processing page (it will poll and redirect to results when complete)
        navigate(`/scan/processing?scanId=${resultScanId}`);
      } else {
        // If no scan ID but we have result data, go to results with the data
        // This handles cases where backend returns immediate result (legacy)
        navigate('/scan/results/latest');
      }
    } catch (err) {
      logError('ScanPlatformPage', 'Upload error:', err);

      // Network errors (backend unreachable)
      if (err instanceof TypeError || (err.message && err.message.includes('Failed to fetch'))) {
        setUploadError('Unable to reach the server. Please check your connection and try again.');
      }
      // Server returned an error with a detail message
      else if (err.serverDetail) {
        setUploadError(err.serverDetail);
      }
      // Other server errors
      else if (err.status) {
        setUploadError(`Upload failed (error ${err.status}). Please try again or use a different video file.`);
      }
      // Unknown errors
      else {
        setUploadError('Something went wrong during upload. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle desktop scan start
  const handleDesktopScan = () => {
    // Try to communicate with extension
    try {
      window.postMessage({ type: 'ALGORITHMLENS_START_SCAN', platform }, '*');
      // Also try localStorage approach
      localStorage.setItem('algorithmlens-pending-scan', JSON.stringify({ platform, timestamp: Date.now() }));
    } catch (e) {
      logError('ScanPlatformPage', 'Failed to start desktop scan:', e);
    }
  };

  // Show sign-in prompt if 401 error
  if (showSignInPrompt) {
    return (
      <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16">
        <SignInPrompt
          title="Please sign in to run a scan"
          body="Sign in to start analyzing your social media feeds. Your scans will be saved to your account."
          source="upload_401"
          onBack={() => navigate('/start')}
          backLabel="Back to platforms"
        />
      </div>
    );
  }

  return (
    <>
    <SEO title={`Scan ${platformName}`} description={`Analyze your ${platformName} feed with AlgorithmLens.`} path={`/scan/platform/${platform}`} noIndex={true} />
    <div className="min-h-screen bg-bg-page pt-20 pb-24 md:pt-24 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/start"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-main mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back to platforms</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 rounded-xl ${platformConfig.bgColor} flex items-center justify-center`}>
            <span className="text-2xl">{platformConfig.icon}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-main">
              Scan Your {platformName} Feed
            </h1>
            <p className="text-text-muted">
              Choose how you'd like to capture your feed
            </p>
          </div>
        </div>

        {/* Two Method Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Desktop Extension */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Monitor size={24} className="text-primary-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main">Chrome Extension</h2>
                <p className="text-sm text-text-muted">Desktop only</p>
              </div>
            </div>

            <p className="text-slate-600 mb-6">
              Use our Chrome extension to automatically capture your feed in real-time. 
              The fastest and easiest method.
            </p>

            {checkingExtension ? (
              <div className="flex items-center gap-2 text-slate-500 mb-4">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-blue rounded-full animate-spin" />
                <span>Checking for extension...</span>
              </div>
            ) : extensionInstalled ? (
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle size={18} />
                <span className="font-medium">Extension installed</span>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-amber-600 mb-3">
                  <AlertCircle size={18} />
                  <span className="font-medium">Extension not detected</span>
                </div>
                <a
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-blue hover:underline"
                >
                  <Download size={16} />
                  Install Chrome Extension
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <button
              onClick={handleDesktopScan}
              disabled={!extensionInstalled}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                extensionInstalled
                  ? 'bg-primary-blue text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Monitor size={18} />
              Start Desktop Scan
            </button>

            {/* Instructions */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">How it works:</h3>
              <ol className="text-sm text-slate-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">1</span>
                  <span>Install the Chrome extension</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">2</span>
                  <span>Navigate to {platformName}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">3</span>
                  <span>Click "Start Scan" and scroll your feed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">4</span>
                  <span>Stop scan to see results</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Card B: Mobile Upload */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <Smartphone size={24} className="text-accent-green" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main">Upload Recording</h2>
              </div>
            </div>

            <p className="text-slate-600 mb-4">
              Upload a screen recording of your feed. Perfect for mobile users on iOS or Android.
            </p>

            {/* Tips for best results */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-700 mb-2">Tips for best results:</p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Use a recent screen recording (1–2 minutes is ideal)</li>
                <li>Scroll your feed normally while recording</li>
                <li>Avoid switching apps during the recording</li>
              </ul>
            </div>

            {/* How to record on your phone - Collapsible */}
            <div className="mb-6">
              <button
                onClick={() => setShowRecordingHelp(!showRecordingHelp)}
                className="flex items-center gap-2 text-sm text-primary-blue hover:underline font-medium"
              >
                {showRecordingHelp ? (
                  <>
                    <ChevronUp size={16} />
                    Hide recording instructions
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    How to record on your phone
                  </>
                )}
              </button>

              {showRecordingHelp && (
                <div className="mt-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                  {/* iOS Instructions */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">On iPhone (iOS)</h4>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>Open Control Center (swipe down from the top-right corner).</li>
                      <li>Tap the Screen Recording button.</li>
                      <li>Wait for the countdown, then open the app and scroll your feed.</li>
                      <li>When finished, stop the recording from Control Center. The video will be saved to Photos.</li>
                    </ul>
                  </div>

                  {/* Android Instructions */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">On Android</h4>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>Swipe down to open Quick Settings.</li>
                      <li>Tap Screen Record (or your device's screen recording option).</li>
                      <li>Start the recording, then open the app and scroll your feed.</li>
                      <li>When finished, stop the recording. The video will be saved to your gallery.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all mb-4
                ${dragActive 
                  ? 'border-primary-blue bg-blue-50' 
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }
              `}
            >
              <Upload size={32} className={`mx-auto mb-3 ${dragActive ? 'text-primary-blue' : 'text-slate-400'}`} />
              
              {file ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle size={18} />
                  <span className="font-medium text-sm">{file.name}</span>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 mb-2">
                    Drag and drop your video here
                  </p>
                  <p className="text-sm text-slate-400">
                    or
                  </p>
                </>
              )}

              <input
                type="file"
                accept=".mp4,.mov,.webm,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                !uploading && file
                  ? 'bg-accent-green text-white hover:bg-emerald-600 shadow-md hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload & Analyze
                </>
              )}
            </button>

            {/* Upload progress status */}
            {uploading && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                This can take up to 30–60 seconds for longer videos.
              </p>
            )}

            {/* Accepted formats */}
            <p className="text-xs text-slate-400 mt-3 text-center">
              Accepted formats: .mp4, .mov, .webm
            </p>
          </div>
        </div>

        {/* Upgrade CTA Panel */}
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-text-main mb-3">
            Get faster, automatic scans
          </h2>
          <p className="text-slate-600 mb-6">
            {isMobile 
              ? "Upload works great on mobile today, and a dedicated AlgorithmLens app is coming soon."
              : "Upload works great, but the best experience is with our app: automatic desktop scans with the AlgorithmLens Chrome extension, and a dedicated mobile app in the works."
            }
          </p>

          {!isMobile ? (
            // Desktop CTA
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                On desktop, the AlgorithmLens Chrome extension records your feed automatically so you don't have to upload videos.
              </p>
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
              >
                <Download size={18} />
                Install Chrome extension
                <ExternalLink size={16} />
              </a>
              <p className="text-sm text-slate-500 mt-4">
                On mobile, you can upload recordings today. A dedicated mobile app is coming soon.
              </p>
            </div>
          ) : (
            // Mobile CTA
            <div>
              <p className="text-sm text-slate-600">
                Mobile app coming soon. For now, upload a screen recording and we'll analyze your feed.
              </p>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Privacy First:</strong> Your video is processed securely and deleted immediately 
            after analysis. We never store your raw video content or share your data.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default ScanPlatformPage;

