import React from "react";
import { cn } from "../../lib/utils";
import { Sparkles } from "lucide-react";

interface InsightPopoverProps extends React.HTMLAttributes<HTMLDivElement> {
    insight: string;
    isVisible?: boolean;
}

/**
 * InsightPopover - Floating algorithm insight chip
 * 
 * Features:
 * - Pill-shaped design with soft gradient background
 * - Glassmorphism (backdrop blur)
 * - Micro-animations (fade + rise on appearance)
 * - Compact, professional aesthetic
 */
export const InsightPopover = React.forwardRef<HTMLDivElement, InsightPopoverProps>(
    ({ className, insight, isVisible = true, ...props }, ref) => {
        if (!isVisible) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-pill border border-white/30",
                    "bg-gradient-to-r from-secondary-mint/90 via-primary-teal/80 to-primary-indigo/90",
                    "backdrop-blur-md shadow-insight",
                    "px-5 py-3 max-w-[288px]",
                    "transition-all duration-300 animate-slide-in-right",
                    "hover:scale-105",
                    className
                )}
                style={{
                    willChange: 'transform, opacity',
                }}
                {...props}
            >
                <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3 h-3 text-white/90" />
                        <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/90">
                            Algorithm Insight
                        </p>
                    </div>
                    <p className="text-sm font-sans font-medium text-white leading-relaxed">
                        {insight}
                    </p>
                </div>
            </div>
        );
    }
);

InsightPopover.displayName = "InsightPopover";
