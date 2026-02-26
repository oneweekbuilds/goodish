import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Youtube, Twitter, Music } from 'lucide-react';

const SocialTile = ({ icon: Icon, label, color, glowColor }) => (
    <motion.button
        whileHover={{
            y: -6,
            scale: 1.02,
            boxShadow: `0 26px 70px ${glowColor}`
        }}
        whileTap={{ scale: 0.98 }}
        className="w-28 h-28 md:w-36 md:h-36 rounded-radius-lg bg-surface-default shadow-soft flex flex-col items-center justify-center gap-4 border border-border-subtle group transition-all duration-300"
    >
        <Icon className={`w-8 h-8 md:w-10 md:h-10 ${color} transition-transform duration-300 group-hover:scale-110`} />
        <span className="text-xs md:text-sm font-medium text-text-muted group-hover:text-text-main transition-colors duration-300">{label}</span>
    </motion.button>
);

const ConnectFeedsSection = () => {
    return (
        <section className="w-full py-32 bg-bg-page text-center">
            <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-4xl font-bold text-text-main mb-4">Ready to see your profile?</h2>
                <p className="text-text-muted mb-16 max-w-xl mx-auto text-lg leading-relaxed">
                    Link your feeds to generate your AlgorithmLens dashboard.
                    <br className="hidden md:block" />
                    Read-only access. We never post on your behalf.
                </p>

                <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                    <SocialTile
                        icon={Music}
                        label="TikTok"
                        color="text-[#ff0050]"
                        glowColor="rgba(255, 0, 80, 0.15)"
                    />
                    <SocialTile
                        icon={Instagram}
                        label="Instagram"
                        color="text-[#E1306C]"
                        glowColor="rgba(225, 48, 108, 0.15)"
                    />
                    <SocialTile
                        icon={Youtube}
                        label="YouTube"
                        color="text-[#FF0000]"
                        glowColor="rgba(255, 0, 0, 0.15)"
                    />
                    <SocialTile
                        icon={Twitter}
                        label="X / Twitter"
                        color="text-black"
                        glowColor="rgba(0, 0, 0, 0.1)"
                    />
                </div>
            </div>
        </section>
    );
};

export default ConnectFeedsSection;
