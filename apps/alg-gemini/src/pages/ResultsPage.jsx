import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Eye,
  MessageSquare,
  Target,
  Heart,
  ChevronLeft,
  Loader2,
  RefreshCw,
  History,
  Monitor,
  Smartphone,
  Bug
} from 'lucide-react';
import PlatformBadge, { getPlatformConfig } from '../components/PlatformBadge';
import MetricCard from '../components/MetricCard';
import PostItem from '../components/PostItem';
import ScanWarnings from '../components/ScanWarnings';

/**
 * Determine if a scan is from Desktop (Chrome extension) or Mobile (video upload).
 *
 * Detection logic (in order of priority):
 * 1. source_type === "DESKTOP_EXTENSION" → Desktop
 * 2. scan_metadata.source_type === "DESKTOP_EXTENSION" → Desktop
 * 3. scan.id starts with "desktop-" → Desktop (fallback heuristic)
 * 4. environment.extension_capture exists → Desktop
 * 5. Otherwise → Mobile upload
 *
 * TODO: If the backend adds an explicit `source` field, update this function.
 */
const getScanSource = (result) => {
  if (!result) return 'unknown';

  // Check top-level source_type
  if (result.source_type === 'DESKTOP_EXTENSION') {
    return 'desktop';
  }

  // Check nested scan_metadata
  const scanMeta = result.scan_metadata || result.result?.scan_metadata;
  if (scanMeta?.source_type === 'DESKTOP_EXTENSION') {
    return 'desktop';
  }

  // Check ID prefix
  const scanId = result.id || scanMeta?.scan_id;
  if (scanId?.startsWith('desktop-')) {
    return 'desktop';
  }

  // Check environment for extension capture
  const env = result.environment || result.result?.environment;
  if (env?.extension_capture) {
    return 'desktop';
  }

  // Default to mobile upload for video-based scans
  return 'mobile';
};

/**
 * DebugPanel - Shows diagnostic information for QA testing
 * Visible when ?debug=1 query param is present or when toggle is clicked
 */
