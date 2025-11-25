import React from "react";
import { cn } from "../../lib/utils";

interface LensGlowProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg" | "xl";
    variant?: "default" | "mint" | "indigo" | "lavender";
    opacity?: "low" | "medium" | "high";
    vignette?: boolean;
}

/**
 * LensGlow - Atmospheric glow effect component
 * 
 * Enhanced with:
 * - Improved teal→indigo→mint gradient transitions
 * - Opacity controls: low (30%), medium (40%), high (50%)
 * - Enhanced blur ranges for more atmospheric effect
 * - Optional vignette fade
 * - Performance optimizations (transform, will-change)
 */
export const LensGlow = React.forwardRef<HTMLDivElement, LensGlowProps>(
    ({ className, size = "md", variant = "default", opacity = "medium", vignette = false, ...props }, ref) => {
        const sizes = {
            sm: "w-32 h-32 blur-2xl",
            md: "w-64 h-64 blur-3xl",
            lg: "w-96 h-96 blur-[80px]",
            xl: "w-[800px] h-[800px] blur-[120px]",
        };

        const opacityLevels = {
            low: "opacity-30",
            medium: "opacity-40",
            high: "opacity-50",
        };

        const variants = {
            default: "bg-gradient-to-br from-secondary-mint/60 via-primary-teal/50 to-primary-indigo/40",
            mint: "bg-gradient-to-br from-secondary-mint/70 via-primary-teal/40 to-transparent",
            indigo: "bg-gradient-to-br from-primary-indigo/60 via-secondary-lavender/30 to-transparent",
            lavender: "bg-gradient-to-br from-secondary-lavender/50 via-primary-indigo/30 to-secondary-mint/20",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "absolute rounded-full pointer-events-none",
                    sizes[size],
                    variants[variant],
                    opacityLevels[opacity],
                    vignette && "before:absolute before:inset-0 before:rounded-full before:bg-gradient-radial before:from-transparent before:to-white/20",
                    className
                )}
                style={{
                    willChange: 'transform, opacity',
                    mixBlendMode: 'multiply',
                }}
                {...props}
            />
        );
    }
);

LensGlow.displayName = "LensGlow";
