import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const profiles = [
    {
        id: 'jordan',
        name: 'Jordan M.',
        descriptor: 'Stressed grad student trying to stay afloat.',
        avatar: '/avatar-jordan-new.jpg',
        accent: 'blue',
        story: 'Jordan checks news and productivity hacks between classes. Late-night scrolling signals stress and urgency. The algorithm assumes he thrives on pressure.',
        tags: ['Stressed Student', 'Productivity Chaser', 'Night Owl'],
        columns: [
            {
                title: 'Signals',
                items: ['Lingers on crisis headlines', 'Watches grind videos fully', 'Scrolls late at night']
            },
            {
                title: 'Feed shifts',
                items: ['More urgency-driven posts', 'More pressure-based advice', 'Ads for focus boosters']
            },
            {
                title: 'Why it matters',
                items: ['Stress feels “normal”', 'The feed reinforces pressure']
            }
        ]
    },
    {
        id: 'maya',
        name: 'Maya R.',
        descriptor: 'Wellness-focused and striving for balance.',
        avatar: '/avatar-maya-new.jpg',
        accent: 'green',
        story: 'Maya loves routines and healthy tips. The app misreads this as perfectionism.',
        tags: ['Wellness', 'Routine-Seeker', 'Body-Aware'],
        columns: [
            {
                title: 'Signals',
                items: ['Saves strict wellness posts', 'Rewatches ideal routines', 'Skips rest-centered content']
            },
            {
                title: 'Feed shifts',
                items: ['More extreme health tips', 'More comparison content', 'Supplement/detox ads']
            },
            {
                title: 'Why it matters',
                items: ['Balance gets lost', '“Healthy” starts to feel rigid']
            }
        ]
    },
    {
        id: 'alexandra',
        name: 'Alexandra K.',
        descriptor: 'Late-night scroller looking for comfort.',
        avatar: '/avatar-alexandra-new.jpg',
        accent: 'blue',
        story: 'Alexandra watches emotional videos in bed; the algorithm amplifies intensity.',
        tags: ['Emotion-Sensitive', 'Drama Watcher', 'Night Scroller'],
        columns: [
            {
                title: 'Signals',
                items: ['Watches emotional clips fully', 'Replays stress content', 'Ignores calming posts']
            },
            {
                title: 'Feed shifts',
                items: ['More drama-heavy posts', 'More high-intensity creators', 'Ads for sleep/mood fixes']
            },
            {
                title: 'Why it matters',
                items: ['Harder to unwind', 'Nights feel overstimulating']
            }
        ]
    },
    {
        id: 'luis',
        name: 'Luis G.',
        descriptor: 'Casual shopper without realizing it.',
        avatar: '/avatar-luis-fixed.png',
        accent: 'green',
        story: 'Luis taps tech, sneakers, and gadgets “just to look.” The app sees buying potential.',
        tags: ['Deal Seeker', 'Gadget Curious', 'Ad-Responsive'],
        columns: [
            {
                title: 'Signals',
                items: ['Opens product pages often', 'Watches reviews fully', 'Saves sale posts']
            },
            {
                title: 'Feed shifts',
                items: ['More sponsored posts', 'More retargeted ads', 'More shopping creators']
            },
            {
                title: 'Why it matters',
                items: ['Shopping becomes default', 'Ads blend into content']
            }
        ]
    }
];

const HeroDashboardPreview = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % profiles.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % profiles.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
    };

    const currentProfile = profiles[currentIndex];
    const isBlue = currentProfile.accent === 'blue';
    const accentColor = isBlue ? '#2563EB' : '#10B981';
    const bgColor = isBlue ? 'rgba(37, 99, 235, 0.07)' : 'rgba(16, 185, 129, 0.07)';

    return (
        <section className="py-24 bg-bg-page overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-4">AlgorithmLens breaks the cycle.</h2>
                </div>

                {/* Carousel Container */}
                <div
                    className="relative max-w-5xl mx-auto"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    tabIndex={0}
                >
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                        {/* Left Arrow */}
                        <button
                            onClick={handlePrev}
                            className="hidden md:flex w-12 h-12 rounded-full bg-white border border-border-light shadow-soft items-center justify-center text-text-muted hover:text-primary-blue hover:border-primary-blue transition-all shrink-0 z-10"
                            aria-label="Previous profile"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* Profile Card */}
                        <div className="w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentProfile.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-[32px] p-8 md:p-10 shadow-strong border transition-colors duration-300"
                                    style={{
                                        backgroundColor: bgColor,
                                        borderColor: accentColor
                                    }}
                                >
                                    {/* Header: Avatar + Name + Story */}
                                    <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
                                        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                            <img
                                                src={currentProfile.avatar}
                                                alt={currentProfile.name}
                                                className="w-full h-full object-cover object-top"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-baseline gap-3 mb-2">
                                                <h3 className="text-2xl font-bold text-text-main">{currentProfile.name}</h3>
                                                <span className="text-text-muted italic">{currentProfile.descriptor}</span>
                                            </div>
                                            <p className="text-lg text-text-main leading-relaxed mb-4">
                                                {currentProfile.story}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {currentProfile.tags.map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1 rounded-full text-sm font-semibold border bg-white/50"
                                                        style={{
                                                            borderColor: accentColor,
                                                            color: accentColor
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3 Columns Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-black/5">
                                        {currentProfile.columns.map((col, i) => (
                                            <div key={i}>
                                                <h4
                                                    className="text-sm font-bold uppercase tracking-wide mb-3"
                                                    style={{ color: accentColor }}
                                                >
                                                    {col.title}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {col.items.map((item, j) => (
                                                        <li key={j} className="text-sm text-text-main font-medium leading-relaxed">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Right Arrow */}
                        <button
                            onClick={handleNext}
                            className="hidden md:flex w-12 h-12 rounded-full bg-white border border-border-light shadow-soft items-center justify-center text-text-muted hover:text-primary-blue hover:border-primary-blue transition-all shrink-0 z-10"
                            aria-label="Next profile"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Mobile Arrows */}
                    <div className="flex md:hidden justify-center gap-4 mt-6">
                        <button
                            onClick={handlePrev}
                            className="w-12 h-12 rounded-full bg-white border border-border-light shadow-soft flex items-center justify-center text-text-muted hover:text-primary-blue"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="w-12 h-12 rounded-full bg-white border border-border-light shadow-soft flex items-center justify-center text-text-muted hover:text-primary-blue"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroDashboardPreview;
