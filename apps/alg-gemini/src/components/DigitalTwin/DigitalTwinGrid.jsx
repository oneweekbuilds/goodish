import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import GlassCard from './GlassCard';
import { User, Activity, BarChart3, TrendingUp } from 'lucide-react';

const DigitalTwinGrid = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Parallax transforms
    const yLeft = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const yRight = useTransform(scrollYProgress, [0, 1], [100, -100]);

    return (
        <section ref={containerRef} className="relative w-full py-32">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                        Your Algorithmic Identity.
                    </h2>
                    <p className="text-xl text-gray-600">
                        Data points that define you in the eyes of the machine.
                    </p>
                </div>

                {/* Strict Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 max-w-4xl mx-auto">

                    {/* Card 1: Political Alignment (Col Span 2, Row Span 1) */}
                    <motion.div style={{ y: yLeft }} className="md:col-span-2 md:row-span-1">
                        <GlassCard className="h-full flex flex-col justify-between bg-gradient-to-br from-blue-50/50 to-white/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <BarChart3 size={120} />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-4xl font-extrabold tracking-tighter text-gray-900 mb-1">Left-Leaning</h3>
                                <p className="text-sm font-medium text-gray-500">Political Alignment • High Confidence</p>
                            </div>

                            <div className="relative z-10 mt-8">
                                <div className="flex justify-between mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <span>Conservative</span>
                                    <span>Liberal</span>
                                </div>
                                <div className="w-full h-3 bg-gray-200/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "88%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-blue-500"
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Card 2: Predicted Age (Col Span 1, Row Span 1) */}
                    <motion.div style={{ y: yRight }} className="md:col-span-1 md:row-span-1">
                        <GlassCard className="h-full flex flex-col justify-center bg-gradient-to-br from-orange-50/50 to-white/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-100/80 rounded-xl text-orange-600">
                                    <User size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Predicted Age</span>
                            </div>
                            <div className="text-4xl font-extrabold tracking-tighter text-gray-900">24 - 30</div>
                        </GlassCard>
                    </motion.div>

                    {/* Card 3: Content Diet (Col Span 1, Row Span 1 - Bottom Left) */}
                    <motion.div style={{ y: yLeft }} className="md:col-span-1 md:row-span-1">
                        <GlassCard className="h-full flex flex-col justify-center bg-white/40 border-blur-purple/30 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100/80 rounded-xl text-purple-600">
                                    <Activity size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Anxiety Level</span>
                            </div>
                            <div className="text-3xl font-extrabold tracking-tighter text-gray-900 text-red-500">High</div>
                        </GlassCard>
                    </motion.div>

                    {/* Card 4: Engagement (Col Span 2, Row Span 1 - Bottom Right) */}
                    <motion.div style={{ y: yRight }} className="md:col-span-2 md:row-span-1">
                        <GlassCard className="h-full flex items-center justify-between gap-8 bg-gradient-to-r from-green-50/50 to-emerald-50/30">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100/80 rounded-xl text-green-600">
                                        <TrendingUp size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Engagement Score</span>
                                </div>
                                <h3 className="text-4xl font-extrabold tracking-tighter text-gray-900">Top 5%</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-500 max-w-[150px]">Highly valuable to advertisers.</p>
                            </div>
                        </GlassCard>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default DigitalTwinGrid;
