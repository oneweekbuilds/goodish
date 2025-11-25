import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface InsightChipProps {
    category: string;
    text: string;
    className?: string;
}

export function InsightChip({ category, text, className }: InsightChipProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
                "relative flex flex-col gap-1 p-4 rounded-card w-64",
                "bg-white/90 backdrop-blur-md border border-white/60 shadow-insight",
                "before:absolute before:inset-0 before:rounded-card before:p-[1px] before:bg-gradient-to-br before:from-primary-teal/30 before:to-primary-indigo/30 before:-z-10 before:content-['']",
                className
            )}
        >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-card bg-gradient-to-br from-primary-teal/5 to-primary-indigo/5 blur-xl -z-20" />

            {/* Category Tag */}
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-teal animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-graphite/60">
                    {category}
                </span>
            </div>

            {/* Insight Text */}
            <p className="text-sm font-medium text-neutral-graphite leading-relaxed">
                {text}
            </p>
        </motion.div>
    );
}
