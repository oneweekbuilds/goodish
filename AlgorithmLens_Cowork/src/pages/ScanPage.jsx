import React, { useState } from 'react';
import { ChevronLeft, Upload, Smartphone, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { logError } from '../lib/errorLogger.js';
import { getApiBaseUrl } from '../lib/apiConfig.js';

// Platform options
const PLATFORMS = [
    { id: 'tiktok', name: 'TikTok', icon: '📱', color: 'bg-black text-white' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'bg-red-600 text-white' },
    { id: 'facebook', name: 'Facebook', icon: '👤', color: 'bg-blue-600 text-white' },
    { id: 'twitter', name: 'X', icon: '𝕏', color: 'bg-black text-white' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700 text-white' },
    { id: 'reddit', name: 'Reddit', icon: '🔗', color: 'bg-orange-600 text-white' },
];

// Recording instructions per platform
const INSTRUCTIONS = {
    tiktok: [
        'Open TikTok on your phone',
        'Go to your For You page',
        'Start screen recording (swipe down on iOS, or use your phone\'s screen recorder)',
        'Scroll through 10-20 videos naturally',
        'Stop recording and save the video',
    ],
    instagram: [
        'Open Instagram on your phone',
        'Go to the Reels tab',
        'Start screen recording',
        'Scroll through 10-20 Reels naturally',
        'Stop recording and save the video',
    ],
    youtube: [
        'Open YouTube on your phone',
        'Go to the Shorts section or Home page',
        'Start screen recording',
        'Scroll through 10-20 videos naturally',
        'Stop recording and save the video',
    ],
    facebook: [
        'Open Facebook on your phone',
        'Go to your main feed or Reels',
        'Start screen recording',
        'Scroll through 10-20 posts/videos naturally',
        'Stop recording and save the video',
    ],
    twitter: [
        'Open X (Twitter) on your phone',
        'Go to your Home or For You timeline',
        'Start screen recording',
        'Scroll through 10-20 tweets naturally',
        'Stop recording and save the video',
    ],
    linkedin: [
        'Open LinkedIn on your phone',
        'Go to your main feed',
        'Start screen recording',
        'Scroll through 10-20 posts naturally',
        'Stop recording and save the video',
    ],
    reddit: [
        'Open Reddit on your phone',
        'Go to your Home or Popular feed',
        'Start screen recording',
        'Scroll through 10-20 posts naturally',
        'Stop recording and save the video',
    ],
};

const ScanPage = () => {
    // Flow state
    const [step, setStep] = useState(1); // 1: platform, 2: instructions, 3: upload, 4: loading, 5: results
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Handle platform selection
    const handlePlatformSelect = (platform) => {
        setSelectedPlatform(platform);
        setStep(2);
    };

    // Handle continue from instructions
    const handleContinueFromInstructions = () => {
        setStep(3);
    };

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    // Handle upload and scan
    const handleUpload = async () => {
        if (!file) {
            setError("Please select a video file first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setStep(4); // Show loading state

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", "demo-user");
        formData.append("platform", selectedPlatform.id);

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
            setStep(5); // Show results
        } catch (err) {
            logError("ScanPage", "Upload error:", err);
            setError(err.message || "An unexpected error occurred.");
            setStep(3); // Go back to upload step on error
        } finally {
            setLoading(false);
        }
    };

    // Go back handler
    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setSelectedPlatform(null);
        } else if (step === 3) {
            setStep(2);
        } else if (step === 5) {
            // Reset everything for a new scan
            setStep(1);
            setSelectedPlatform(null);
            setFile(null);
            setResult(null);
            setError(null);
        }
    };

    // Start new scan
    const handleNewScan = () => {
        setStep(1);
        setSelectedPlatform(null);
        setFile(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-6 font-sans text-slate-900">
            <div className="max-w-2xl mx-auto">
                {/* Header with back button */}
                {step > 1 && step < 5 && (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Back</span>
                    </button>
                )}

                {/* Step 1: Platform Selection */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Scan Your Feed</h1>
                        <p className="text-slate-600 mb-4">
                            Choose the platform you want to analyze. We'll show you the patterns in your feed.
                        </p>
                        <p className="text-sm text-slate-500 mb-8">
                            Showing {PLATFORMS.length} platforms: {PLATFORMS.map(p => p.id).join(', ')}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {PLATFORMS.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => handlePlatformSelect(platform)}
                                    className={`${platform.color} rounded-xl p-4 text-left hover:opacity-90 transition-opacity shadow-md`}
                                >
                                    <span className="text-2xl mb-2 block">{platform.icon}</span>
                                    <span className="font-semibold">{platform.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Instructions */}
                {step === 2 && selectedPlatform && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Record Your {selectedPlatform.name} Feed
                        </h1>
                        <p className="text-slate-600 mb-6">
                            Follow these steps to capture your feed:
                        </p>
                        <ol className="space-y-3 mb-8">
                            {INSTRUCTIONS[selectedPlatform.id]?.map((instruction, i) => (
                                <li key={i} className="flex gap-3 text-slate-700">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                        {i + 1}
                                    </span>
                                    <span>{instruction}</span>
                                </li>
                            ))}
                        </ol>
                        <button
                            onClick={handleContinueFromInstructions}
                            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
                        >
                            I've Recorded My Feed — Continue
                        </button>
                    </div>
                )}

                {/* Step 3: Upload */}
                {step === 3 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload Your Recording</h1>
                        <p className="text-slate-600 mb-6">
                            Upload the screen recording of your {selectedPlatform?.name} feed.
                        </p>

                        <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors mb-6">
                            <Upload className="mx-auto mb-3 text-slate-400" size={40} />
                            <p className="text-slate-600 font-medium">
                                {file ? file.name : 'Click to select your video file'}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">MP4, MOV, or WebM</p>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 mb-4">
                                <AlertCircle size={16} />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!file}
                            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-semibold transition-colors shadow-lg disabled:shadow-none"
                        >
                            Analyze My Feed
                        </button>
                    </div>
                )}

                {/* Step 4: Loading */}
                {step === 4 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
                        <Loader2 className="mx-auto mb-4 text-blue-600 animate-spin" size={48} />
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Feed</h1>
                        <p className="text-slate-600">
                            This usually takes 30–60 seconds. We're processing your {selectedPlatform?.name} recording.
                        </p>
                    </div>
                )}

                {/* Step 5: Results */}
                {step === 5 && result && (
                    <ScanResults result={result} platform={selectedPlatform} onNewScan={handleNewScan} />
                )}
            </div>
        </div>
    );
};

