import { useMemo, useState, useEffect } from "react";
import { getConnectedSettings } from "../lib/connectedSettings";
import { getAccountDataset, clearAccountDataset, toJSONBlob } from "../lib/dataset";
import { eventsToCsv, downloadCsvFile } from "../lib/export";
import type { EventRow } from "../lib/api";

export default function DatasetPage() {
  const [accountId, setAccountId] = useState<string>("");
  const [allEvents, setAllEvents] = useState<EventRow[]>([]);
  const [sessionFilter, setSessionFilter] = useState<string>("");
  const [sessions, setSessions] = useState<string[]>([]);
  const [info, setInfo] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const s = getConnectedSettings();
    setAccountId(s.accountId);
  }, []);

  useEffect(() => {
    if (!accountId) return;
    const ds = getAccountDataset(accountId);
    const events = ds?.events || [];
    setAllEvents(events);
    const uniqSessions = Array.from(new Set(events.map(e => e.sessionId))).sort();
    setSessions(uniqSessions);
  }, [accountId]);

  const filtered = useMemo(() => {
    if (!sessionFilter) return allEvents;
    return allEvents.filter(e => e.sessionId === sessionFilter);
  }, [allEvents, sessionFilter]);

  const total = allEvents.length;
  const distinctSessions = sessions.length;

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    try {
      const blob = toJSONBlob({ accountId, total, events: filtered });
      downloadBlob(blob, `alg_dataset_${accountId || "unknown"}${sessionFilter ? "_session-" + sessionFilter : ""}.json`);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  function handleExportAllCsv() {
    if (allEvents.length === 0) {
      setError('No events to export');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const csv = eventsToCsv(allEvents, accountId);
      const filename = `algorithmlens_dataset_${accountId || "unknown"}.csv`;
      downloadCsvFile(csv, filename);
      setInfo(`Exported ${allEvents.length} events to CSV`);
      setTimeout(() => setInfo(''), 3000);
    } catch (e: any) {
      setError(e?.message || String(e));
      setTimeout(() => setError(''), 5000);
    }
  }

  function handleExportFilteredCsv() {
    if (filtered.length === 0) {
      setError('No filtered events to export');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const csv = eventsToCsv(filtered, accountId);
      let filename: string;
      
      if (sessionFilter) {
        filename = `algorithmlens_dataset_${accountId || "unknown"}_${sessionFilter}.csv`;
      } else {
        filename = `algorithmlens_dataset_${accountId || "unknown"}_filtered.csv`;
      }
      
      downloadCsvFile(csv, filename);
      setInfo(`Exported ${filtered.length} filtered events to CSV`);
      setTimeout(() => setInfo(''), 3000);
    } catch (e: any) {
      setError(e?.message || String(e));
      setTimeout(() => setError(''), 5000);
    }
  }

  function clearDataset() {
    setError("");
    setInfo("");
    if (!accountId) {
      setError("Account ID is not set.");
      return;
    }
    const ok = window.confirm(`Clear all stored events for account "${accountId}"? This cannot be undone.`);
    if (!ok) return;
    clearAccountDataset(accountId);
    setAllEvents([]);
    setSessions([]);
    setSessionFilter("");
    setInfo("Dataset cleared.");
    setTimeout(() => setInfo(""), 3000);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-2">Dataset</h1>
      <p className="text-sm text-gray-600 mb-6">
        View and export locally stored events for the current account.
      </p>

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs text-gray-500">Account</div>
          <div className="font-mono text-sm">{accountId || "not set"}</div>
        </div>
        <div className="ml-auto flex gap-2">
          <button 
            onClick={exportJSON} 
            disabled={filtered.length === 0}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export JSON
          </button>
          <button 
            onClick={handleExportAllCsv} 
            disabled={allEvents.length === 0}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export all events (CSV)
          </button>
          <button 
            onClick={handleExportFilteredCsv} 
            disabled={filtered.length === 0 || !sessionFilter}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={!sessionFilter ? "Select a session filter to export filtered events" : `Export ${filtered.length} filtered events`}
          >
            Export filtered events (CSV)
          </button>
          <button onClick={clearDataset} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700">Clear Dataset</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <label className="text-sm">
          <span className="mr-2 text-gray-700">Filter by session:</span>
          <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="border rounded-lg px-2 py-1">
            <option value="">All sessions</option>
            {sessions.map(sid => (
              <option key={sid} value={sid}>{sid}</option>
            ))}
          </select>
        </label>
        <div className="text-sm text-gray-600">
          Total events: <span className="font-medium text-gray-900">{filtered.length.toLocaleString()}</span> (all: {total.toLocaleString()}, sessions: {distinctSessions})
        </div>
        {info && <div className="text-sm text-green-700">{info}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-700 font-medium">Events</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 border-b">ts</th>
                <th className="text-left px-4 py-2 border-b">id</th>
                <th className="text-left px-4 py-2 border-b">sessionId</th>
                <th className="text-left px-4 py-2 border-b">type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>
                    No events to display.
                  </td>
                </tr>
              ) : (
                filtered.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b whitespace-nowrap">{new Date(ev.ts).toLocaleString()}</td>
                    <td className="px-4 py-2 border-b font-mono">{ev.id}</td>
                    <td className="px-4 py-2 border-b font-mono">{ev.sessionId}</td>
                    <td className="px-4 py-2 border-b">{ev.type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
