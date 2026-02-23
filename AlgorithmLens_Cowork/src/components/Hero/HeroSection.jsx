import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Monitor, Smartphone } from 'lucide-react';
import { isComingSoon } from '../../config/comingSoon';

const HeroSection = () => {
    const navigate = useNavigate();
    const comingSoonMode = isComingSoon();
    const [showScrollHint, setShowScrollHint] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setShowScrollHint(false);
            } else {
                setShowScrollHint(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCTAClick = () => {
        if (comingSoonMode) {
            const waitlistBlock = document.getElementById('waitlist');
            if (waitlistBlock) {
                waitlistBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            navigate('/start');
        }
    };

    return (
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-24 sm:pt-20 pb-12 bg-bg-page overflow-hidden">

            {/* Soft Radial Gradient */}
            <div className="absolute inset-0 pointer-events-none z-0 flex justify-center items-center">
                <div className="w-[800px] h-[800px] bg-gradient-radial from-primary-blue/8 to-transparent rounded-full opacity-60" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6 flex flex-col items-center">

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-text-main mb-6 sm:mb-8 leading-[1.1] max-w-full"
                >
                    <span className="font-bold">See what your algorithm</span>
                    <br />
                    <span className="block sm:inline whitespace-normal sm:whitespace-nowrap tracking-tight-hero font-extrabold">
                        <span className="text-primary-blue">actually</span> <span className="text-accent-green">shows you.</span>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-base sm:text-lg md:text-xl text-text-muted mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed font-medium px-2"
                >
                    AlgorithmLens scans your social media feed and breaks down exactly what's in it — how many ads, what topics dominate, which posts are suggested by the algorithm vs. accounts you follow. No guessing, just the data.
                </motion.p>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="text-sm font-semibold text-text-main mb-8 sm:mb-10"
                >
                    Works with TikTok, Instagram, YouTube, X, Facebook, LinkedIn, and Reddit.
                </motion.p>

                {/* Primary CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex flex-col items-center gap-4"
                >
                    <button
                        onClick={handleCTAClick}
                        className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-primary-blue text-white rounded-full font-semibold text-base sm:text-lg shadow-glow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 max-w-full"
                    >
                        {comingSoonMode ? 'Join the Waitlist' : 'Start a Scan — It\'s Free'}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </button>
                    {!comingSoonMode && (
                        <p className="text-sm text-text-muted">
                            Free forever. <button onClick={() => navigate('/plus')} className="text-primary-blue font-medium hover:underline transition-all">Upgrade to Plus</button> for trends and deeper analysis.
                        </p>
                    )}
                </motion.div>

                {/* Install paths — Chrome Extension + Mobile App */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-6"
                >
                    <a
                        href="https://chrome.google.com/webstore"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-border-light rounded-full text-sm font-medium text-text-main hover:border-primary-blue/40 hover:bg-primary-blue/5 transition-all"
                    >
                        <Monitor size={16} className="text-primary-blue" aria-hidden="true" />
                        Install Chrome Extension
                    </a>
                    <a
                        href="https://apps.apple.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-border-light rounded-full text-sm font-medium text-text-main hover:border-accent-green/40 hover:bg-accent-green/5 transition-all"
                    >
                        <Smartphone size={16} className="text-accent-green" aria-hidden="true" />
                        Download Mobile App
                    </a>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <div className={`${showScrollHint ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-text-muted/50 motion-safe:animate-bounce"
                >
                    <ChevronDown size={24} aria-hidden="true" />
                </motion.div>
            </div>

        </section>
    );
};

export default HeroSection;
