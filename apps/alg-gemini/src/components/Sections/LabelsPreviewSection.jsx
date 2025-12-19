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
        <section className="py-24 bg-bg-page overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 text-center mb-14">
                <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-6">Platforms may assign hidden content labels.</h2>
                <p className="text-lg text-text-muted max-w-2xl mx-auto">
                    From thousands of tiny signals, algorithms may group users into categories that influence what content appears next.
                </p>
            </div>

            <div className="relative w-full flex flex-col items-center gap-8">
                {/* Scrolling Row */}
                <div className="flex gap-6 animate-scroll-slow hover:pause w-max">
                    {[...labels, ...labels].map((label, index) => (
                        <motion.div
                            key={`l-${index}`}
                            whileHover={{ y: -4, scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}
                            className={`px-8 py-4 rounded-full bg-white shadow-soft border-2 text-text-main font-semibold text-sm cursor-default transition-all duration-300 ${index % 2 === 0 ? 'border-primary-blue/40 hover:border-primary-blue' : 'border-accent-green/40 hover:border-accent-green'
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
