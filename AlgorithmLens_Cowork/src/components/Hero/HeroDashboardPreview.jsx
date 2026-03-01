import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const profiles = [
    {
        id: 'jordan',
        name: 'Jordan M.',
        descriptor: 'Grad student scrolling between classes.',
        avatar: '/avatar-jordan-new.jpg',
        accent: 'blue',
        story: 'Jordan\'s feed is 68% news and productivity content. Stress-related topics appeared in 4 out of 5 scans. Late-night browsing sessions show a different content mix than daytime.',
        tags: ['News & Current Events', 'Productivity', 'Late-Night Content'],
        columns: [
            {
                title: 'What appeared',
                items: ['Crisis headlines: 23% of feed', 'Productivity content: 31%', 'Late-night sessions: different mix']
            },
            {
                title: 'Feed composition',
                items: ['Urgency-themed posts frequent', 'Stress-related ads present', 'Few calming/rest topics']
            },
            {
                title: 'What to notice',
                items: ['Stress topics are concentrated', 'Content mix shifts by time of day']
            }
        ]
    },
    {
        id: 'maya',
        name: 'Maya R.',
        descriptor: 'Wellness-focused and striving for balance.',
        avatar: '/avatar-maya-new.jpg',
        accent: 'green',
        story: 'Maya\'s feed is 54% wellness and fitness content. Supplement and detox ads make up 18% of all ads shown. Content variety narrowed over her last 3 scans.',
        tags: ['Wellness & Health', 'Fitness', 'Self-Care'],
        columns: [
            {
                title: 'What appeared',
                items: ['Wellness content: 54% of feed', 'Health product ads: 18% of ads', 'Variety narrowed over 3 scans']
            },
            {
                title: 'Feed composition',
                items: ['Extreme health tips increasing', 'Body comparison content present', 'Supplement ads frequent']
            },
            {
                title: 'What to notice',
                items: ['Feed is narrowing over time', 'Ads align closely with content topics']
            }
        ]
    },
    {
        id: 'alexandra',
        name: 'Alexandra K.',
        descriptor: 'Late-night scroller looking for comfort.',
        avatar: '/avatar-alexandra-new.jpg',
        accent: 'blue',
        story: 'Alexandra\'s evening feed is 72% entertainment and emotional content. High-intensity posts appear more frequently than calming ones. 3 creators make up 40% of her feed.',
        tags: ['Entertainment', 'Emotional Content', 'Late-Night'],
        columns: [
            {
                title: 'What appeared',
                items: ['Emotional content: 72% of feed', 'High-intensity posts dominant', 'Top 3 creators: 40% of content']
            },
            {
                title: 'Feed composition',
                items: ['Drama-heavy posts frequent', 'Calming content: under 5%', 'Sleep/mood product ads present']
            },
            {
                title: 'What to notice',
                items: ['High-intensity content concentrated', 'Few creators dominate the feed']
            }
        ]
    },
    {
        id: 'luis',
        name: 'Luis G.',
        descriptor: 'Casual browser with a product-heavy feed.',
        avatar: '/avatar-luis-fixed.png',
        accent: 'green',
        story: 'Luis\'s feed is 41% product and shopping content. Sponsored posts make up 28% of all content shown. Tech and sneaker creators appear most frequently.',
        tags: ['Shopping & Deals', 'Technology', 'Product Reviews'],
        columns: [
            {
                title: 'What appeared',
                items: ['Product content: 41% of feed', 'Sponsored posts: 28%', 'Tech/sneaker creators dominate']
            },
            {
                title: 'Feed composition',
                items: ['Retargeted ads frequent', 'Shopping creators prominent', 'Non-commercial content: 31%']
            },
            {
                title: 'What to notice',
                items: ['Ads and organic content look similar', 'Product topics dominate the feed']
            }
        ]
    }
];

const HeroDashboardPreview = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    // Auto-rotation interval effect
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % profiles.length);
            setProgress(0);
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused]);

    // Progress bar animation effect
    useEffect(() => {
        if (isPaused) return;
        const startTime = Date.now();
        const animationInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / 5000) * 100, 100);
            setProgress(newProgress);
        }, 16); // ~60fps
        return () => clearInterval(animationInterval);
    }, [currentIndex, isPaused]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % profiles.length);
        setProgress(0);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
        setProgress(0);
    };

    const handleDotClick = (index) => {
        setCurrentIndex(index);
        setProgress(0);
    };

    const handleDotKeyDown = (index, e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const newIndex = (index - 1 + profiles.length) % profiles.length;
            setCurrentIndex(newIndex);
            setProgress(0);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const newIndex = (index + 1) % profiles.length;
            setCurrentIndex(newIndex);
            setProgress(0);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCurrentIndex(index);
            setProgress(0);
        }
    };

    const currentProfile = profiles[currentIndex];
    const isBlue = currentProfile.accent === 'blue';
    const accentColor = isBlue ? '#2563EB' : '#10B981';
    const bgColor = isBlue ? 'rgba(37, 99, 235, 0.07)' : 'rgba(16, 185, 129, 0.07)';

    return (
        <section className="py-24 bg-bg-page overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-4">AlgorithmLens shows you the patterns in your feed composition.</h2>
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
                                    className="rounded-[24px] p-6 sm:p-8 md:p-10 shadow-strong border transition-colors duration-300"
                                    style={{
                                        backgroundColor: bgColor,
                                        borderColor: accentColor
                                    }}
                                >
                                    {/* Header: Avatar + Name + Story */}
                                    <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
                                        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm ring-4 ring-white shadow-md">
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

                                    {/* 3 Columns Grid - Responsive spacing */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 pt-6 border-t border-black/5">
                                        {currentProfile.columns.map((col, i) => (
                                            <div
                                                key={i}
                                                className={i < 2 ? 'border-r border-slate-200' : ''}
                                            >
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

                            {/* Progress Bar */}
                            <div className="h-0.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="h-full bg-primary-blue transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Navigation Dots */}
                            <div className="flex justify-center gap-3 mt-6" role="tablist" aria-label="Profile carousel">
                                {profiles.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleDotClick(index)}
                                        onKeyDown={(e) => handleDotKeyDown(index, e)}
                                        className={`w-3 h-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 ${
                                            index === currentIndex ? 'bg-primary-blue' : 'bg-slate-300'
                                        }`}
                                        role="tab"
                                        aria-selected={index === currentIndex}
                                        aria-label={`Go to profile ${index + 1} of ${profiles.length}`}
                                        tabIndex={index === currentIndex ? 0 : -1}
                                    />
                                ))}
                            </div>
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
