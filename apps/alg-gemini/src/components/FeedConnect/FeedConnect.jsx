import React from 'react';
import { Instagram, Youtube, Twitter } from 'lucide-react';

const TikTokIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 1 0 7.73 6.61V6.8c.81.21 1.67.33 2.56.33v-3.9a8.9 8.9 0 0 1-1.06-.54z" />
    </svg>
);

const SocialButton = ({ icon: Icon, label, colorClass, glowClass }) => {
    return (
        <button className="group relative flex flex-col items-center justify-center w-24 h-24 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg transition-all duration-300 hover:scale-110 border border-white/60">
            {/* Specific Glow Effect on Hover */}
            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10 ${glowClass}`} />

            <div className={`p-0 transition-colors duration-300 ${colorClass}`}>
                <Icon className="w-10 h-10" />
            </div>
        </button>
    );
};

const FeedConnect = () => {
    return (
        <section className="w-full py-32 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-8">
                    Connect Your Feeds.
                </h2>
                <p className="text-xl text-gray-600 mb-20 max-w-2xl mx-auto font-medium">
                    Securely link your accounts to generate your algorithmic profile.
                </p>

                <div className="flex justify-center gap-8 max-w-4xl mx-auto flex-wrap">
                    <SocialButton
                        icon={TikTokIcon}
                        label="TikTok"
                        colorClass="text-[#ff0050]"
                        glowClass="shadow-cyan-500/50 bg-cyan-400/20"
                    />
                    <SocialButton
                        icon={Instagram}
                        label="Instagram"
                        colorClass="text-[#E1306C]"
                        glowClass="shadow-purple-500/50 bg-purple-400/20"
                    />
                    <SocialButton
                        icon={Youtube}
                        label="YouTube"
                        colorClass="text-[#FF0000]"
                        glowClass="shadow-red-500/50 bg-red-400/20"
                    />
                    <SocialButton
                        icon={Twitter}
                        label="X"
                        colorClass="text-black"
                        glowClass="shadow-gray-500/50 bg-gray-400/20"
                    />
                </div>
            </div>
        </section>
    );
};

export default FeedConnect;
