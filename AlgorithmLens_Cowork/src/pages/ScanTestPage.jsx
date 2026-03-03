import React, { useState } from 'react';
import { logError } from '../lib/errorLogger.js';
import { getApiBaseUrl } from '../lib/apiConfig.js';

const ScanTestPage = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a video file first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", "demo-user");
        formData.append("platform", "tiktok");

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/scan/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            logError("ScanTestPage", "Upload error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const formatPercent = (val) => `${Math.round(val * 100)}%`;

    const getRepetitionLabel = (score) => {
        // Mapping count to score roughly for display
        // Assuming score was 0-1, and count is items. 
        // Let's just use the count directly or a simple heuristic for now.
        if (score === 0) return "Varied";
        if (score < 5) return "Somewhat repetitive";
        return "Very repetitive";
    };

    // Helper to extract data from unified schema for display
    const getDisplayData = (data) => {
        if (!data) return null;

        // Ads & Topics
        const adPercentage = data.aggregates.ad_percentage;
        const estimatedAdsPer10 = adPercentage * 10;
        const topTopics = data.aggregates.topic_distribution.slice(0, 4).map(t => ({
            topic: t.category,
            percentage: t.percentage
        }));

        // Repetition
        const repetitionCount = data.aggregates.repetition_summary.items_in_repetition_clusters;
        // Mocking score back from count for display logic if needed, or just using count
        const repetitionScore = repetitionCount;

        // Tone
        const totalValence = data.aggregates.wellbeing_summary.valence_distribution.POSITIVE +
            data.aggregates.wellbeing_summary.valence_distribution.NEUTRAL +
            data.aggregates.wellbeing_summary.valence_distribution.NEGATIVE;

        const toneBreakdown = {
            positive: totalValence > 0 ? data.aggregates.wellbeing_summary.valence_distribution.POSITIVE / totalValence : 0,
            neutral: totalValence > 0 ? data.aggregates.wellbeing_summary.valence_distribution.NEUTRAL / totalValence : 0,
            negative: totalValence > 0 ? data.aggregates.wellbeing_summary.valence_distribution.NEGATIVE / totalValence : 0
        };

        // Wellbeing Signals (Need to aggregate from feed items or just use what we have)
        // Since aggregates doesn't have breakdown, we iterate feed_items
        let bodyImageCount = 0;
        let dietCount = 0;
        let conflictCount = 0;
        const totalItems = data.feed_items.length || 1;

        data.feed_items.forEach(item => {
            if (item.wellbeing.themes.includes("body_image")) bodyImageCount++;
            if (item.wellbeing.themes.includes("diet_weight_loss")) dietCount++;
            if (item.wellbeing.themes.includes("conflict")) conflictCount++;
        });

        const wellbeingSignals = {
            body_image_focus: bodyImageCount / totalItems,
            diet_weight_loss_focus: dietCount / totalItems,
            conflict_politics_focus: conflictCount / totalItems
        };

        // Political
        const politicalSignals = {
            politicalContentShare: data.aggregates.political_content_summary.political_percentage,
            politicalLeanLabel: "neutral" // Mock, or extract if available in items
        };

        // Products
        // Extract unique products from feed items
        const productsMap = {};
        data.feed_items.forEach(item => {
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
        const engagementDrivers = data.aggregates.engagement_pattern_summary.top_hooks.map(h => ({
            label: h.hook,
            confidence: 0.8 // Mock confidence
        }));

        return {
            platform: data.scan_metadata.platform,
            scanDurationSeconds: data.environment.video_capture.duration_seconds,
            timestamp: data.scan_metadata.created_at,
            frameCountAnalyzed: data.aggregates.total_feed_items,
            deletedRawVideo: true, // Assumed true based on backend logic

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

    const displayData = result ? getDisplayData(result) : null;

    return (
        <div className="min-h-[100dvh] bg-slate-50 py-20 px-6 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Scan Test (Internal)</h1>
                    <p className="text-slate-600 mb-8">
                        Upload a recorded TikTok/Instagram screen recording to test the AlgorithmLens backend.
                    </p>

                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                        <div className="flex flex-col gap-4">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                "
                            />

                            {error && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={loading || !file}
                                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all
                  ${loading || !file
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                    }
                `}
                            >
                                {loading ? 'Analyzing your feed...' : 'Upload & Analyze'}
                            </button>
                        </div>
                    </div>
                </div>

                {displayData && (
                    <div className="space-y-6">
                        {/* Scan Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-bold mb-4">Scan Summary</h2>
                            <p className="text-slate-700">
                                <span className="capitalize font-semibold">{displayData.platform}</span> scan · {Math.round(displayData.scanDurationSeconds)} second scan · {displayData.frameCountAnalyzed} frames analyzed ·
                                {displayData.deletedRawVideo ? <span className="text-green-600 ml-1">video deleted after analysis</span> : <span className="text-red-600 ml-1">video NOT deleted</span>}
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
                                        {displayData.topTopics.map((t, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                {t.topic} – {formatPercent(t.percentage)}
                                            </span>
                                        ))}
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
                )}
            </div>
        </div>
    );
};

export default ScanTestPage;
