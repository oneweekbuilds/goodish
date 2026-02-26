import React from 'react';
import { motion } from 'framer-motion';

const LabelsPreviewSection = () => {
    const labels = [
        { text: "Tech early adopter", color: "blue" },
        { text: "Climate-aware", color: "green" },
        { text: "Likely interested in politics", color: "blue" },
        { text: "Fitness-motivated", color: "green" },
        { text: "News follower", color: "blue" },
        { text: "Finance-focused", color: "green" },
        { text: "Price-conscious shopper", color: "blue" },
        { text: "Probably a night owl", color: "green" },
        { text: "Self-improvement seeker", color: "blue" },
        { text: "Entertainment-driven", color: "green" },
        { text: "Drawn to emotional content", color: "blue" },
        { text: "Crypto-curious", color: "green" },
        { text: "Home cook", color: "blue" },
        { text: "Video-first consumer", color: "green" },
        { text: "Sports fan", color: "blue" },
        { text: "Brand-receptive", color: "green" },
    ];

    const colorStyles = {
        blue: "bg-gradient-to-r from-blue-50 to-blue-100/60 border-blue-300 text-blue-800 hover:shadow-blue-200/60 hover:border-blue-400 hover:from-blue-100 hover:to-blue-200/60",
        green: "bg-gradient-to-r from-emerald-50 to-emerald-100/60 border-emerald-300 text-emerald-800 hover:shadow-emerald-200/60 hover:border-emerald-400 hover:from-emerald-100 hover:to-emerald-200/60",
    };

    const dotColors = {
        blue: "bg-blue-400",
        green: "bg-emerald-400",
    };

    return (
        <section className="py-12 sm:py-24 bg-bg-page overflow-hidden" aria-labelledby="labels-heading" role="region">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-10 sm:mb-14">
                <h2 id="labels-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 sm:mb-6">This is how the algorithm sees you.</h2>
                <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-2">
                    Based on your scrolling behavior, here are the categories the algorithm likely puts you in.
                </p>
            </div>

            <div className="relative w-full flex flex-col items-center gap-6 sm:gap-8">
                {/* Scrolling Row Container with Gradient Masks */}
                <div className="relative w-full overflow-hidden">
                    {/* Left Gradient Mask */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-r from-bg-page to-transparent z-10 pointer-events-none"></div>

                    {/* Right Gradient Mask */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 md:w-24 bg-gradient-to-l from-bg-page to-transparent z-10 pointer-events-none"></div>

                    {/* Scrolling Row */}
                    <div className="flex gap-3 sm:gap-5 animate-scroll-slow hover:pause w-max">
                        {[...labels, ...labels].map((label, index) => (
                            <motion.div
                                key={`l-${index}`}
                                whileHover={{ y: -5, scale: 1.06 }}
                                className={`px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full border-[1.5px] font-semibold text-xs sm:text-sm cursor-default transition-all duration-300 hover:shadow-lg flex items-center gap-2.5 ${colorStyles[label.color]}`}
                            >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColors[label.color]}`}></span>
                                {label.text}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LabelsPreviewSection;