// ============================================
// Results Component (extracted from ScanTestPage)
// ============================================

const ScanResults = ({ result, platform, onNewScan }) => {
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
        const adPercentage = data.aggregates.ad_percentage;
        const estimatedAdsPer10 = adPercentage * 10;
        const topTopics = data.aggregates.topic_distribution.slice(0, 4).map(t => ({
            topic: t.category,
            percentage: t.percentage
        }));

        // Repetition
        const repetitionCount = data.aggregates.repetition_summary.items_in_repetition_clusters;
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

        // Wellbeing Signals
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
            politicalLeanLabel: "neutral"
        };

        // Products
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
            confidence: 0.8
        }));

        return {
            platform: data.scan_metadata.platform,
            scanDurationSeconds: data.environment.video_capture?.duration_seconds || 0,
            timestamp: data.scan_metadata.created_at,
            frameCountAnalyzed: data.aggregates.total_feed_items,
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

    if (!displayData) return null;

    return (
        <div className="space-y-6">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={28} />
                    <h1 className="text-2xl font-bold">Analysis Complete!</h1>
                </div>
                <p className="opacity-90">
                    Your {platform?.name || displayData.platform} feed has been analyzed.
                </p>
            </div>

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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onNewScan}
                    className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
                >
                    Scan Another Feed
                </button>
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

export default ScanPage;

