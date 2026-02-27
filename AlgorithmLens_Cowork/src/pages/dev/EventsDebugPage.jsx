import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { getAllEvents, clearAllEvents } from '../../lib/analytics';

/**
 * EventsDebugPage - Dev-only analytics event viewer
 *
 * Accessible at /dev/events?dev=1 or in development mode
 */
const EventsDebugPage = () => {
  const [events, setEvents] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if dev mode is enabled
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    setIsAuthorized(isDev);
  }, []);

  // Load events on mount
  useEffect(() => {
    if (isAuthorized) {
      loadEvents();
    }
  }, [isAuthorized]);

  const loadEvents = () => {
    const allEvents = getAllEvents();
    setEvents(allEvents.reverse()); // Show newest first
  };

  const handleClearEvents = () => {
    if (window.confirm('Clear all tracked events?')) {
      clearAllEvents();
      setEvents([]);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[100dvh] bg-bg-page pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Not available</h1>
          <p className="text-slate-600">
            This page is only accessible in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-page pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Events</h1>
          <p className="text-slate-600">
            Internal funnel tracking (last {events.length} events)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={loadEvents}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleClearEvents}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={16} />
            Clear events
          </button>
        </div>

        {/* Events table */}
        {events.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No events tracked yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      Payload
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                        {new Date(event.ts).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {event.event}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                        {JSON.stringify(event.payload, null, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsDebugPage;
