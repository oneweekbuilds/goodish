/**
 * formatDuration — convert raw seconds (possibly fractional) into a clean
 * "Ns" or "Nm Ns" string for display. Centralizes the rounding so we never
 * leak floating-point seconds (e.g. "2:38.900000000000006") into the UI.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const totalSeconds = Math.round(seconds);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
