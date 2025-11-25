import { Eye, Clock, MousePointer, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface AnalyticsMetric {
    icon: React.ReactNode;
    label: string;
    value: string;
    trend?: string;
    color: string;
}

const ANALYTICS_DATA: AnalyticsMetric[] = [
    {
        icon: <Clock className="w-5 h-5" />,
        label: "Avg. Dwell Time",
        value: "4.2s",
        trend: "+12%",
        color: "text-primary-teal",
    },
    {
        icon: <Eye className="w-5 h-5" />,
        label: "Posts Viewed",
        value: "23",
        trend: "+8%",
        color: "text-primary-indigo",
    },
    {
        icon: <MousePointer className="w-5 h-5" />,
        label: "Engagement Rate",
        value: "68%",
        trend: "+5%",
        color: "text-secondary-mint",
    },
    {
        icon: <TrendingUp className="w-5 h-5" />,
        label: "Scroll Velocity",
        value: "Fast",
        color: "text-accent-yellow",
    },
];

const INSIGHTS = [
    {
        type: "Pattern Detected",
        message: "You scroll faster through wellness content after 10 PM",
        severity: "warning",
    },
    {
        type: "Behavior Shift",
        message: "Engagement with anxiety-related posts increased 3x this week",
        severity: "info",
    },
    {
        type: "Algorithm Bias",
        message: "Your feed is 40% more dopamine-driven than average",
        severity: "alert",
    },
];

export function FeedAnalyticsPanel() {
    return (
        <div className="sticky top-24 space-y-6">
            {/* Real-time Metrics */}
            <Card className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-lg">
                <h3 className="font-heading font-extrabold text-lg text-neutral-graphite mb-6">
                    Live Analytics
                </h3>
                <div className="space-y-5">
                    {ANALYTICS_DATA.map((metric, index) => (
                        <div key={index} className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className={cn("p-2.5 rounded-xl bg-neutral-50", metric.color)}>
                                    {metric.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-graphite/60 uppercase tracking-wider">
                                        {metric.label}
                                    </p>
                                    <p className="text-2xl font-heading font-extrabold text-neutral-graphite mt-1">
                                        {metric.value}
                                    </p>
                                </div>
                            </div>
                            {metric.trend && (
                                <span className="text-xs font-bold text-primary-teal bg-primary-teal/10 px-2.5 py-1 rounded-full">
                                    {metric.trend}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Algorithmic Insights */}
            <Card className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-lg">
                <h3 className="font-heading font-extrabold text-lg text-neutral-graphite mb-6">
                    What We Detected
                </h3>
                <div className="space-y-4">
                    {INSIGHTS.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <AlertCircle className={cn(
                                "w-5 h-5 flex-shrink-0 mt-0.5",
                                insight.severity === "alert" ? "text-red-500" :
                                    insight.severity === "warning" ? "text-accent-yellow" :
                                        "text-primary-indigo"
                            )} />
                            <div>
                                <p className="text-xs font-extrabold text-neutral-graphite/70 uppercase tracking-widest mb-1">
                                    {insight.type}
                                </p>
                                <p className="text-sm font-medium text-neutral-graphite leading-relaxed">
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Privacy Notice */}
            <div className="px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-150">
                <p className="text-xs text-neutral-graphite/60 leading-relaxed">
                    <span className="font-bold">Privacy:</span> All analytics are simulated for demonstration.
                    Real data stays on your device.
                </p>
            </div>
        </div>
    );
}
