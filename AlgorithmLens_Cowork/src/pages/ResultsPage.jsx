import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Eye,
  Target,
  ChevronLeft,
  Loader2,
  RefreshCw,
  History,
  Bug
} from 'lucide-react';
import PlatformBadge, { getPlatformConfig } from '../components/PlatformBadge';
import MetricCard from '../components/MetricCard';
import PostItem from '../components/PostItem';
import ScanWarnings from '../components/ScanWarnings';
import { getDisplayData } from '../lib/dataParsing';
import DebugPanel from '../components/results/DebugPanel';
import { TopicClusters, ContentTone, PoliticalContent, WellbeingSignals } from '../components/results/InsightCards';
import PostScanUpsell from '../components/results/PostScanUpsell';
import SurpriseInsightSplash from '../components/results/SurpriseInsightSplash';
import FeedFingerprint from '../components/results/FeedFingerprint';
import BackLink from '../components/ui/BackLink';
import Skeleton from '../components/ui/Skeleton';
import { authenticatedFetch } from '../lib/api/authenticatedFetch';
import { getApiBaseUrl } from '../lib/apiConfig';
import { logError } from '../lib/errorLogger.js';

const ResultsPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const debugParamEnabled = searchParams.get('debug') === '1';

  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(debugParamEnabled);
  const [showRawJson, setShowRawJson] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Scroll to top when results load
  useEffect(() => {
    if (result) {
      window.scrollTo(0, 0);
    }
  }, [result]);

  // Fetch scan result
  useEffect(() => {
    if (result) return;

    const fetchResult = async () => {
      try {
        let targetScanId = scanId;

        const apiBaseUrl = getApiBaseUrl();

        if (scanId === 'latest') {
          const listResponse = await authenticatedFetch(`${apiBaseUrl}/api/scans`);
          if (!listResponse.ok) {
            throw new Error('Failed to fetch scans list');
          }
          const listData = await listResponse.json();
          const scans = listData.scans || [];

          if (scans.length === 0) {
            throw new Error('No scans found. Start a new scan to see results.');
          }

          const latestScan = scans.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
          )[0];
          targetScanId = latestScan.id;
        }

        const response = await authenticatedFetch(`${apiBaseUrl}/api/scans/${targetScanId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch scan: ${response.status}`);
        }
        const data = await response.json();

        if (data.status === 'processing' || data.status === 'pending') {
          navigate(`/scan/processing?scanId=${targetScanId}`);
          return;
        }

        const resultData = data.result || data.scan || data;

        if (!resultData || (typeof resultData === 'object' && Object.keys(resultData).length === 0)) {
          throw new Error('Scan result data is empty. The scan may still be processing.');
        }

        setResult(resultData);
      } catch (err) {
        logError('ResultsPage', 'Error fetching scan result:', err);
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

  // --- Loading State --- (#21 Skeleton Loading)
  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page pt-20 pb-24 md:pt-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Link Skeleton */}
          <Skeleton className="h-6 w-20 mb-8" />

          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mt-4" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>

          {/* Feed Items Skeleton */}
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
            <Skeleton className="h-6 w-48 mb-6" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-4 pb-4 border-b last:border-b-0">
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-border-light p-8 text-center">
          <div className="w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-status-error" />
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-2">Error Loading Results</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <Link
            to="/start"
            className="inline-block px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-colors"
          >
            Start New Scan
          </Link>
        </div>
      </div>
    );
  }

  // Parse display data
  let displayData = null;
  let parseError = null;
  try {
    displayData = getDisplayData(result);
  } catch (err) {
    logError('ResultsPage', 'Error in getDisplayData:', err);
    parseError = err.message;
  }

  if (parseError) {
    return (
      <div className="min-h-screen bg-bg-page py-24 px-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md border border-border-light p-8 text-center">
          <AlertTriangle size={48} className="text-status-error mx-auto mb-4" />
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
            <pre className="text-xs text-text-muted overflow-x-auto max-h-96 text-left bg-primary-blue/5 p-4 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
          <div className="flex gap-4 justify-center mt-6">
            <Link
              to="/start"
              className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-colors"
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
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md border border-border-light p-8">
          <div className="text-center mb-6">
            <AlertTriangle size={48} className="text-status-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text-main mb-2">Unable to Parse Results</h1>
            <p className="text-text-muted mb-4">
              The scan data structure doesn&apos;t match the expected format. Showing raw data below.
            </p>
          </div>
          {result && (
            <div className="bg-primary-blue/5 rounded-lg p-4 mb-4">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-sm text-primary-blue hover:underline mb-2"
              >
                {showRawJson ? 'Hide' : 'Show'} Raw Data
              </button>
              {showRawJson && (
                <pre className="text-xs text-text-muted overflow-x-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <Link
              to="/start"
              className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-colors"
            >
              Start New Scan
            </Link>
            <Link
              to="/history"
              className="px-6 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-xl font-semibold hover:bg-primary-blue/5 transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Surprise Insight Splash — shown once before results
  if (showSplash && displayData) {
    return (
      <SurpriseInsightSplash
        displayData={displayData}
        onDismiss={() => setShowSplash(false)}
      />
    );
  }

  const platformConfig = getPlatformConfig(displayData.platform);
  const isDesktopScan = displayData.source === 'desktop';
  const scanData = result?.result || result?.scan || result;
  const sourceType = scanData?.scan_metadata?.source_type || result?.source_type;

  const processFeedItemForDesktop = (item) => {
    if (!isDesktopScan || sourceType !== 'DESKTOP_EXTENSION') {
      return item;
    }
    const processedItem = { ...item };
    if (!processedItem.creator || processedItem.creator.trim() === '') {
      processedItem.creator = 'Creator unavailable';
    }
    if (!processedItem.caption ||
        processedItem.caption.trim() === '' ||
        processedItem.caption === 'No caption' ||
        processedItem.caption === 'No caption available') {
      processedItem.caption = null;
    }
    const hasMinimalData = !processedItem.creator ||
                           !processedItem.caption ||
                           (!processedItem.details || Object.keys(processedItem.details).length === 0);
    if (hasMinimalData) {
      processedItem.fallbackMode = true;
    }
    return processedItem;
  };

  return (
    <>
      <SEO title="Scan Results" noIndex={true} />
      <main className="min-h-screen bg-bg-page pt-20 pb-24 md:pt-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
        {/* Back Navigation */}
        <BackLink to="/start" label="Back" />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        {/* AI Analysis Reinforcement */}
        {scanData?.debug?.gemini_used && (
          <div className="mb-6 px-4 py-3 bg-primary-blue/5 border border-primary-blue/10 rounded-lg">
            <p className="text-sm text-primary-blue">
              AI analysis provided to help summarize patterns across posts.
            </p>
          </div>
        )}

        {/* Main Content Grid — Extracted Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <TopicClusters topTopics={displayData.topTopics} />
          <ContentTone toneBreakdown={displayData.toneBreakdown} />
          <PoliticalContent politicalPercentage={displayData.politicalPercentage} />
          <WellbeingSignals wellbeing={displayData.wellbeing} />
        </div>

        {/* Feed Fingerprint — shareable summary card */}
        <FeedFingerprint displayData={displayData} />

        {/* Post-by-Post Breakdown */}
        {displayData.feedItems && displayData.feedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-border-light p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <div className="p-2 bg-primary-blue/5 rounded-lg">
                  <Eye size={18} className="text-primary-blue" />
                </div>
                Post-by-Post Breakdown
              </h2>
              <button
                onClick={() => setExpandedPosts(!expandedPosts)}
                className="text-sm text-primary-blue hover:underline"
                aria-expanded={expandedPosts}
                aria-label={expandedPosts ? 'Collapse post list' : `Expand to show all ${displayData.feedItems.length} posts`}
              >
                {expandedPosts ? 'Show Less' : `Show All (${displayData.feedItems.length})`}
              </button>
            </div>

            <div className="space-y-3">
              {(expandedPosts ? displayData.feedItems : displayData.feedItems.slice(0, 5)).map((item, index) => {
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
                    {processedItem.fallbackMode && (
                      <div className="mt-2 text-xs text-text-muted italic text-center">
                        Captured via fallback mode. Platform provided minimal metadata.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!expandedPosts && displayData.feedItems.length > 5 && (
              <button
                onClick={() => setExpandedPosts(true)}
                className="w-full mt-4 py-3 border border-border-light rounded-lg text-text-muted font-medium hover:bg-primary-blue/5 transition-colors"
                aria-label={`Show ${displayData.feedItems.length - 5} more posts`}
              >
                Show {displayData.feedItems.length - 5} more posts
              </button>
            )}
          </div>
        )}

        {/* Post-Scan Upsell CTA (#23) */}
        <div className="mb-8">
          <PostScanUpsell displayData={displayData} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            to="/start"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-colors shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={20} />
            Scan Again
          </Link>
          <Link
            to="/history"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-primary-blue border-2 border-primary-blue rounded-xl font-semibold hover:bg-primary-blue/5 transition-colors"
          >
            <History size={20} />
            View History
          </Link>
        </div>

        {/* Scan Again for This Platform */}
        {displayData.platform && (
          <div className="flex justify-center mb-8">
            <Link
              to={`/scan/platform/${displayData.platform.toLowerCase()}`}
              className="px-6 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-xl font-semibold hover:bg-primary-blue/5 transition-colors"
            >
              Scan again for this platform
            </Link>
          </div>
        )}

        {/* Debug Panel Section */}
        <div className="border-t border-border-light pt-6 space-y-4">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main bg-primary-blue/5 hover:bg-primary-blue/10 rounded-lg transition-colors"
            aria-expanded={showDebugPanel}
            aria-label={showDebugPanel ? 'Hide debug panel' : 'Show debug panel'}
          >
            <Bug size={16} aria-hidden="true" />
            {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
          </button>

          {showDebugPanel && (
            <DebugPanel result={result} scanId={scanId} displayData={displayData} />
          )}

          <div className="pt-4">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-sm text-text-muted hover:text-text-main underline"
              aria-expanded={showRawJson}
              aria-label={showRawJson ? 'Hide raw JSON data' : 'Show raw JSON data'}
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
      </main>
    </>
  );
};

export default ResultsPage;
