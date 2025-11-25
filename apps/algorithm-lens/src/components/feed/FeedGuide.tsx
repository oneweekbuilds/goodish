import { MousePointer, Eye, BarChart3 } from 'lucide-react';

export function FeedGuide() {
    const steps = [
        {
            icon: <MousePointer className="w-4 h-4 text-primary-teal" />,
            text: "Scroll & Explore",
            subtext: "Browse the feed naturally"
        },
        {
            icon: <Eye className="w-4 h-4 text-primary-indigo" />,
            text: "Hover or Focus",
            subtext: "See what the algorithm sees"
        },
        {
            icon: <BarChart3 className="w-4 h-4 text-accent-blue" />,
            text: "Check the Panel",
            subtext: "Get real-time insights"
        }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 py-4 px-6 bg-white/50 backdrop-blur-sm rounded-full border border-neutral-200 shadow-sm">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-150 shadow-sm">
                            {step.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-neutral-graphite leading-none mb-1">
                                {index + 1}. {step.text}
                            </span>
                            <span className="text-xs text-neutral-graphite/60 font-medium">
                                {step.subtext}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="hidden md:block w-8 h-px bg-neutral-200 ml-8" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
