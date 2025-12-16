import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  BarChart3,
  Tag,
  AlertCircle,
  Loader2,
  RefreshCw,
  History,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Heart,
  Shield,
  TrendingUp,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PlatformIcon, PlatformBadge } from '../../../components/PlatformBadge';
import {
  fetchScanById,
  formatRelativeTime,
  formatPercent,
  formatDuration,
  PLATFORM_CONFIGS,
  type ScanDetailResponse,
  type UnifiedScanResult,
  type FeedItem,
} from '../../../lib/scanApi';

// Feed Item Card Component
const FeedItemCard = ({ item, index }: { item: FeedItem; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  const getContentPreview = () => {
    const captions = item.content_text?.captions || [];
    const hashtags = item.content_text?.hashtags || [];
    
    if (captions.length > 0) {
      return captions[0].slice(0, 150) + (captions[0].length > 150 ? '...' : '');
    }
    if (hashtags.length > 0) {
      return hashtags.slice(0, 5).map(h => `#${h}`).join(' ');
    }
    return 'No text content';
  };

  const getLabels = () => {
    const labels: { text: string; color: string; bgColor: string }[] = [];
    
    if (item.is_ad) {
      labels.push({ text: 'Sponsored', color: '#DC2626', bgColor: '#FEE2E2' });
    }
    
    if (item.topics?.primary_category) {
      labels.push({ 
        text: item.topics.primary_category, 
        color: '#2563EB', 
        bgColor: '#EFF6FF' 
      });
    }
    
    if (item.political?.is_political) {
      labels.push({ text: 'Political', color: '#7C3AED', bgColor: '#F3E8FF' });
    }
    
    if (item.wellbeing?.wellbeing_relevance === 'HIGH') {
      labels.push({ text: 'Wellbeing', color: '#10B981', bgColor: '#ECFDF5' });
    }

    return labels;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card
        className="p-4 mb-3 transition-all hover:shadow-md cursor-pointer bg-white"
        style={{ borderRadius: '16px' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Position */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-400">#{item.position_in_feed}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400 capitalize">{item.content_type?.toLowerCase()}</span>
            </div>

            {/* Content preview */}
            <p className="text-sm text-slate-700 mb-3 line-clamp-2">
              {getContentPreview()}
            </p>

            {/* Labels */}
            <div className="flex flex-wrap gap-2">
              {getLabels().map((label, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ color: label.color, backgroundColor: label.bgColor }}
                >
                  {label.text}
                </span>
              ))}
            </div>
          </div>

          {/* Expand indicator */}
          <div className="flex-shrink-0 text-slate-400">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-slate-100"
          >
            {/* Account info */}
            {item.account?.account_handle && (
              <div className="mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">Account</span>
                <p className="text-sm text-slate-700">@{item.account.account_handle}</p>
              </div>
            )}

            {/* Hashtags */}
            {item.content_text?.hashtags && item.content_text.hashtags.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">Hashtags</span>
                <p className="text-sm text-slate-600">
                  {item.content_text.hashtags.map(h => `#${h}`).join(' ')}
                </p>
              </div>
            )}

            {/* Ad metadata */}
            {item.is_ad && item.ad_metadata && (
              <div className="mb-3 p-3 bg-red-50 rounded-lg">
                <span className="text-xs font-semibold text-red-600 uppercase">Ad Details</span>
                {item.ad_metadata.advertiser_name && (
                  <p className="text-sm text-red-700">Advertiser: {item.ad_metadata.advertiser_name}</p>
                )}
                {item.ad_metadata.product_or_service && (
                  <p className="text-sm text-red-700">Product: {item.ad_metadata.product_or_service}</p>
                )}
              </div>
            )}

            {/* Topics */}
            {item.topics?.secondary_categories && item.topics.secondary_categories.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">Categories</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.topics.secondary_categories.map((cat, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export default function ScanResultsPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<ScanDetailResponse | null>(null);
  const [result, setResult] = useState<UnifiedScanResult | null>(null);
  const [showDebug, setShowDebug] = useState(searchParams.get('debug') === '1');
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    const loadScan = async () => {
      setLoading(true);
      setError(null);

      // Check for direct result from processing page
      if (scanId === 'latest') {
        const directResult = sessionStorage.getItem('directScanResult');
        if (directResult) {
          const parsed = JSON.parse(directResult);
          setResult(parsed);
          sessionStorage.removeItem('directScanResult');
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      if (scanId && scanId !== 'latest') {
        try {
          const data = await fetchScanById(scanId);
          setScanData(data);
          setResult(data.result);
        } catch (err) {
          console.error('Failed to load scan:', err);
          setError(err instanceof Error ? err.message : 'Failed to load scan results');
        }
      } else {
        setError('No scan ID provided');
      }

      setLoading(false);
    };

    loadScan();
  }, [scanId]);

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !result) {
    return (
      <div 
        className="min-h-screen px-6 pt-32 pb-16"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error Loading Results</h1>
          <p className="text-slate-600 mb-8">{error || 'No results found'}</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate('/start')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
            >
              Start New Scan
            </Button>
            <Button
              onClick={() => navigate('/history')}
              variant="outline"
              className="px-6 py-3 rounded-xl"
            >
              View History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Extract display data
  const platform = result.scan_metadata?.platform?.toLowerCase() || 'unknown';
  const config = PLATFORM_CONFIGS[platform];
  const createdAt = result.scan_metadata?.created_at || scanData?.created_at;
  const totalItems = result.aggregates?.total_feed_items || result.feed_items?.length || 0;
  const totalAds = result.aggregates?.total_ads || 0;
  const adPercentage = result.aggregates?.ad_percentage || 0;
  const topTopics = result.aggregates?.topic_distribution?.slice(0, 5) || [];
  const feedItems = result.feed_items || [];
  const displayedItems = showAllItems ? feedItems : feedItems.slice(0, 10);

  // Tone breakdown
  const valenceDistribution = result.aggregates?.wellbeing_summary?.valence_distribution || {};
  const totalValence = (valenceDistribution.POSITIVE || 0) +
    (valenceDistribution.NEUTRAL || 0) +
    (valenceDistribution.NEGATIVE || 0);

  const toneBreakdown = {
    positive: totalValence > 0 ? (valenceDistribution.POSITIVE || 0) / totalValence : 0,
    neutral: totalValence > 0 ? (valenceDistribution.NEUTRAL || 0) / totalValence : 0,
    negative: totalValence > 0 ? (valenceDistribution.NEGATIVE || 0) / totalValence : 0,
  };

  // Duration
  const duration = result.aggregates?.duration_seconds ||
    result.environment?.video_capture?.duration_seconds ||
    result.scan_metadata?.session_duration_seconds ||
    scanData?.duration_seconds || 0;

  // Device type
  const deviceType = result.environment?.device_type || 'Unknown';
  const sourceType = result.scan_metadata?.source_type || 'Unknown';

  return (
    <div 
      className="min-h-screen px-6 pt-32 pb-16"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to history</span>
        </motion.button>

        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500 rounded-3xl shadow-xl p-8 text-white mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <CheckCircle size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Analysis Complete</h1>
              <p className="text-white/80">Your feed has been analyzed successfully</p>
            </div>
          </div>
        </motion.div>

        {/* Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 mb-8 bg-white" style={{ borderRadius: '24px' }}>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Platform badge */}
              <PlatformBadge platform={platform} size="md" />

              {/* Timestamp */}
              {createdAt && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={16} />
                  <span>{formatRelativeTime(createdAt)}</span>
                </div>
              )}

              {/* Duration */}
              {duration > 0 && (
                <div className="text-sm text-slate-500">
                  Duration: {formatDuration(duration)}
                </div>
              )}

              {/* Device type */}
              <div className="flex items-center gap-1 text-sm text-slate-500">
                {deviceType.toLowerCase().includes('mobile') ? (
                  <Smartphone size={14} />
                ) : (
                  <Monitor size={14} />
                )}
                <span className="capitalize">{deviceType}</span>
              </div>

              {/* Source type */}
              <div className="text-xs text-slate-400 px-2 py-1 bg-slate-100 rounded-full">
                {sourceType.replace(/_/g, ' ').toLowerCase()}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <BarChart3 size={16} />
                  <span className="text-sm">Total Posts</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
              </div>

              <div className="p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <Megaphone size={16} />
                  <span className="text-sm">Ads Found</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{totalAds}</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <TrendingUp size={16} />
                  <span className="text-sm">Ads %</span>
                </div>
                <p className={`text-2xl font-bold ${
                  adPercentage > 0.3 ? 'text-red-600' : adPercentage > 0.15 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {formatPercent(adPercentage)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <Tag size={16} />
                  <span className="text-sm">Categories</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{topTopics.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Topics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 h-full bg-white" style={{ borderRadius: '24px' }}>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Top Topics</h3>
              </div>
              
              {topTopics.length > 0 ? (
                <div className="space-y-3">
                  {topTopics.map((topic, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{topic.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${topic.percentage * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-12 text-right">
                          {formatPercent(topic.percentage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No specific topics detected</p>
              )}
            </Card>
          </motion.div>

          {/* Tone Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 h-full bg-white" style={{ borderRadius: '24px' }}>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-pink-600" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Content Tone</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-emerald-600 font-medium">Positive</span>
                    <span>{formatPercent(toneBreakdown.positive)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${toneBreakdown.positive * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">Neutral</span>
                    <span>{formatPercent(toneBreakdown.neutral)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${toneBreakdown.neutral * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-600 font-medium">Negative</span>
                    <span>{formatPercent(toneBreakdown.negative)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${toneBreakdown.negative * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Political Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 h-full bg-white" style={{ borderRadius: '24px' }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Political Content</h3>
              </div>
              
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {formatPercent(result.aggregates?.political_content_summary?.political_percentage || 0)}
                </p>
                <p className="text-sm text-slate-500">of your feed is political</p>
              </div>
            </Card>
          </motion.div>

          {/* Wellbeing Signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 h-full bg-white" style={{ borderRadius: '24px' }}>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-emerald-600" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Wellbeing Signals</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">High relevance items</span>
                  <span className="font-semibold text-slate-900">
                    {result.aggregates?.wellbeing_summary?.high_relevance_items || 0}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm text-amber-700">Potential risk items</span>
                  <span className="font-semibold text-amber-900">
                    {result.aggregates?.wellbeing_summary?.potential_risk_items || 0}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Feed Items Section */}
        {feedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 bg-white" style={{ borderRadius: '24px' }}>
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Post-by-Post Breakdown
              </h3>
              
              <div className="space-y-2">
                {displayedItems.map((item, index) => (
                  <FeedItemCard key={index} item={item} index={index} />
                ))}
              </div>

              {feedItems.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="px-6 py-2 rounded-xl"
                  >
                    {showAllItems ? 'Show Less' : `Show All ${feedItems.length} Items`}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4 mt-8"
        >
          <Button
            onClick={() => navigate('/start')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center gap-2"
          >
            <RefreshCw size={20} />
            Scan Again
          </Button>
          <Button
            onClick={() => navigate('/history')}
            variant="outline"
            className="px-8 py-3 rounded-xl flex items-center gap-2"
          >
            <History size={20} />
            View History
          </Button>
        </motion.div>

        {/* Debug Section */}
        {showDebug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 pt-8 border-t border-slate-200"
          >
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-sm text-slate-500 hover:text-slate-700 underline mb-4"
            >
              Hide Debug JSON
            </button>
            <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
              <pre className="text-green-400 font-mono text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}

        {/* Toggle debug */}
        {!showDebug && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowDebug(true)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Show debug info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
