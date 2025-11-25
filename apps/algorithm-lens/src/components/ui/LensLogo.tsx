import React from 'react';
import { cn } from '../../lib/utils';

interface LensLogoProps {
    size?: number;
    className?: string;
    showGlow?: boolean;
}

export const LensLogo = React.forwardRef<HTMLDivElement, LensLogoProps>(
    ({ size = 32, className, showGlow = true }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("relative flex items-center justify-center", className)}
                style={{ width: size, height: size }}
            >
                {/* Soft lens glow background */}
                {showGlow && (
                    <div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-teal/20 to-primary-indigo/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            transform: 'scale(1.2)',
                        }}
                    />
                )}

                {/* Main lens circle */}
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10"
                >
                    {/* Outer lens ring - teal */}
                    <circle
                        cx="16"
                        cy="16"
                        r="13"
                        stroke="url(#lensGradient)"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* Inner iris - indigo */}
                    <circle
                        cx="16"
                        cy="16"
                        r="6"
                        fill="url(#irisGradient)"
                        opacity="0.9"
                    />

                    {/* Pupil highlight */}
                    <circle
                        cx="16"
                        cy="16"
                        r="3"
                        fill="#2E3033"
                    />

                    {/* Light reflection */}
                    <circle
                        cx="18"
                        cy="14"
                        r="1.5"
                        fill="white"
                        opacity="0.6"
                    />

                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="lensGradient" x1="0" y1="0" x2="32" y2="32">
                            <stop offset="0%" stopColor="#4AB8B0" />
                            <stop offset="100%" stopColor="#5C6BE8" />
                        </linearGradient>
                        <radialGradient id="irisGradient">
                            <stop offset="0%" stopColor="#5C6BE8" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#4AB8B0" stopOpacity="0.6" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        );
    }
);

LensLogo.displayName = 'LensLogo';
