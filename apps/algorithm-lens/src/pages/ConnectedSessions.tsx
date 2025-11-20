import { useState, useEffect, useCallback } from 'react';
import { getConnectedSettings, setConnectedSettings } from '../lib/connectedSettings';
import { fetchSessions, fetchSessionEvents, type SessionRow, type EventRow } from '../lib/api';
import { ingestEvents, type IngestSummary } from '../lib/ingestEvents';
import SessionTimeline from '../components/SessionTimeline';

export default function ConnectedSessions() {
  // Settings
  const [accountId, setAccountId] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Sessions
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [errorSessions, setErrorSessions] = useState<string | null>(null);

  // Merge state
  const [merging, setMerging] = useState<string | null>(null); // sessionId being merged
  const [mergingAll, setMergingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timeline state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<EventRow[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = getConnectedSettings();
    setAccountId(settings.accountId);
    setApiBaseUrl(settings.apiBaseUrl);
  }, []);

  // Load sessions when accountId changes
  useEffect(() => {
    if (accountId) {
      loadSessions();
    }
  }, [accountId, loadSessions]);

  /**
   * Save settings to localStorage and reload sessions
   */
  const handleSaveSettings = () => {
    setConnectedSettings({ accountId, apiBaseUrl });
    setSuccessMessage('Settings saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
    loadSessions();
  };

  /**
   * Load sessions from API
   */
  const loadSessions = useCallback(async () => {
    if (!accountId) {
      setErrorSessions('Account ID is not set. Please configure it in Settings.');
      setLoadingSessions(false);
      return;
    }

    setLoadingSessions(true);
    setErrorSessions(null);

    try {
      const sessionsList = await fetchSessions(accountId);
      setSessions(sessionsList);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sessions';
      setErrorSessions(message);
      console.error('[ConnectedSessions] Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }, [accountId]);

  /**
   * Merge a session's events into local storage
   */
  const handleMergeSession = async (session: SessionRow) => {
    setMerging(session.sessionId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!accountId) {
        throw new Error("Account ID is not set. Please configure it in Settings.");
      }

      // Fetch all events for this session (handles pagination automatically)
      const allEvents = await fetchSessionEvents(accountId, session.sessionId);

      if (allEvents.length === 0) {
        setSuccessMessage(`Session ${session.sessionId} has no events to merge.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }

      // Ingest the events into local storage
      const summary: IngestSummary = ingestEvents(accountId, allEvents);

      // Show success message
      setSuccessMessage(
        `Merged session ${session.sessionId}. Added ${summary.added}, skipped ${summary.skipped}. Total stored for account ${summary.accountId}: ${summary.totalForAccount}.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to merge events';
      setErrorMessage(message);
      console.error('[ConnectedSessions] Failed to merge session:', error);
    } finally {
      setMerging(null);
    }
  };

  /**
   * Merge all sessions into local storage
   */
  const handleMergeAll = async () => {
    if (!accountId) {
      setErrorMessage("Account ID is not set. Please configure it in Settings.");
      return;
    }
    if (!sessions || sessions.length === 0) {
      setErrorMessage("No sessions loaded. Please refresh sessions first.");
      return;
    }

    setMergingAll(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let added = 0;
      let skipped = 0;
      let finalTotal = 0;

      for (const session of sessions) {
        if (session.events === 0) continue;

        try {
          // Fetch all events for this session (handles pagination automatically)
          const allEvents = await fetchSessionEvents(accountId, session.sessionId);
          
          if (allEvents.length > 0) {
            const s = ingestEvents(accountId, allEvents);
            added += s.added;
            skipped += s.skipped;
            finalTotal = s.totalForAccount;
          }
        } catch (error) {
          console.error(`[ConnectedSessions] Failed to merge session ${session.sessionId}:`, error);
          // Continue with other sessions even if one fails
        }
      }

      setSuccessMessage(`Merged all sessions. Added ${added}, skipped ${skipped}. Total stored for account ${accountId}: ${finalTotal}.`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (e: any) {
      const message = e?.message || String(e);
      setErrorMessage(`Failed to merge all sessions: ${message}`);
      console.error('[ConnectedSessions] Failed to merge all sessions:', e);
    } finally {
      setMergingAll(false);
    }
  };

  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Format duration between timestamps
   */
  const formatDuration = (start: number, end: number | null): string => {
    if (!end) return 'Active';

    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  /**
   * View timeline for a session
   */
  const handleViewTimeline = async (sessionId: string) => {
    if (!accountId) {
      setTimelineError('Account ID is not set. Please configure it in Settings.');
      return;
    }

    setIsTimelineLoading(true);
    setTimelineError(null);
    setSelectedSessionId(sessionId);
    setTimelineEvents([]);

    try {
      const events = await fetchSessionEvents(accountId, sessionId);
      setTimelineEvents(events);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load timeline';
      setTimelineError(message);
      console.error('[ConnectedSessions] Failed to load timeline:', error);
      setTimelineEvents([]);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Connected Sessions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Connect to your ingest API to import captured content sessions
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
              Account ID
            </label>
            <input
              type="text"
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="test_user"
            />
          </div>

          <div>
            <label htmlFor="apiBaseUrl" className="block text-sm font-medium text-gray-700 mb-1">
              API Base URL
            </label>
            <input
              type="text"
              id="apiBaseUrl"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="http://localhost:5050"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Sessions and Timeline Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
            <div className="flex gap-2">
              <button
                onClick={loadSessions}
                disabled={loadingSessions || !accountId}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingSessions ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={handleMergeAll}
                disabled={mergingAll || loadingSessions || !accountId || sessions.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mergingAll ? 'Merging All...' : 'Merge All Sessions'}
              </button>
            </div>
          </div>

          {/* Error state */}
          {errorSessions && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
              <p className="text-sm text-red-800">{errorSessions}</p>
            </div>
          )}

          {/* Loading state */}
          {loadingSessions && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading sessions...</p>
            </div>
          )}

          {/* Empty state */}
          {!loadingSessions && !errorSessions && sessions.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No capture sessions found for this account
              </p>
            </div>
          )}

          {/* Sessions table */}
          {!loadingSessions && !errorSessions && sessions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(session.startedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDuration(session.startedAt, session.finishedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                        {session.deviceId.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {session.events.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewTimeline(session.sessionId)}
                            disabled={isTimelineLoading}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            View timeline
                          </button>
                          <button
                            onClick={() => handleMergeSession(session)}
                            disabled={merging === session.sessionId || session.events === 0}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {merging === session.sessionId ? 'Merging...' : 'Merge'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Timeline Card */}
        <div>
          {!selectedSessionId && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Timeline</h2>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No session selected</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Select a session to view its timeline.
                </p>
              </div>
            </div>
          )}

          {selectedSessionId && isTimelineLoading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Timeline</h2>
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-sm text-gray-600">Loading timeline...</p>
              </div>
            </div>
          )}

          {selectedSessionId && timelineError && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Timeline</h2>
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{timelineError}</p>
                <p className="text-xs text-red-600 mt-2">Could not load timeline. Please try again.</p>
              </div>
            </div>
          )}

          {selectedSessionId && !isTimelineLoading && !timelineError && (
            <SessionTimeline
              sessionId={selectedSessionId}
              events={timelineEvents}
            />
          )}
        </div>
      </div>
    </div>
  );
}
