import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Clock, ThumbsUp, Eye, Bookmark, Heart } from 'lucide-react';

const SectionTracking = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

    // Define fixed heights for alignment
    const cardHeight = "h-[110px]"; // Fixed height for both feed items and signal cards

    return (
        <section ref={containerRef} className="py-12 sm:py-24 bg-bg-page relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12 sm:mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 sm:mb-6"
                    >
                        Algorithms track everything you do.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-2"
                    >
                        Every scroll is a signal. Your interactions are meticulously logged to build a digital model of your psyche.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start relative">

                    {/* Left: Phone Mockup with Header */}
                    <div className="relative mx-auto lg:mx-0 order-1 flex flex-col">
                        {/* Header matching right side */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-6 text-center"
                        >
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-main mb-2">Your Feeds</h3>
                            <p className="text-xs sm:text-sm text-text-muted px-2">Algorithms learn who you are from your actions</p>
                        </motion.div>

                        {/* Phone Container */}
                        <div className="flex justify-center">
                            <motion.div
                                className="relative z-10 w-[340px] bg-bg-page rounded-[48px] shadow-strong border-[8px] border-gray-900 overflow-hidden flex flex-col"
                            >
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-gray-900 rounded-b-2xl z-20"></div>

                                {/* Status Bar */}
                                <div className="h-12 w-full bg-bg-page flex justify-between items-center px-6 pt-3 flex-shrink-0">
                                    <span className="text-xs font-bold text-gray-900">9:41</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-4 h-2.5 bg-gray-900 rounded-[1px]" />
                                        <div className="w-0.5 h-2.5 bg-gray-400 rounded-[1px]" />
                                    </div>
                                </div>

                                {/* Feed Content - with fixed spacing to match right side */}
                                <div className="p-4 pb-6 space-y-3.5 bg-gray-50">
                                    <FeedItem icon={Play} label="Fitness video" sub="Video • 1.2M views" tint="blue" heightClass={cardHeight} />
                                    <FeedItem icon={Heart} label="Political clip" sub="News • Sponsored" tint="green" heightClass={cardHeight} />
                                    <FeedItem icon={Play} label="Beauty ad" sub="Ad • Shop now" tint="blue" heightClass={cardHeight} />
                                    <FeedItem icon={Clock} label="Mental health TikTok" sub="TikTok • 800k views" tint="green" heightClass={cardHeight} />
                                    <FeedItem icon={Bookmark} label="Relationship advice" sub="Video • Trending" tint="blue" heightClass={cardHeight} />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right: Signals Extracted */}
                    <div className="relative order-2 space-y-5 flex flex-col">
                        {/* Header for takeaways */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-6 text-center"
                        >
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-main mb-2">Signals Extracted</h3>
                            <p className="text-xs sm:text-sm text-text-muted px-2">Key takeaways algorithms gather from your behavior</p>
                        </motion.div>

                        <div className="space-y-3.5" style={{ marginTop: '72px' }}>
                            <SignalItem
                                icon={Clock}
                                title="Paused on fitness content"
                                meta="Dwell time: 12s"
                                interpretation="Show more self-improvement and routine-building content."
                                tint="blue"
                                delay={0.2}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={ThumbsUp}
                                title="Liked 2 political clips"
                                meta="Engagement signal"
                                interpretation="Increase political content with similar viewpoints."
                                tint="green"
                                delay={0.3}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={Eye}
                                title="Rewatched beauty ad"
                                meta="Completion: 100%"
                                interpretation="Show additional beauty, lifestyle, and product-focused content."
                                tint="blue"
                                delay={0.4}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={Clock}
                                title="Paused on anxiety content"
                                meta="Dwell time: 18s"
                                interpretation="Increase emotional-support and anxiety-related content."
                                tint="green"
                                delay={0.5}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={Bookmark}
                                title="Saved relationship advice clip"
                                meta="Strong intent"
                                interpretation="Recommend more relationship, dating, and attachment-related content."
                                tint="blue"
                                delay={0.6}
                                heightClass={cardHeight}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeedItem = ({ icon: Icon, label, sub, tint, heightClass }) => {
    const bgColor = tint === 'blue' ? 'bg-[#EBF2FF]' : 'bg-[#E6FCF4]';
    const iconColor = tint === 'blue' ? 'bg-primary-blue/10 text-primary-blue' : 'bg-accent-green/10 text-accent-green';

    return (
        <div className={`${bgColor} ${heightClass} p-3.5 rounded-2xl shadow-sm border border-border-light flex items-center gap-3.5`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col justify-center">
                <div className="text-sm font-bold text-text-main">{label}</div>
                <div className="text-xs text-text-muted">{sub}</div>
            </div>
        </div>
    );
};

const SignalItem = ({ icon: Icon, title, meta, interpretation, tint, delay, heightClass }) => {
    const bgColor = tint === 'blue' ? 'bg-[#EBF2FF]' : 'bg-[#E6FCF4]';
    const iconColor = tint === 'blue' ? 'bg-primary-blue/10 text-primary-blue group-hover:bg-primary-blue group-hover:text-white' : 'bg-accent-green/10 text-accent-green group-hover:bg-accent-green group-hover:text-white';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className={`flex items-start gap-4 group p-4 rounded-2xl ${bgColor} ${heightClass}`}
        >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${iconColor}`}>
                <Icon size={19} />
            </div>
            <div className="flex flex-col justify-center flex-1">
                <div className="text-base font-bold text-text-main leading-tight">{title}</div>
                <div className="text-sm text-text-muted font-medium mt-1">{meta}</div>
                <div className="text-sm text-primary-blue/90 mt-1.5 font-medium italic">{interpretation}</div>
            </div>
        </motion.div>
    );
};

export default SectionTracking;
