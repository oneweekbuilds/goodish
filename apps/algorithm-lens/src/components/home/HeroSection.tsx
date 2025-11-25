import { Play, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { LensGlowBackground } from '../ui/LensGlowBackground';

export function HeroSection() {
    return (
        <section className="relative min-h-[65vh] flex flex-col items-center justify-center text-center px-6 pt-40 pb-20 overflow-hidden">
            {/* Atmospheric Glow Background */}
            <LensGlowBackground opacity="medium" blur="medium" />

            {/* Hero Content */}
            <div className="relative z-10 max-w-5xl mx-auto space-y-10 animate-fade-in">
                {/* Main Headline - Satoshi */}
                <h1 className="font-heading text-6xl md:text-8xl font-bold text-foreground tracking-tight leading-[1.15]">
                    See what the{' '}
                    <span className="text-primary">
                        algorithm
                    </span>
                    <br />
                    sees.
                </h1>

                {/* Subheadline - Inter */}
                <p className="font-sans text-lg md:text-xl text-muted-foreground max-w-[720px] mx-auto leading-relaxed">
                    A transparent lens into your digital wellness. Understand why you see what you see.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                    <Button
                        size="lg"
                        className="rounded-lg px-10 py-7 text-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 border-none"
                    >
                        Analyze My Feed
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="rounded-lg px-10 py-7 text-xl font-semibold border border-border text-foreground hover:border-primary hover:bg-accent transition-all duration-200"
                    >
                        <Play className="w-6 h-6 mr-3 fill-current" />
                        Watch Demo
                    </Button>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex flex-col items-center gap-3 cursor-pointer animate-pulse-soft">
                    <span className="text-xs uppercase tracking-widest text-neutral-graphite font-heading font-bold">
                        Scroll to explore
                    </span>
                    <ChevronDown className="w-6 h-6 text-neutral-graphite" />
                </div>
            </div>
        </section>
    );
}
