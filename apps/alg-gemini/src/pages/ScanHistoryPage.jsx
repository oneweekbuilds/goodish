import React, { useState, useEffect } from 'react';
import { Clock, BarChart3, AlertCircle, Loader2, ChevronLeft, Trash2, RefreshCw } from 'lucide-react';

const ScanHistoryPage = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedScan, setSelectedScan] = useState(null);
    const [loadingScan, setLoadingScan] = useState(false);
    const [scanError, setScanError] = useState(null);

    // Fetch all scans on mount
    useEffect(() => {
        fetchScans();
    }, []);

    const fetchScans = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch("http://127.0.0.1:8000/api/scans");
            if (!response.ok) {
                throw new Error(`Failed to fetch scans: ${response.status}`);
            }
            const data = await response.json();
            setScans(data.scans || []);
        } catch (err) {
            console.error("Error fetching scans:", err);
            setError(err.message || "Failed to load scan history");
        } finally {
            setLoading(false);
        }
    };

    const fetchScanDetails = async (scanId) => {
        setLoadingScan(true);
        setScanError(null);
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/scans/${scanId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch scan: ${response.status}`);
            }
            const data = await response.json();
            setSelectedScan(data);
        } catch (err) {
            console.error("Error fetching scan details:", err);
            setScanError(err.message || "Failed to load scan details");
        } finally {
            setLoadingScan(false);
        }
    };

    const deleteScan = async (scanId, e) => {
        e.stopPropagation(); // Prevent row click
        
        if (!confirm("Are you sure you want to delete this scan?")) {
            return;
        }
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/scans/${scanId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                throw new Error(`Failed to delete scan: ${response.status}`);
            }
            // Remove from local state
            setScans(scans.filter(s => s.id !== scanId));
            // If this scan was selected, clear selection
            if (selectedScan?.id === scanId) {
                setSelectedScan(null);
            }
        } catch (err) {
            console.error("Error deleting scan:", err);
            alert("Failed to delete scan: " + err.message);
        }
    };

    const handleBackToList = () => {
        setSelectedScan(null);
        setScanError(null);
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return dateStr;
        }
    };

    const formatPercent = (val) => `${Math.round(val * 100)}%`;

    // ============================================
    // Render: Loading State
    // ============================================
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans text-slate-900">
                <div className="max-w-4xl mx-auto text-center">
                    <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading history...</p>
                </div>
            </div>
        );
    }

    // ============================================
    // Render: Error State
    // ============================================
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans text-slate-900">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading History</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchScans}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // Render: Scan Details View
    // ============================================
    if (selectedScan) {
        return (
            <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans text-slate-900">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={handleBackToList}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Back to History</span>
                    </button>

                    {loadingScan ? (
                        <div className="text-center py-12">
                            <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-slate-600">Loading scan details...</p>
                        </div>
                    ) : scanError ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                            <p className="text-red-600">{scanError}</p>
                        </div>
                    ) : (
                        <ScanResultsView result={selectedScan.result} scanMeta={selectedScan} />
                    )}
                </div>
            </div>
        );
    }

    // ============================================
    // Render: Scans List View
    // ============================================
    return (
        <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Scan History</h1>
                        <p className="text-slate-600 mt-1">View and compare your past feed scans</p>
                    </div>
                    <button
                        onClick={fetchScans}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <RefreshCw size={18} />
                        <span>Refresh</span>
                    </button>
                </div>

                {scans.length === 0 ? (
                    // Empty State
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <BarChart3 size={64} className="text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-700 mb-2">No scans yet</h2>
                        <p className="text-slate-500 mb-6">
                            Run your first scan to see your feed analysis history here.
                        </p>
                        <a
                            href="/scan"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Start a Scan
                        </a>
                    </div>
                ) : (
                    // Scans Table
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Platform</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Duration</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Items</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Ads %</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.map((scan) => (
                                    <tr
                                        key={scan.id}
                                        onClick={() => fetchScanDetails(scan.id)}
                                        className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Clock size={16} className="text-slate-400" />
                                                <span>{formatDate(scan.created_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium capitalize">
                                                {scan.platform?.toLowerCase() || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {/* Desktop snapshots (duration = 0) show N/A, session scans show actual duration */}
                                            {(scan.source_type === "DESKTOP_EXTENSION" && (!scan.duration_seconds || scan.duration_seconds === 0)) ||
                                             (scan.id?.startsWith("desktop-") && (!scan.duration_seconds || scan.duration_seconds === 0))
                                                ? <span className="text-slate-400 italic text-sm">N/A (desktop snapshot)</span>
                                                : `${Math.round(scan.duration_seconds || 0)}s`
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {scan.total_items || 0} items
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${
                                                (scan.ad_percentage || 0) > 0.3 
                                                    ? 'text-red-600' 
                                                    : (scan.ad_percentage || 0) > 0.15 
                                                        ? 'text-amber-600' 
                                                        : 'text-green-600'
                                            }`}>
                                                {formatPercent(scan.ad_percentage || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => deleteScan(scan.id, e)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete scan"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


// ============================================
// ScanResultsView Component
// ============================================
const ScanResultsView = ({ result, scanMeta }) => {
    const [showDebug, setShowDebug] = useState(false);

    const formatPercent = (val) => `${Math.round(val * 100)}%`;

    const getRepetitionLabel = (score) => {
        if (score === 0) return "Varied";
        if (score < 5) return "Somewhat repetitive";
        return "Very repetitive";
    };

    // Helper to extract data from unified schema for display
    const getDisplayData = (data) => {
        if (!data) return null;

        // Ads & Topics
        const adPercentage = data.aggregates?.ad_percentage || 0;
        const estimatedAdsPer10 = adPercentage * 10;
        const topTopics = (data.aggregates?.topic_distribution || []).slice(0, 4).map(t => ({
            topic: t.category,
            percentage: t.percentage
        }));

        // Repetition
        const repetitionCount = data.aggregates?.repetition_summary?.items_in_repetition_clusters || 0;
        const repetitionScore = repetitionCount;

        // Tone
        const valenceDistribution = data.aggregates?.wellbeing_summary?.valence_distribution || {};
        const totalValence = (valenceDistribution.POSITIVE || 0) +
            (valenceDistribution.NEUTRAL || 0) +
            (valenceDistribution.NEGATIVE || 0);

        const toneBreakdown = {
            positive: totalValence > 0 ? (valenceDistribution.POSITIVE || 0) / totalValence : 0,
            neutral: totalValence > 0 ? (valenceDistribution.NEUTRAL || 0) / totalValence : 0,
            negative: totalValence > 0 ? (valenceDistribution.NEGATIVE || 0) / totalValence : 0
        };

        // Wellbeing Signals
        let bodyImageCount = 0;
        let dietCount = 0;
        let conflictCount = 0;
        const feedItems = data.feed_items || [];
        const totalItems = feedItems.length || 1;

        feedItems.forEach(item => {
            const themes = item.wellbeing?.themes || [];
            if (themes.includes("body_image")) bodyImageCount++;
            if (themes.includes("diet_weight_loss")) dietCount++;
            if (themes.includes("conflict")) conflictCount++;
        });

        const wellbeingSignals = {
            body_image_focus: bodyImageCount / totalItems,
            diet_weight_loss_focus: dietCount / totalItems,
            conflict_politics_focus: conflictCount / totalItems
        };

        // Political
        const politicalSignals = {
            politicalContentShare: data.aggregates?.political_content_summary?.political_percentage || 0,
            politicalLeanLabel: "neutral"
        };

        // Products
        const productsMap = {};
        feedItems.forEach(item => {
            if (item.ad_metadata && item.ad_metadata.product_or_service) {
                const name = item.ad_metadata.product_or_service;
                productsMap[name] = (productsMap[name] || 0) + 1;
            }
        });
        const topPromotedProducts = Object.entries(productsMap).map(([name, count]) => ({
            name,
            category: "general",
            approxFrequency: count / totalItems
        })).sort((a, b) => b.approxFrequency - a.approxFrequency);

        // Engagement Drivers
        const engagementDrivers = (data.aggregates?.engagement_pattern_summary?.top_hooks || []).map(h => ({
            label: h.hook,
            confidence: 0.8
        }));

        return {
            platform: data.scan_metadata?.platform || "Unknown",
            sourceType: data.scan_metadata?.source_type || null,
            scanDurationSeconds: data.environment?.video_capture?.duration_seconds || 0,
            timestamp: data.scan_metadata?.created_at || new Date().toISOString(),
            frameCountAnalyzed: data.aggregates?.total_feed_items || 0,
            deletedRawVideo: true,

            adPercentage,
            estimatedAdsPer10,
            topTopics,
            repetitionScore,
            toneBreakdown,
            wellbeingSignals,
            politicalSignals,
            topPromotedProducts,
            engagementDrivers
        };
    };

    const displayData = getDisplayData(result);

    if (!displayData) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                <p className="text-amber-600">Unable to display scan results</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Scan Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold mb-4">Scan Summary</h2>
                <p className="text-slate-700">
                    <span className="capitalize font-semibold">{displayData.platform}</span> scan · {
                        /* Desktop snapshots (duration = 0) show "desktop snapshot", session scans show actual duration */
                        (displayData.sourceType === "DESKTOP_EXTENSION" && (!displayData.scanDurationSeconds || displayData.scanDurationSeconds === 0)) ||
                        (scanMeta?.id?.startsWith("desktop-") && (!displayData.scanDurationSeconds || displayData.scanDurationSeconds === 0))
                            ? <span className="text-slate-500 italic">desktop snapshot</span>
                            : `${Math.round(displayData.scanDurationSeconds)} second scan`
                    } · {displayData.frameCountAnalyzed} posts analyzed
                </p>
                <p className="text-sm text-slate-500 mt-1">
                    Timestamp: {new Date(displayData.timestamp).toLocaleString()}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ads & Topics */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold mb-3">Ads & Topics</h3>
                    <p className="mb-4 text-slate-700">
                        Estimated <span className="font-bold">{formatPercent(displayData.adPercentage)}</span> of your feed was ads (about {displayData.estimatedAdsPer10.toFixed(1)} ads per 10 posts).
                    </p>
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Top Topics</h4>
                        <div className="flex flex-wrap gap-2">
                            {displayData.topTopics.length > 0 ? displayData.topTopics.map((t, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                    {t.topic} – {formatPercent(t.percentage)}
                                </span>
                            )) : (
                                <span className="text-slate-400 text-sm italic">No specific topics detected</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Repetition & Tone */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold mb-3">Repetition & Tone</h3>
                    <div className="mb-4">
                        <span className="text-slate-500 text-sm">Repetition Count:</span>
                        <div className="text-lg font-semibold text-slate-800">
                            {getRepetitionLabel(displayData.repetitionScore)} ({displayData.repetitionScore} items)
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-500 text-sm">Tone Breakdown:</span>
                        <div className="flex items-center gap-2 mt-1 text-sm font-medium">
                            <span className="text-green-600">Positive: {formatPercent(displayData.toneBreakdown.positive)}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">Neutral: {formatPercent(displayData.toneBreakdown.neutral)}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-red-600">Negative: {formatPercent(displayData.toneBreakdown.negative)}</span>
                        </div>
                    </div>
                </div>

                {/* Wellbeing Signals */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold mb-3">Wellbeing Signals</h3>
                    <ul className="space-y-2 text-slate-700">
                        <li className="flex justify-between">
                            <span>Body image focus</span>
                            <span className="font-semibold">{formatPercent(displayData.wellbeingSignals.body_image_focus)}</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Diet/weight loss</span>
                            <span className="font-semibold">{formatPercent(displayData.wellbeingSignals.diet_weight_loss_focus)}</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Conflict/politics</span>
                            <span className="font-semibold">{formatPercent(displayData.wellbeingSignals.conflict_politics_focus)}</span>
                        </li>
                    </ul>
                </div>

                {/* Politics */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold mb-3">Politics</h3>
                    <p className="text-slate-700">
                        About <span className="font-bold">{formatPercent(displayData.politicalSignals.politicalContentShare)}</span> of your feed was political.
                    </p>
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-sm text-slate-500 uppercase tracking-wider block mb-1">Lean</span>
                        <span className="font-semibold text-slate-800 capitalize">{displayData.politicalSignals.politicalLeanLabel}</span>
                    </div>
                </div>
            </div>

            {/* Products & Engagement */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold mb-4">Products & Engagement Drivers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Promoted Products</h4>
                        {displayData.topPromotedProducts.length > 0 ? (
                            <ul className="space-y-2">
                                {displayData.topPromotedProducts.map((p, i) => (
                                    <li key={i} className="text-sm text-slate-700">
                                        <span className="font-medium">{p.name}</span> <span className="text-slate-400">({p.category})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No specific products detected.</p>
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Engagement Drivers</h4>
                        {displayData.engagementDrivers.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {displayData.engagementDrivers.map((d, i) => (
                                    <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm border border-purple-100">
                                        {d.label}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No specific drivers detected.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Debug JSON */}
            <div className="border-t border-slate-200 pt-6">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-sm text-slate-500 hover:text-slate-700 underline mb-4"
                >
                    {showDebug ? 'Hide Raw JSON' : 'Show Raw JSON (debug)'}
                </button>

                {showDebug && (
                    <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                        <pre className="text-green-400 font-mono text-sm">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanHistoryPage;

