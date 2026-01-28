import React from 'react';
import { motion } from 'framer-motion';

const LabelsPreviewSection = () => {
    const labels = [
        "Left-Leaning", "Climate Conscious", "Social Justice", "Urban Progressive",
        "High Anxiety", "Validation Seeking", "Impulse Buyer", "Night Owl",
        "Wellness Enthusiast", "Tech Early Adopter", "True Crime Fan", "Crypto Curious",
        "Doomscroller", "Video Heavy", "High Engagement", "Ad Receptive"
    ];

    return (
        <section className="py-12 sm:py-24 bg-bg-page overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-10 sm:mb-14">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 sm:mb-6">Algorithms infer hidden labels about you.</h2>
                <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-2">
                    From thousands of tiny signals, algorithms build a portrait of who you are — categorizing you into clusters that determine what you see next.
                </p>
            </div>

            <div className="relative w-full flex flex-col items-center gap-6 sm:gap-8">
                {/* Scrolling Row */}
                <div className="flex gap-3 sm:gap-6 animate-scroll-slow hover:pause w-max">
                    {[...labels, ...labels].map((label, index) => (
                        <motion.div
                            key={`l-${index}`}
                            whileHover={{ y: -4, scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}
                            className={`px-5 sm:px-8 py-2.5 sm:py-4 rounded-full bg-white shadow-soft border-2 text-text-main font-semibold text-xs sm:text-sm cursor-default transition-all duration-300 ${index % 2 === 0 ? 'border-primary-blue/40 hover:border-primary-blue' : 'border-accent-green/40 hover:border-accent-green'
                                }`}
                        >
                            {label}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LabelsPreviewSection;
