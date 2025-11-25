import { Clock, MousePointer, TrendingUp, Info, Zap, BarChart3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export interface AlgorithmPanelProps {
    activePost: {
        id: number;
        user: string;
        insight: string;
        engagementScore?: number;
        viewTime?: number;
        clickCount?: number;
    } | null;
    isMobile?: boolean;
}

export function AlgorithmPanel({ activePost, isMobile = false }: AlgorithmPanelProps) {
    // Default state when no post is active
    if (!activePost) {
        return (
            <div className={cn("space-y-6 transition-all duration-500", isMobile ? "" : "sticky top-24")}>
                <Card className="p-8 bg-white border border-neutral-200 rounded-2xl shadow-lg text-center">
                    <div className="w-16 h-16 mx-auto bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-neutral-graphite/30" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-neutral-graphite mb-2">
                        Waiting for input...
                    </h3>
                    <p className="text-neutral-graphite/60 leading-relaxed">
                        Scroll the feed to start the analysis. The algorithm is watching.
                    </p>
                </Card>
            </div>
        );
    }

    // Dynamic metrics from active post
    const viewTime = activePost.viewTime || 0;
    const clickCount = activePost.clickCount || 0;
    const engagementScore = activePost.engagementScore || 0;

    return (
        <div className={cn("space-y-4 transition-all duration-300", isMobile ? "" : "sticky top-24")}>

            {/* Status Header */}
            <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                        Live Analysis
                    </span>
                </div>
                <span className="text-sm font-bold px-3 py-1 bg-white/10 rounded-full border border-white/20">
                    @{activePost.user}
                </span>
            </div>

            {/* 1. What's Happening Now (Live Metrics) */}
            <Card className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-md">
                <h3 className="text-sm font-extrabold text-neutral-graphite mb-4 flex items-center gap-2 uppercase tracking-wide opacity-70">
                    <Zap className="w-4 h-4 text-accent-yellow" />
                    Current Interaction
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-primary-teal" />
                            <span className="text-xs font-bold text-neutral-graphite/60">Dwell Time</span>
                        </div>
                        <p key={viewTime} className="text-2xl font-heading font-extrabold text-neutral-graphite tabular-nums animate-in fade-in slide-in-from-bottom-1 duration-300">
                            {viewTime}s
                        </p>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="flex items-center gap-2 mb-1">
                            <MousePointer className="w-4 h-4 text-accent-blue" />
                            <span className="text-xs font-bold text-neutral-graphite/60">Clicks</span>
                        </div>
                        <p key={clickCount} className="text-2xl font-heading font-extrabold text-neutral-graphite tabular-nums animate-in fade-in slide-in-from-bottom-1 duration-300">
                            {clickCount}
                        </p>
                    </div>
                </div>

                <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-neutral-graphite/60">Interest Level</span>
                        <span className="text-xs font-bold text-primary-indigo">{engagementScore}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${engagementScore}%` }}
                        />
                    </div>
                </div>
            </Card>

            {/* 2. Algorithm Interpretation */}
            <Card className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-md">
                <h3 className="text-sm font-extrabold text-neutral-graphite mb-3 flex items-center gap-2 uppercase tracking-wide opacity-70">
                    <Info className="w-4 h-4 text-primary-indigo" />
                    System Interpretation
                </h3>
                <p className="text-base font-medium text-neutral-graphite leading-relaxed">
                    {metrics.activePostInsight || "Analyzing behavior patterns..."}
                </p>
            </Card>

            {/* 3. Combined/Session Metrics (Simulated) */}
            <Card className="p-5 bg-accent/50 border border-primary/10 rounded-2xl shadow-md">
                <h3 className="text-sm font-extrabold text-neutral-graphite mb-3 flex items-center gap-2 uppercase tracking-wide opacity-70">
                    <BarChart3 className="w-4 h-4 text-primary-teal" />
                    Session Impact
                </h3>
                <p className="text-sm text-neutral-graphite/80 leading-relaxed">
                    Your engagement here increases the likelihood of seeing <span className="font-bold text-primary-teal">wellness & productivity</span> content by <span className="font-bold">15%</span> in the next refresh.
                </p>
            </Card>
        </div>
    );
}
