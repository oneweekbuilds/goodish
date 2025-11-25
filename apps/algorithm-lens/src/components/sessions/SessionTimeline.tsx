import { useMemo } from 'react';
import type { EventRow } from '../../lib/api';

interface SessionTimelineProps {
    events: EventRow[];
    sessionId: string;
}

/**
 * Format timestamp to human-readable time
 */
function formatEventTime(ts: number): string {
    const date = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // If same day, show time only
    if (eventDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    }

    // Otherwise show date and time
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

/**
 * Extract preview text from event payload
 */
function getEventPreview(payload: unknown): string {
    if (!payload || typeof payload !== 'object') {
        return 'No preview available';
    }

    const p = payload as Record<string, unknown>;

    // Try to extract text from block.text
    if (p.block && typeof p.block === 'object') {
        const block = p.block as Record<string, unknown>;
        if (typeof block.text === 'string' && block.text.trim().length > 0) {
            const text = block.text.trim();
            return text.length > 100 ? text.substring(0, 100) + '...' : text;
        }
    }

    // Try platformGuess or type
    if (typeof p.platformGuess === 'string' && p.platformGuess.trim().length > 0) {
        return `Platform: ${p.platformGuess}`;
    }

    if (typeof p.eventType === 'string' && p.eventType.trim().length > 0) {
        return `Type: ${p.eventType}`;
    }

    // Fallback: show a snippet of the JSON
    try {
        const jsonStr = JSON.stringify(payload);
        return jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr;
    } catch {
        return 'No preview available';
    }
}

export default function SessionTimeline({ events, sessionId }: SessionTimelineProps) {
    // Sort events by timestamp ascending
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => a.ts - b.ts);
    }, [events]);

    if (sortedEvents.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Timeline</h2>
                <p className="text-sm text-gray-500 mb-4">Session ID: <span className="font-mono">{sessionId}</span></p>
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-4 text-sm font-medium text-gray-900">No events recorded</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        No events recorded for this session yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Session Timeline</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Session ID: <span className="font-mono">{sessionId}</span>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    Showing <span className="font-medium text-gray-900">{sortedEvents.length}</span> event{sortedEvents.length !== 1 ? 's' : ''} for this session
                </p>
            </div>

            <div className="relative max-h-96 overflow-y-auto">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                <div className="space-y-4 pl-8">
                    {sortedEvents.map((event) => (
                        <div key={event.id} className="relative">
                            {/* Timeline dot */}
                            <div className="absolute -left-10 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm"></div>

                            {/* Event card */}
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-medium text-gray-500">
                                                {formatEventTime(event.ts)}
                                            </span>
                                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                {event.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 break-words">
                                            {getEventPreview(event.payload)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2 font-mono">
                                            ID: {event.id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