const DebugPanel = ({ result, scanId }) => {
  if (!result) return null;

  const source = getScanSource(result);
  const scanData = result.result || result.scan || result;
  const scanMeta = scanData.scan_metadata || result.scan_metadata || {};
  const aggregates = scanData.aggregates || {};
  const environment = scanData.environment || {};
  const debugInfo = scanData.debug || {};

  // Extract key metrics
  const totalPosts = aggregates.total_feed_items || 0;
  const totalAds = aggregates.total_ads || 0;
  const adPercentage = aggregates.ad_percentage || 0;
  const platform = scanMeta.platform || result.platform || 'Unknown';
  const createdAt = scanMeta.created_at || result.created_at;
  const sourceType = scanMeta.source_type || result.source_type || 'N/A';

  // Environment details
  const deviceType = environment.device_type || 'N/A';
  const browserName = environment.browser_name || 'N/A';
  const videoDuration = environment.video_capture?.duration_seconds;
  const hasExtensionCapture = !!environment.extension_capture;

  // Debug details
  const processingTime = debugInfo.processing_time_seconds;
  const framesExtracted = debugInfo.frames_extracted;
  const warnings = debugInfo.warnings || [];
  const errors = debugInfo.errors || [];

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 relative">
      {/* Debug Label */}
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-800 border border-amber-200">
          <Bug size={12} />
          Debug
        </span>
      </div>

      <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
        <Bug size={20} className="text-amber-600" />
        Debug Panel (Desktop Scan QA)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {/* Source & Platform */}
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Source</span>
          <span className="font-medium text-text-main flex items-center gap-1">
            {source === 'desktop' ? (
              <>
                <Monitor size={14} className="text-blue-600" />
                Desktop (Extension)
              </>
            ) : (
              <>
                <Smartphone size={14} className="text-emerald-600" />
                Mobile upload
              </>
            )}
          </span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Platform</span>
          <span className="font-medium text-text-main capitalize">{platform}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Source Type (raw)</span>
          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{sourceType}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Scan ID</span>
          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[180px]" title={scanId}>
            {scanId || scanMeta.scan_id || 'N/A'}
          </span>
        </div>

        {/* Counts */}
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Total Posts (backend)</span>
          <span className="font-bold text-text-main">{totalPosts}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Ads Detected (backend)</span>
          <span className="font-bold text-text-main">{totalAds}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Ads % (backend)</span>
          <span className="font-bold text-text-main">{Math.round(adPercentage * 100)}%</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Created At</span>
          <span className="text-slate-700">{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</span>
        </div>

        {/* Environment */}
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Device Type</span>
          <span className="text-slate-700">{deviceType}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Browser</span>
          <span className="text-slate-700">{browserName}</span>
        </div>

        {videoDuration !== undefined && (
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">Video Duration</span>
            <span className="text-slate-700">{Math.round(videoDuration)}s</span>
          </div>
        )}

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Extension Capture</span>
          <span className={`font-medium ${hasExtensionCapture ? 'text-blue-600' : 'text-slate-400'}`}>
            {hasExtensionCapture ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Scanner Version */}
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600">Desktop scanner version</span>
          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {(() => {
              const version = scanMeta.metadata?.scanner_version || 
                             scanData.metadata?.scanner_version || 
                             result?.metadata?.scanner_version;
              if (version) {
                // Add 'v' prefix if not already present
                return version.startsWith('v') ? version : `v${version}`;
              }
              return 'unknown';
            })()}
          </span>
        </div>

        {/* Processing Info */}
        {processingTime !== undefined && (
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">Processing Time</span>
            <span className="text-slate-700">{processingTime.toFixed(2)}s</span>
          </div>
        )}

        {framesExtracted !== undefined && (
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">Frames Extracted</span>
            <span className="text-slate-700">{framesExtracted}</span>
          </div>
        )}
      </div>

      {/* Warnings & Errors */}
      {(warnings.length > 0 || errors.length > 0) && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {errors.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-red-600 uppercase">Errors ({errors.length})</span>
              <ul className="mt-1 text-xs text-red-700">
                {errors.slice(0, 3).map((e, i) => (
                  <li key={i} className="truncate">• {e.message || e.code}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-amber-600 uppercase">Warnings ({warnings.length})</span>
              <ul className="mt-1 text-xs text-amber-700">
                {warnings.slice(0, 3).map((w, i) => (
                  <li key={i} className="truncate">• {w.message || w.code}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResultsPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check for ?debug=1 query param to auto-show debug panel
  const debugParamEnabled = searchParams.get('debug') === '1';

  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(debugParamEnabled);
  const [showRawJson, setShowRawJson] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState(false);

  // Scroll to top when results load
  useEffect(() => {
    if (result) {
      window.scrollTo(0, 0);
    }
  }, [result]);

  // Fetch scan result
  useEffect(() => {
    if (result) return; // Already have result from navigation state

    const fetchResult = async () => {
      try {
        let targetScanId = scanId;
        
        // If scanId is "latest", fetch the most recent scan first
        if (scanId === 'latest') {
          const listResponse = await fetch('http://127.0.0.1:8000/api/scans');
          if (!listResponse.ok) {
            throw new Error('Failed to fetch scans list');
          }
          const listData = await listResponse.json();
          const scans = listData.scans || [];
          
          if (scans.length === 0) {
            throw new Error('No scans found. Start a new scan to see results.');
          }
          
          // Get the most recent scan (assuming sorted by date desc, or sort manually)
          const latestScan = scans.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0];
          targetScanId = latestScan.id;
        }
        
        const response = await fetch(`http://127.0.0.1:8000/api/scans/${targetScanId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch scan: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched scan data:', data);
        
        // Check if scan is still processing
        if (data.status === 'processing' || data.status === 'pending') {
          // Redirect back to processing page
          navigate(`/scan/processing?scanId=${targetScanId}`);
          return;
        }
        
        // Handle different response structures
        const resultData = data.result || data.scan || data;
        console.log('Setting result data:', resultData);
        
        // If resultData is null or empty, show error
        if (!resultData || (typeof resultData === 'object' && Object.keys(resultData).length === 0)) {
          throw new Error('Scan result data is empty. The scan may still be processing.');
        }
        
        setResult(resultData);
      } catch (err) {
        console.error('Error fetching scan result:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (scanId) {
      fetchResult();
    } else {
      setLoading(false);
      setError('No scan ID provided');
    }
  }, [scanId, result]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-text-muted">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-2">Error Loading Results</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <Link
            to="/start"
            className="inline-block px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Start New Scan
          </Link>
        </div>
      </div>
    );
  }

  // Parse display data from result with error handling
  let displayData = null;
  let parseError = null;
  try {
    displayData = getDisplayData(result);
  } catch (err) {
    console.error('Error in getDisplayData:', err);
    parseError = err.message;
  }
  
  if (parseError) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-main mb-2">Error Rendering Results</h1>
          <p className="text-text-muted mb-4">{parseError}</p>
          {result && (
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-sm text-primary-blue hover:underline mb-4 block mx-auto"
            >
              {showRawJson ? 'Hide' : 'Show'} Raw Data
            </button>
          )}
          {showRawJson && result && (
            <pre className="text-xs text-slate-700 overflow-x-auto max-h-96 text-left bg-slate-50 p-4 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
          <div className="flex gap-4 justify-center mt-6">
            <Link
              to="/start"
              className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!displayData) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md border border-slate-100 p-8">
          <div className="text-center mb-6">
            <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text-main mb-2">Unable to Parse Results</h1>
            <p className="text-text-muted mb-4">
              The scan data structure doesn't match the expected format. Showing raw data below.
            </p>
          </div>
          
          {result && (
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-sm text-primary-blue hover:underline mb-2"
              >
                {showRawJson ? 'Hide' : 'Show'} Raw Data
              </button>
              {showRawJson && (
                <pre className="text-xs text-slate-700 overflow-x-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <Link
              to="/start"
              className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Scan
            </Link>
            <Link
              to="/history"
              className="px-6 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const platformConfig = getPlatformConfig(displayData.platform);
  
  // Check if this is a desktop scan
  const isDesktopScan = getScanSource(result) === 'desktop';
  const scanData = result?.result || result?.scan || result;
  const sourceType = scanData?.scan_metadata?.source_type || result?.source_type;

  // Helper function to process feed items for desktop scans
  const processFeedItemForDesktop = (item) => {
    if (!isDesktopScan || sourceType !== 'DESKTOP_EXTENSION') {
      return item;
    }

    // Create a copy to avoid mutating original
    const processedItem = { ...item };

    // A. If missing creator, show "Creator unavailable"
    if (!processedItem.creator || processedItem.creator.trim() === '') {
      processedItem.creator = 'Creator unavailable';
    }

    // B. If missing caption, hide it entirely (set to null)
    if (!processedItem.caption || 
        processedItem.caption.trim() === '' || 
        processedItem.caption === 'No caption' ||
        processedItem.caption === 'No caption available') {
      processedItem.caption = null;
    }

    // C. Check if post has minimal fields (fallback mode)
    // If it only has thumbnail or very basic info, add fallback notice
    const hasMinimalData = !processedItem.creator || 
                           !processedItem.caption ||
                           (!processedItem.details || Object.keys(processedItem.details).length === 0);
    
    if (hasMinimalData) {
      processedItem.fallbackMode = true;
    }

    return processedItem;
  };

  return (
    <div className="min-h-screen bg-bg-page py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-main mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        {/* Success Header */}
        <div className="bg-accent-green rounded-2xl shadow-lg p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  Analysis Complete
                  <PlatformBadge platform={displayData.platform} size="sm" />
                </h1>
                <p className="opacity-90">
                  Your {displayData.platform} feed has been analyzed successfully
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Clock size={16} />
              <span>{new Date(displayData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard 
            title="Total Posts" 
            value={displayData.totalPosts}
            icon={Eye}
          />
          <MetricCard 
            title="Ads Found" 
            value={displayData.adsCount}
            subtitle="sponsored content"
            icon={Target}
          />
          <MetricCard 
            title="Ads %" 
            value={`${displayData.adPercentage}%`}
            trendDirection={displayData.adPercentage > 25 ? 'down' : 'neutral'}
            icon={BarChart3}
          />
          <MetricCard 
            title="Categories" 
            value={displayData.categoriesCount}
            subtitle="detected"
            icon={TrendingUp}
          />
        </div>

        {/* Scan Integrity Warnings */}
        <ScanWarnings scan={result} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Topic Clusters */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 size={18} className="text-primary-blue" />
              </div>
              Topic Clusters
            </h2>
            {displayData.topTopics.length > 0 ? (
              <div className="space-y-3">
                {displayData.topTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{topic.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-blue rounded-full"
                          style={{ width: `${topic.percentage * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 w-12 text-right">
                        {Math.round(topic.percentage * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No specific topics detected</p>
            )}
          </div>

          {/* Content Tone */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MessageSquare size={18} className="text-primary-blue" />
              </div>
              Content Tone
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-medium">Positive</span>
                  <span className="text-slate-500">{Math.round(displayData.toneBreakdown.positive * 100)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${displayData.toneBreakdown.positive * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Neutral</span>
                  <span className="text-slate-500">{Math.round(displayData.toneBreakdown.neutral * 100)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: `${displayData.toneBreakdown.neutral * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600 font-medium">Negative</span>
                  <span className="text-slate-500">{Math.round(displayData.toneBreakdown.negative * 100)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${displayData.toneBreakdown.negative * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Political Content */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <AlertTriangle size={18} className="text-primary-blue" />
              </div>
              Political Content
            </h2>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-text-main mb-2">
                {Math.round(displayData.politicalPercentage * 100)}%
              </div>
              <p className="text-slate-500">of your feed contains political content</p>
            </div>
            {displayData.politicalPercentage > 0.2 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-800">
                  Your feed has a higher than average amount of political content.
                </p>
              </div>
            )}
          </div>

          {/* Wellbeing Signals */}
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Heart size={18} className="text-primary-blue" />
              </div>
              Wellbeing Signals
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Body image focus</span>
                <span className={`font-semibold ${
                  displayData.wellbeing.bodyImage > 0.2 ? 'text-amber-600' : 'text-slate-700'
                }`}>
                  {Math.round(displayData.wellbeing.bodyImage * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Diet/weight content</span>
                <span className={`font-semibold ${
                  displayData.wellbeing.dietWeight > 0.2 ? 'text-amber-600' : 'text-slate-700'
                }`}>
                  {Math.round(displayData.wellbeing.dietWeight * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Conflict/controversy</span>
                <span className={`font-semibold ${
                  displayData.wellbeing.conflict > 0.2 ? 'text-amber-600' : 'text-slate-700'
                }`}>
                  {Math.round(displayData.wellbeing.conflict * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Post-by-Post Breakdown */}
        {displayData.feedItems && displayData.feedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Eye size={18} className="text-primary-blue" />
                </div>
                Post-by-Post Breakdown
              </h2>
              <button
                onClick={() => setExpandedPosts(!expandedPosts)}
                className="text-sm text-primary-blue hover:underline"
              >
                {expandedPosts ? 'Show Less' : `Show All (${displayData.feedItems.length})`}
              </button>
            </div>
            
            <div className="space-y-3">
              {(expandedPosts ? displayData.feedItems : displayData.feedItems.slice(0, 5)).map((item, index) => {
                // Process item for desktop scan fallback handling
                const processedItem = processFeedItemForDesktop(item);
                
                return (
                  <div key={index}>
                    <PostItem
                      thumbnail={processedItem.thumbnail}
                      creator={processedItem.creator}
                      caption={processedItem.caption}
                      badges={processedItem.badges}
                      categories={processedItem.categories}
                      details={processedItem.details}
                    />
                    {/* Fallback mode notice for desktop scans */}
                    {processedItem.fallbackMode && (
                      <div className="mt-2 text-xs text-slate-500 italic text-center">
                        Captured via fallback mode — platform provided minimal metadata.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {!expandedPosts && displayData.feedItems.length > 5 && (
              <button
                onClick={() => setExpandedPosts(true)}
                className="w-full mt-4 py-3 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Show {displayData.feedItems.length - 5} more posts
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            to="/start"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={20} />
            Scan Again
          </Link>
          <Link
            to="/history"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-primary-blue border-2 border-primary-blue rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            <History size={20} />
            View History
          </Link>
        </div>

        {/* Scan Again for This Platform Button */}
        {displayData.platform && (
          <div className="flex justify-center mb-8">
            <Link
              to={`/scan/platform/${displayData.platform.toLowerCase()}`}
              className="px-6 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Scan again for this platform
            </Link>
          </div>
        )}

        {/* Debug Panel Section */}
        <div className="border-t border-slate-200 pt-6 space-y-4">
          {/* Toggle Button */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Bug size={16} />
            {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
          </button>

          {/* Debug Panel (visible when toggled or ?debug=1) */}
          {showDebugPanel && (
            <DebugPanel result={result} scanId={scanId} />
          )}

          {/* Raw JSON Toggle */}
          <div className="pt-4">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              {showRawJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
            </button>

            {showRawJson && (
              <div className="mt-4 bg-slate-900 rounded-xl p-6 overflow-x-auto">
                <pre className="text-green-400 font-mono text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to extract display data from unified schema
function getDisplayData(data) {
  if (!data) {
    console.log('getDisplayData: No data provided');
    return null;
  }

  try {
    console.log('getDisplayData: Processing data:', data);
    // Handle both direct result and nested result
    const scanData = data.result || data.scan || data;
    console.log('getDisplayData: Extracted scanData:', scanData);
    
    // Basic info
    const platform = scanData.scan_metadata?.platform || data.platform || 'Unknown';
    const timestamp = scanData.scan_metadata?.created_at || data.created_at || new Date().toISOString();
    
    // Aggregates
    const aggregates = scanData.aggregates || {};
    const totalPosts = aggregates.total_feed_items || 0;
    const adPercentage = Math.round((aggregates.ad_percentage || 0) * 100);
    const adsCount = Math.round(totalPosts * (aggregates.ad_percentage || 0));
    
    // Topics
    const topTopics = (aggregates.topic_distribution || []).slice(0, 6).map(t => ({
      topic: t.category,
      percentage: t.percentage
    }));
    const categoriesCount = topTopics.length;

    // Tone breakdown
    const valence = aggregates.wellbeing_summary?.valence_distribution || {};
    const totalValence = (valence.POSITIVE || 0) + (valence.NEUTRAL || 0) + (valence.NEGATIVE || 0);
    const toneBreakdown = {
      positive: totalValence > 0 ? (valence.POSITIVE || 0) / totalValence : 0.33,
      neutral: totalValence > 0 ? (valence.NEUTRAL || 0) / totalValence : 0.34,
      negative: totalValence > 0 ? (valence.NEGATIVE || 0) / totalValence : 0.33,
    };

    // Political
    const politicalPercentage = aggregates.political_content_summary?.political_percentage || 0;

    // Wellbeing
    const feedItems = scanData.feed_items || [];
    let bodyImageCount = 0;
    let dietCount = 0;
    let conflictCount = 0;
    const itemCount = feedItems.length || 1;

    feedItems.forEach(item => {
      const themes = item.wellbeing?.themes || [];
      if (themes.includes('body_image')) bodyImageCount++;
      if (themes.includes('diet_weight_loss')) dietCount++;
      if (themes.includes('conflict')) conflictCount++;
    });

    const wellbeing = {
      bodyImage: bodyImageCount / itemCount,
      dietWeight: dietCount / itemCount,
      conflict: conflictCount / itemCount,
    };

    // Feed items for post-by-post breakdown
    const parsedFeedItems = feedItems.map(item => {
      const badges = [];
      if (item.is_ad) badges.push('Sponsored');
      if (item.political?.is_political) badges.push('Political');
      
      return {
        thumbnail: item.thumbnail_url || null,
        creator: item.creator?.handle || item.creator?.name || null,
        caption: item.text_content?.caption || item.text_content?.ocr_text || 'No caption',
        badges,
        categories: item.topics || [],
        details: {
          isAd: item.is_ad,
          valence: item.wellbeing?.valence,
          themes: item.wellbeing?.themes || [],
          product: item.ad_metadata?.product_or_service,
        },
      };
    });

    return {
      platform,
      timestamp,
      totalPosts,
      adsCount,
      adPercentage,
      categoriesCount,
      topTopics,
      toneBreakdown,
      politicalPercentage,
      wellbeing,
      feedItems: parsedFeedItems,
    };
  } catch (err) {
    console.error('Error parsing display data:', err);
    return null;
  }
}

export default ResultsPage;

