import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Check, AlertTriangle, Clock } from 'lucide-react';

export const InteractiveDemo = () => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setIsLiked(true);
        setIsRevealed(true);
    };

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">See It In Action</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Experience how our algorithm lens analyzes content in real-time.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left Side: Social Post (Simulated UI) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                            <div>
                                <div className="text-sm font-semibold text-gray-900">The Daily News</div>
                                <div className="text-xs text-gray-500">2h ago</div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                                    Why the Economy is Failing
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    New data shows extreme divide in voter opinions as inflation concerns continue to dominate the national conversation...
                                </p>
                            </div>

                            {/* Image Placeholder */}
                            <div className="w-full aspect-video bg-gray-200 rounded-lg relative overflow-hidden group">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                    [Article Image]
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-4 border-t border-gray-50 flex items-center gap-6">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                <span>Like</span>
                            </button>
                            <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                                <MessageCircle className="w-5 h-5" />
                                <span>Comment</span>
                            </button>
                            <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Analysis Reveal (The "Glass" Card) */}
                    <div className="relative min-h-[300px] flex items-center justify-center">
                        {!isRevealed && (
                            <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                                <div className="space-y-4 opacity-50">
                                    <p className="text-gray-400 text-sm">
                                        Interact with the post on the left to see the analysis.
                                    </p>
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {isRevealed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-purple-100 overflow-hidden relative"
                                    style={{
                                        boxShadow: '0 4px 24px -1px rgba(123, 97, 255, 0.15)' // Subtle purple glow shadow
                                    }}
                                >
                                    {/* Solid Border Effect */}
                                    <div className="absolute inset-0 rounded-2xl border border-primary/20 pointer-events-none" />

                                    <div className="p-6 relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-xs font-bold tracking-wider text-primary uppercase flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                Algorithm Analysis
                                            </h4>
                                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                                                Live
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex gap-3 items-start">
                                                <div className="mt-0.5 p-1 bg-primary/10 rounded-full text-primary">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">Interpreted political bias as active</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Based on engagement with "failing economy" keyword.</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-start">
                                                <div className="mt-0.5 p-1 bg-warning/10 rounded-full text-warning">
                                                    <AlertTriangle className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">Logged high engagement with outrage</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Dwell time exceeded 3s on negative headline.</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-start">
                                                <div className="mt-0.5 p-1 bg-secondary/10 rounded-full text-secondary">
                                                    <Clock className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">Queued 5 similar posts</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Optimizing for maximum session duration.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-border">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Confidence Score</span>
                                                <span className="font-semibold text-foreground">94%</span>
                                            </div>
                                            <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '94%' }}
                                                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};
