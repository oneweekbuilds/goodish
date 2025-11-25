import { Clock, Zap, Brain, Eye, Target } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAlgorithm } from '../../context/algorithmContext';

export function InsightPanel() {
    const { metrics } = useAlgorithm();
    const {
        activePostId,
        dwellTime,
        engagementScore,
        sessionInfluence,
        activePostInsight,
        activePostTopic,
        activePostType,
        activePostPattern
    } = metrics;

    if (!activePostId) {
        return (
            <div className="space-y-6 transition-all duration-500">
                <Card className="p-8 bg-card border border-border rounded-2xl shadow-sm text-center">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Eye className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                        Start scrolling!
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        The algorithm is watching. Scroll through the posts to see what it notices.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-lg text-neutral-graphite">
                    What the algorithm sees
                </h3>
                <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* 1. Focused Post Context */}
            <Card className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-primary-indigo" />
                    <span className="text-xs font-bold text-neutral-graphite/50 uppercase tracking-wide">
                        Active Focus
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                    {activePostTopic && (
                        <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-md border border-neutral-200">
                            {activePostTopic}
                        </span>
                    )}
                    {activePostType && (
                        <span className="px-2.5 py-1 bg-neutral-50 text-neutral-500 text-xs font-medium rounded-md border border-neutral-100">
                            {activePostType}
                        </span>
                    )}
                </div>

                <p className="text-sm font-medium text-neutral-graphite leading-relaxed border-l-2 border-primary-indigo pl-3">
                    {activePostInsight || "Analyzing content context..."}
                </p>
            </Card>

            {/* 2. Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Dwell Time</span>
                    </div>
                    <p className="text-xl font-heading font-bold text-neutral-graphite tabular-nums">
                        {dwellTime.toFixed(1)}s
                    </p>
                </Card>

                <Card className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Interest</span>
                    </div>
                    <div className="flex items-end gap-1">
                        <p className="text-xl font-heading font-bold text-neutral-graphite tabular-nums">
                            {engagementScore.toFixed(0)}
                        </p>
                        <span className="text-xs font-medium text-neutral-400 mb-1">%</span>
                    </div>
                </Card>
            </div>

            {/* 3. Pattern Recognition */}
            <Card className="p-4 bg-card text-foreground rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Pattern Detected
                    </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                    {activePostPattern || "Learning your preferences..."}
                </p>

                <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground">Feed Influence</span>
                        <span className="text-[10px] font-bold text-primary">{sessionInfluence.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${Math.min(sessionInfluence, 100)}%` }}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
