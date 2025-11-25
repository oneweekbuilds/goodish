import { ArrowDown, Eye, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export function FeedOnboarding() {
    const steps = [
        {
            step: 1,
            title: "Scroll the Feed",
            description: "Interact naturally. Pause where you're interested.",
            icon: ArrowDown,
            color: "text-primary-teal",
            bg: "bg-primary-teal/10"
        },
        {
            step: 2,
            title: "Watch the Lens",
            description: "See real-time metrics in the pinned panel.",
            icon: Eye,
            color: "text-primary-indigo",
            bg: "bg-primary-indigo/10"
        },
        {
            step: 3,
            title: "Understand Why",
            description: "Learn how algorithms interpret your behavior.",
            icon: Zap,
            color: "text-accent-yellow",
            bg: "bg-accent-yellow/10"
        }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto mb-12">
            <div className="text-center mb-8">
                <h3 className="font-heading text-xl font-bold text-neutral-graphite mb-2">
                    How this works
                </h3>
                <p className="text-neutral-graphite/60 max-w-lg mx-auto">
                    This mini-feed helps you understand how algorithms observe your actions.
                    If you want to analyze your REAL feed, get AlgorithmLens.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((item) => (
                    <div
                        key={item.step}
                        className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                            item.bg,
                            item.color
                        )}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-heading font-bold text-neutral-graphite mb-2">
                            {item.title}
                        </h4>
                        <p className="text-sm text-neutral-graphite/70 leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
