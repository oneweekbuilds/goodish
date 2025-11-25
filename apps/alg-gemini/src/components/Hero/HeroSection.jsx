import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';

const HeroSection = () => {
    return (
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-20 pb-12 bg-bg-page overflow-hidden">

            {/* Soft Radial Gradient - No Blur */}
            <div className="absolute inset-0 pointer-events-none z-0 flex justify-center items-center">
                <div className="w-[800px] h-[800px] bg-gradient-radial from-primary-blue/5 to-transparent rounded-full opacity-60" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-6xl mx-auto text-center px-6 flex flex-col items-center">

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-text-main mb-8 leading-[1.1]"
                >
                    See how the
                    <br />
                    <span className="whitespace-nowrap tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                        <span className="text-primary-blue">algorithms</span> <span className="text-accent-green">see you.</span>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
                >
                    Algorithms shape what you see, think, and do. AlgorithmLens reveals the hidden profile guiding your feed so you can reclaim clarity, awareness, and control.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <button className="group relative px-8 py-4 bg-primary-blue text-white rounded-full font-semibold text-lg shadow-glow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
                        Reveal My Profile
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 text-text-muted/50 animate-bounce"
            >
                <ChevronDown size={24} />
            </motion.div>

        </section>
    );
};

export default HeroSection;
