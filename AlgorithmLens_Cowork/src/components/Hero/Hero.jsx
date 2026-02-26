import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Heart, Flag, Shield, Zap, Eye } from 'lucide-react';

const Hero = () => {
    return (
        <section className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden pt-20">

            {/* Background Orbs (The 'Glow') */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-[-100px] w-[500px] h-[500px] bg-purple-300/30 blur-[100px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-0 right-[-100px] w-[400px] h-[400px] bg-blue-300/30 blur-[100px] rounded-full" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-6 mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
                        See the You that <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">AI Sees.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        The Spotify Wrapped for your algorithm. Discover your inferred digital labels.
                    </p>

                    <button aria-label="Reveal your algorithmic profile" className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xl font-bold rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 ring-4 ring-white/50">
                        Reveal My Profile
                        <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </motion.div>
            </div>

            {/* Floating Icons System */}
            <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
                {/* Icon 1: Top Left */}
                <motion.div
                    animate={{ y: ["0%", "-10%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                    className="absolute top-[20%] left-[15%]"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center transform rotate-6">
                        <Tag className="w-8 h-8 text-blur-orange" />
                    </div>
                </motion.div>

                {/* Icon 2: Top Right */}
                <motion.div
                    animate={{ y: ["0%", "-10%", "0%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-[25%] right-[15%]"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center transform rotate-6">
                        <Heart className="w-8 h-8 text-red-500" />
                    </div>
                </motion.div>

                {/* Icon 3: Bottom Left */}
                <motion.div
                    animate={{ y: ["0%", "-10%", "0%"] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-[20%] left-[20%]"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center transform rotate-6">
                        <Flag className="w-8 h-8 text-blue-600" />
                    </div>
                </motion.div>

                {/* Icon 4: Bottom Right */}
                <motion.div
                    animate={{ y: ["0%", "-10%", "0%"] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute bottom-[25%] right-[20%]"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center transform rotate-6">
                        <Zap className="w-8 h-8 text-green-500" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
