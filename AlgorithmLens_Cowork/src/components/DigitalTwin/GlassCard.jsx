import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = "" }) => {
    return (
        <div className={`bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-3xl p-8 ${className}`}>
            {children}
        </div>
    );
};

export default GlassCard;
