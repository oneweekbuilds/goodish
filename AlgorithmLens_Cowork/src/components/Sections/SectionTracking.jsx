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

    const cardHeight = "h-[120px]";

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
                        Platforms record more than you realize.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-2"
                    >
                        Every scroll, pause, and tap trains the algorithm to keep you engaged.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start relative">

                    {/* Left: Phone Mockup with Header */}
                    <div className="relative mx-auto lg:mx-0 order-1 flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-6 text-center"
                        >
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-main mb-2">Your Feeds</h3>
                            <p className="text-xs sm:text-sm text-text-muted px-2">Your feed reflects patterns in your activity</p>
                        </motion.div>

                        <div className="flex justify-center px-4 sm:px-0">
                            <motion.div
                                className="relative z-10 w-full sm:w-[340px] max-w-[340px] bg-bg-page rounded-[48px] shadow-strong border-[5px] border-gray-900 overflow-hidden flex flex-col"
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

                                {/* Feed Content */}
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
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-6 text-center"
                        >
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-main mb-2">Signals Extracted</h3>
                            <p className="text-xs sm:text-sm text-text-muted px-2">Behavioral signals recorded from your activity</p>
                        </motion.div>

                        <div className="space-y-3.5" style={{ marginTop: '72px' }}>
                            <SignalItem
                                icon={Clock}
                                title="Paused on fitness content"
                                meta="Dwell time: 12s"
                                interpretation="Logged as a dwell-time signal on self-improvement content."
                                tint="blue"
                                delay={0.2}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={ThumbsUp}
                                title="Liked 2 political clips"
                                meta="Engagement signal"
                                interpretation="Recorded as engagement with political content."
                                tint="green"
                                delay={0.3}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={Eye}
                                title="Rewatched beauty ad"
                                meta="Completion: 100%"
                                interpretation="Full view registered on a beauty and lifestyle ad."
                                tint="blue"
                                delay={0.4}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={Clock}
                                title="Paused on anxiety content"
                                meta="Dwell time: 18s"
                                interpretation="Logged as extended dwell time on emotional-support content."
                                tint="green"
                                delay={0.5}
                                heightClass={cardHeight}
                            />
                            <SignalItem
                                icon={Bookmark}
                                title="Saved relationship advice clip"
                                meta="Strong intent"
                                interpretation="Save action recorded on relationship content."
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

const feedTints = {
    blue: { icon: 'bg-blue-100 text-blue-600', border: 'border-blue-100' },
    green: { icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
};

const FeedItem = ({ icon: Icon, label, sub, tint, heightClass }) => {
    const colors = feedTints[tint] || feedTints.blue;

    return (
        <div className={`bg-white ${heightClass} p-3.5 rounded-2xl shadow-sm border ${colors.border} flex items-center gap-3.5`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col justify-center">
                <div className="text-sm font-bold text-text-main">{label}</div>
                <div className="text-xs text-text-muted">{sub}</div>
            </div>
        </div>
    );
};

const signalTints = {
    blue: {
        card: 'bg-gradient-to-r from-blue-50/80 to-white border-l-[3px] border-l-blue-400 border border-blue-100/60',
        icon: 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white',
        interpretation: 'text-blue-600/80',
    },
    green: {
        card: 'bg-gradient-to-r from-emerald-50/80 to-white border-l-[3px] border-l-emerald-400 border border-emerald-100/60',
        icon: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white',
        interpretation: 'text-emerald-600/80',
    },
};

const SignalItem = ({ icon: Icon, title, meta, interpretation, tint, delay, heightClass }) => {
    const colors = signalTints[tint] || signalTints.blue;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className={`flex items-start gap-4 group p-4 rounded-2xl ${colors.card} ${heightClass} hover:shadow-md transition-all duration-300`}
        >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${colors.icon}`}>
                <Icon size={19} />
            </div>
            <div className="flex flex-col justify-center flex-1">
                <div className="text-base font-bold text-text-main leading-tight">{title}</div>
                <div className="text-sm text-text-muted font-medium mt-1">{meta}</div>
                <div className={`text-sm mt-1.5 font-medium italic ${colors.interpretation}`}>{interpretation}</div>
            </div>
        </motion.div>
    );
};

export default SectionTracking;
