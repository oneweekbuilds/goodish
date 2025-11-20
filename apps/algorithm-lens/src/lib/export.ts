import type { EventRow } from "./api";

/**
 * Extract a human-readable summary from event payload
 */
function extractSummary(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const p = payload as Record<string, unknown>;

  // Prefer payload.block?.text
  if (p.block && typeof p.block === 'object') {
    const block = p.block as Record<string, unknown>;
    if (typeof block.text === 'string' && block.text.trim().length > 0) {
      return block.text.trim();
    }
  }

  // Else payload.platformGuess
  if (typeof p.platformGuess === 'string' && p.platformGuess.trim().length > 0) {
    return p.platformGuess.trim();
  }

  // Else payload.eventType
  if (typeof p.eventType === 'string' && p.eventType.trim().length > 0) {
    return p.eventType.trim();
  }

  // Else empty string
  return '';
}

/**
 * Safely stringify payload to JSON
 */
function stringifyPayload(payload: unknown): string {
  if (payload === null || payload === undefined) {
    return '';
  }

  try {
    return JSON.stringify(payload);
  } catch {
    // Fallback for non-serializable values
    return String(payload);
  }
}

/**
 * Escape a CSV field value
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const str = String(value);
  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  // Wrap in double quotes
  return `"${escaped}"`;
}

/**
 * Convert events to CSV string
 * Columns: id, accountId, sessionId, ts, type, summary, payloadJson
 */
export function eventsToCsv(events: EventRow[], accountId?: string): string {
  const headers = ['id', 'accountId', 'sessionId', 'ts', 'type', 'summary', 'payloadJson'];
  const lines: string[] = [headers.join(',')];

  for (const event of events) {
    const row = [
      escapeCsvField(event.id),
      escapeCsvField(event.accountId || accountId || ''),
      escapeCsvField(event.sessionId),
      escapeCsvField(event.ts),
      escapeCsvField(event.type || ''),
      escapeCsvField(extractSummary(event.payload)),
      escapeCsvField(stringifyPayload(event.payload)),
    ];

    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCsvFile(csv: string, filename: string): void {
  if (!csv || csv.trim().length === 0) {
    console.warn('Attempted to download empty CSV file');
    return;
  }

  // Create Blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create object URL
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // Append to body, click, then remove
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke object URL
  URL.revokeObjectURL(url);
}





