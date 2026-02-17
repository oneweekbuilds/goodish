import React from 'react';
import { motion } from 'framer-motion';

const FloatingIcon = ({ children, delay = 0, className = "" }) => {
    return (
        <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: delay,
            }}
            className={`absolute flex items-center justify-center p-4 bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-sm ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default FloatingIcon;
