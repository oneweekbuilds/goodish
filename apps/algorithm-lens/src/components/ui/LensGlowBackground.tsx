import React from 'react';
import { cn } from '../../lib/utils';

interface LensGlowBackgroundProps {
    className?: string;
    opacity?: 'low' | 'medium' | 'high';
    blur?: 'soft' | 'medium' | 'strong';
}

/**
 * LensGlowBackground - Atmospheric background glow for hero sections
 * 
 * Features:
 * - Soft teal → indigo → mint gradient transitions
 * - Gentle vignette fading outward
 * - Opacity presets: low (20%), medium (30%), high (40%)
 * - Blur presets: soft (80px), medium (120px), strong (160px)
 * - Performance optimized with transform and will-change
 * - Positioned behind all content (use in relative container)
 */
export const LensGlowBackground = React.forwardRef<HTMLDivElement, LensGlowBackgroundProps>(
    ({ className, opacity = 'medium', blur = 'medium' }, ref) => {
        const opacityClasses = {
            low: 'opacity-20',
            medium: 'opacity-30',
            high: 'opacity-40',
        };

        const blurClasses = {
            soft: 'blur-[80px]',
            medium: 'blur-[120px]',
            strong: 'blur-[160px]',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "absolute inset-0 pointer-events-none overflow-hidden",
                    className
                )}
                style={{ zIndex: 0 }}
                aria-hidden="true"
            >
                {/* Grain Texture for Investigative Feel - More Visible */}
                <div className="absolute inset-0 lens-grain opacity-[0.15]" />

                {/* Main gradient orb - teal to indigo - larger, bolder projector effect */}
                <div
                    className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[700px] rounded-[100%]",
                        "bg-gradient-to-br from-primary-teal/70 via-primary-indigo/50 to-secondary-lavender/30",
                        opacityClasses[opacity],
                        blurClasses[blur]
                    )}
                    style={{
                        willChange: 'transform',
                        opacity: 0.35,
                    }}
                />

                {/* Secondary mint accent - softer blend */}
                <div
                    className={cn(
                        "absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-[100%]",
                        "bg-gradient-to-tr from-secondary-mint/50 to-transparent",
                        opacityClasses[opacity],
                        blurClasses[blur]
                    )}
                    style={{
                        willChange: 'transform',
                        mixBlendMode: 'overlay'
                    }}
                />

                {/* Vignette fade - subtle darkening at edges */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.8) 100%)',
                    }}
                />
            </div>
        );
    }
);

LensGlowBackground.displayName = 'LensGlowBackground';
