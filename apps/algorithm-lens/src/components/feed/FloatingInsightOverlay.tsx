import { useAlgorithm } from '../../context/algorithmContext';

export function FloatingInsightOverlay() {
    const { metrics } = useAlgorithm();

    const {
        activePostId,
        activePostInsight,
        activePostTopic,
        activePostType,
        activePostPattern,
        dwellTime,
        engagementScore,
        sessionInfluence,
    } = metrics || {};

    if (!activePostId || !activePostInsight) {
        return null;
    }

    const formattedDwell = dwellTime ? dwellTime.toFixed(1) : '0.0';
    const formattedEngagement = engagementScore ? Math.round(engagementScore) : 0;
    const formattedInfluence = sessionInfluence ? Math.round(sessionInfluence) : 0;

    return (
        <div
            className="
        fixed
        bottom-4 right-4
        max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:right-auto
        max-w-xs w-full sm:w-80
        rounded-2xl
        bg-white/95
        shadow-2xl
        border border-neutral-200
        backdrop-blur-md
        p-4
        flex flex-col gap-3
        z-40
        transition-all duration-300
      "
        >
            <div className="text-xs font-medium text-teal-600 tracking-wide uppercase">
                The algorithm is watching
            </div>

            <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-900">
                    Right now, you&apos;re seeing more{' '}
                    <span className="text-indigo-600">
                        {activePostTopic || 'this type of'}
                    </span>{' '}
                    content.
                </p>
                <p className="text-xs text-neutral-600">
                    This post looks like{' '}
                    <span className="font-medium">
                        {activePostType || 'engaging'}
                    </span>{' '}
                    to the algorithm.
                </p>
                <p className="text-xs text-neutral-600">
                    {activePostInsight}
                </p>
                {activePostPattern && (
                    <p className="text-[11px] text-neutral-500 italic">
                        Pattern: {activePostPattern}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px] text-neutral-600">
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">{formattedDwell}s</span>
                    <span className="text-[10px] uppercase tracking-wide">
                        Dwell time on this post
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">
                        {formattedEngagement}/100
                    </span>
                    <span className="text-[10px] uppercase tracking-wide">
                        Engagement score
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">
                        {formattedInfluence}/100
                    </span>
                    <span className="text-[10px] uppercase tracking-wide">
                        Feed influence
                    </span>
                </div>
            </div>
        </div>
    );
}
